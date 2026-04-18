import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  digestCanonicalPayload,
  parseDigiDEnvelope,
  parseDigiDObject,
  validateCommunicationLineage,
  validateEnvelopeShape,
  validateObjectShape,
  verifyProof
} from "../../protocol/src/index.js";
import { deriveCompactBanner } from "./display.js";
import { loadFixtureManifest } from "./manifest.js";
import {
  asInstant,
  evaluateDelegationScope,
  evaluateFreshness,
  evaluateOwnerBinding,
  resolveVerifierPolicy,
  summarizeAuthorityScopeConflict
} from "./policy.js";
import { derivePortableResultContract } from "./contract.js";
import { evaluateFixtureExpectations } from "./expectations.js";

function resolveSignerId(document, graph) {
  if (document.envelope_type === "dgd.message") {
    return document.sender_id;
  }

  if (document.envelope_type === "dgd.event") {
    return document.actor_id;
  }

  switch (document.object_type) {
    case "dgd.identity":
      return document.controller?.controller_id ?? document.object_id;
    case "dgd.attestation":
    case "dgd.delegation":
    case "dgd.revocation":
      return document.issuer_id;
    case "dgd.communication":
      return document.sender.identity_id;
    case "dgd.session":
      return graph.byId.get(document.communication_id)?.sender?.identity_id;
    case "dgd.artifact":
      return graph.byId.get(document.communication_id)?.sender?.identity_id;
    default:
      return null;
  }
}

function isActiveInWindow(document, when) {
  if (!document) {
    return false;
  }

  if (document.status && !["active", "self-asserted"].includes(document.status)) {
    return false;
  }

  const validFrom = asInstant(document.valid_from ?? document.created_at ?? document.timestamps?.created_at);
  const validUntil = asInstant(document.valid_until ?? document.expires_at ?? null);

  if (validFrom && when < validFrom) {
    return false;
  }

  if (validUntil && when > validUntil) {
    return false;
  }

  return true;
}
function checkReplay(envelopes) {
  const seenEnvelopeIds = new Set();
  const seenSequences = new Set();

  for (const envelope of envelopes) {
    if (seenEnvelopeIds.has(envelope.envelope_id)) {
      return "replay-suspected";
    }

    seenEnvelopeIds.add(envelope.envelope_id);

    if (envelope.envelope_type === "dgd.event" && envelope.sequence !== undefined) {
      const key = `${envelope.conversation_id}:${envelope.sequence}`;
      if (seenSequences.has(key)) {
        return "replay-suspected";
      }
      seenSequences.add(key);
    }
  }

  return "clear";
}

function checkEventPayloadDigests(envelopes) {
  const errors = [];

  for (const envelope of envelopes) {
    if (envelope.envelope_type === "dgd.event") {
      const actualDigest = digestCanonicalPayload(envelope.payload);
      if (actualDigest !== envelope.payload_digest) {
        errors.push(`${envelope.envelope_id} payload_digest mismatch`);
      }
    }
  }

  return errors;
}

function buildWarning(code, message) {
  return { code, message };
}

export async function verifyFixtureManifest(manifestPath, options = {}) {
  const { manifest, repoRoot } = await loadFixtureManifest(manifestPath);
  const verificationTime = asInstant(options.verificationTime ?? manifest.verification_time ?? "2026-04-15T00:05:00Z");
  const entries = [...manifest.objects, ...(manifest.optional_objects ?? [])];
  const graph = {
    byId: new Map(),
    objects: [],
    envelopes: [],
    roles: new Map()
  };
  const errors = [];
  const warnings = [];

  for (const entry of entries) {
    const absolute = path.resolve(repoRoot, entry.path);
    let document;

    try {
      document = JSON.parse(await readFile(absolute, "utf8"));
    } catch (error) {
      if (entry.required !== false) {
        errors.push(`Failed to load ${entry.role} from ${entry.path}: ${error.message}`);
      }
      continue;
    }

    try {
      if (document.object_type) {
        validateObjectShape(parseDigiDObject(document));
        graph.objects.push(document);
        graph.byId.set(document.object_id, document);
      } else {
        validateEnvelopeShape(parseDigiDEnvelope(document));
        graph.envelopes.push(document);
        graph.byId.set(document.envelope_id, document);
      }
      graph.roles.set(entry.role, document);
    } catch (error) {
      errors.push(`${entry.path}: ${error.message}`);
    }
  }

  for (const document of [...graph.objects, ...graph.envelopes]) {
    try {
      const signerId = resolveSignerId(document, graph);
      if (!signerId) {
        throw new Error("Unable to resolve signer identity");
      }

      const signerIdentity = graph.byId.get(signerId);
      if (!signerIdentity) {
        throw new Error(`Signer identity ${signerId} not found`);
      }

      verifyProof(document, signerIdentity);
    } catch (error) {
      errors.push(`${document.object_id ?? document.envelope_id}: ${error.message}`);
    }
  }

  errors.push(...checkEventPayloadDigests(graph.envelopes));

  const communication = graph.roles.get("communication_anchor") ?? graph.objects.find((candidate) => candidate.object_type === "dgd.communication");
  const session = graph.roles.get("session_object") ?? graph.objects.find((candidate) => candidate.object_type === "dgd.session");
  errors.push(...validateCommunicationLineage({ communication, session, envelopes: graph.envelopes }));

  const replayStatus = checkReplay(graph.envelopes);
  if (replayStatus !== "clear") {
    errors.push("Replay-suspicious envelope sequence detected");
  }

  const signerIdentity = communication ? graph.byId.get(communication.sender.identity_id) : null;
  const operatorIdentity = communication?.operator_id ? graph.byId.get(communication.operator_id) : null;
  const attestation =
    graph.roles.get("agent_attestation") ??
    graph.roles.get("human_attestation") ??
    graph.objects.find((candidate) => candidate.object_type === "dgd.attestation" && candidate.subject_id === signerIdentity?.object_id);
  const delegation = communication?.delegation_id ? graph.byId.get(communication.delegation_id) : null;
  const revocation = graph.objects.find((candidate) => candidate.object_type === "dgd.revocation" && candidate.target_object_id === delegation?.object_id);
  const eventEnvelope = graph.envelopes.find((candidate) => candidate.envelope_type === "dgd.event");
  const eventTime = asInstant(eventEnvelope?.created_at ?? communication?.timestamps?.session_started_at ?? communication?.created_at);
  const policy = resolveVerifierPolicy(manifest, communication);
  const maxAgeSeconds = policy.revocation_max_age_seconds;
  const manifestTrustedIssuers = manifest?.verification_defaults?.trusted_issuer_ids;
  const defaultTrustedIssuer = graph.roles.get("organization_identity")?.object_id ?? null;
  const trustedIssuerIds = new Set(
    Array.isArray(manifestTrustedIssuers)
      ? manifestTrustedIssuers.filter((entry) => typeof entry === "string" && entry.length > 0)
      : defaultTrustedIssuer
        ? [defaultTrustedIssuer]
        : []
  );

  const signatureValid = errors.filter((entry) => entry.includes("Signature verification failed")).length === 0;
  const signerActiveAtEventTime = signerIdentity ? isActiveInWindow(signerIdentity, eventTime) : false;
  const signerActiveNow = signerIdentity ? isActiveInWindow(signerIdentity, verificationTime) : false;
  const attestationActiveAtEventTime = attestation ? isActiveInWindow(attestation, eventTime) : false;
  const attestationActiveNow = attestation ? isActiveInWindow(attestation, verificationTime) : false;
  const attestationIssuerTrusted = attestation ? trustedIssuerIds.has(attestation.issuer_id) : true;
  const signerPinned = Boolean(signerIdentity && trustedIssuerIds.has(signerIdentity.object_id));
  const identityTrustedAtEventTime =
    signerIdentity?.identity_class === "organization"
      ? signerPinned
      : Boolean(attestation && attestationActiveAtEventTime && attestationIssuerTrusted);
  const identityTrustedNow =
    signerIdentity?.identity_class === "organization"
      ? signerPinned
      : Boolean(attestation && attestationActiveNow && attestationIssuerTrusted);
  const delegationRequired = Boolean(communication?.operator_id || communication?.delegation_id);
  const delegationActiveAtEventTime = delegationRequired ? Boolean(delegation && isActiveInWindow(delegation, eventTime) && (!revocation || eventTime < asInstant(revocation.revoked_at))) : true;
  const delegationActiveNow = delegationRequired ? Boolean(delegation && isActiveInWindow(delegation, verificationTime) && (!revocation || verificationTime < asInstant(revocation.revoked_at))) : true;
  const freshnessStatus = evaluateFreshness(delegation ?? attestation ?? signerIdentity?.keys?.[0], verificationTime, maxAgeSeconds);
  const ownerBinding = evaluateOwnerBinding({ signerIdentity, operatorIdentity, attestation, delegation, communication });
  const authorityScope = evaluateDelegationScope({ communication, delegation, envelopes: graph.envelopes });
  const revocationStatus = revocation ? "revoked" : freshnessStatus === "unknown" ? "unknown" : freshnessStatus === "stale" ? "stale" : "clear";

  if (attestation && !attestationIssuerTrusted) {
    warnings.push(
      buildWarning(
        "issuer-untrusted",
        "Attestation issuer is not trusted by verifier policy"
      )
    );
  }

  if (freshnessStatus === "stale") {
    warnings.push(buildWarning("revocation-stale", "Verification stale, re-check recommended"));
  } else if (freshnessStatus === "unknown") {
    warnings.push(buildWarning("revocation-unknown", "Revocation status unavailable"));
  }

  if (delegationRequired && !delegation) {
    warnings.push(buildWarning("authority-incomplete", "Signature valid, authority not proven"));
  }

  if (ownerBinding.status === "missing") {
    warnings.push(buildWarning("owner-binding-missing", "Agent signature not bound to verified owner"));
  }

  if (authorityScope.status === "out-of-scope") {
    warnings.push(
      buildWarning(
        "delegation-scope-conflict",
        summarizeAuthorityScopeConflict(authorityScope.reasons)
      )
    );
  }

  if (delegationRequired && delegation && !delegationActiveNow && delegationActiveAtEventTime) {
    warnings.push(buildWarning("delegation-expired-current-time", "Delegation no longer active"));
  }

  const ownerBindingValid = ownerBinding.status !== "missing";
  const authorityScopeValid = !delegationRequired || authorityScope.status === "in-scope";
  const eventTimeValid = Boolean(
    signatureValid &&
      signerActiveAtEventTime &&
      delegationActiveAtEventTime &&
      identityTrustedAtEventTime &&
      ownerBindingValid &&
      authorityScopeValid
  );
  const currentTimeValid = Boolean(
    signatureValid &&
      signerActiveNow &&
      delegationActiveNow &&
      identityTrustedNow &&
      ownerBindingValid &&
      authorityScopeValid &&
      freshnessStatus !== "unknown"
  );

  let resolvedTrustState = "unverified";
  if (signerIdentity?.identity_class === "human" && identityTrustedAtEventTime) {
    resolvedTrustState = "verified-human";
  } else if (signerIdentity?.identity_class === "organization" && identityTrustedAtEventTime) {
    resolvedTrustState = "verified-organization";
  } else if (
    signerIdentity?.identity_class === "agent" &&
    identityTrustedAtEventTime &&
    delegationRequired &&
    delegationActiveAtEventTime &&
    ownerBindingValid &&
    authorityScopeValid
  ) {
    resolvedTrustState = operatorIdentity?.identity_class === "organization" ? "org-issued-agent" : "delegated-agent";
  } else if (signerIdentity?.identity_class === "agent" && identityTrustedAtEventTime) {
    resolvedTrustState = "verified-agent";
  }

  let decision = "allow-with-trust-indicator";
  if (errors.length > 0) {
    decision = "reject";
  } else if (!eventTimeValid || (delegationRequired && !delegation)) {
    decision = "degraded-trust";
  } else if (!currentTimeValid || freshnessStatus !== "fresh" || warnings.length > 0) {
    decision = "allow-with-warning";
  }

  const result = {
    manifest_id: manifest.manifest_id,
    scenario_id: manifest.scenario_id,
    verified_at: new Date(verificationTime).toISOString(),
    decision,
    resolved_trust_state: resolvedTrustState,
    expected_outcome: manifest.expected_outcome ?? null,
    verification_mode: policy.verification_mode,
    policy,
    signer_identity: signerIdentity,
    operator_identity: operatorIdentity,
    communication,
    checks: {
      signature_valid: signatureValid,
      event_time_valid: eventTimeValid,
      current_time_valid: currentTimeValid,
      owner_binding_status: ownerBinding.status,
      owner_binding_reasons: ownerBinding.reasons,
      authority_scope_status: authorityScope.status,
      authority_scope_reasons: authorityScope.reasons,
      revocation_status: revocationStatus,
      freshness_status: freshnessStatus,
      replay_status: replayStatus,
      issuer_trust_status: attestation
        ? attestationIssuerTrusted
          ? "trusted"
          : "untrusted"
        : signerIdentity?.identity_class === "organization"
          ? signerPinned
            ? "pinned"
            : "untrusted"
          : "not-required"
    },
    warnings,
    errors,
    compactBanner: null,
    expectations: null,
    portable_result_contract: null
  };

  result.compactBanner = deriveCompactBanner(result);
  result.expectations = evaluateFixtureExpectations(result, manifest.expected_outcome);
  result.portable_result_contract = derivePortableResultContract(result);
  return result;
}
