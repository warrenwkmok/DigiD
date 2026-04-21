import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  digestCanonicalPayload,
  DIGID_V03_CRYPTOSUITE_ID,
  DIGID_V03_DIGEST_ALGORITHM,
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
  digestSpkiDerBase64,
  evaluateDelegationScope,
  evaluateFreshness,
  evaluateKeyBinding,
  evaluateOwnerBinding,
  resolveVerifierPolicy,
  summarizeAuthorityScopeConflict
} from "./policy.js";
import { evaluateSigningKeyLifecycle } from "./key-lifecycle.js";
import { derivePortableResultContract } from "./contract.js";
import { evaluateFixtureExpectations } from "./expectations.js";

const REVOCATION_BACKDATE_SKEW_SECONDS = 300;

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
    case "dgd.key_authorization":
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

function resolveEffectiveRevokedAt(revocation, warnings) {
  const revokedAt = asInstant(revocation?.revoked_at ?? null);
  if (!revokedAt) {
    return null;
  }

  const createdAt = asInstant(revocation?.created_at ?? null);
  if (!createdAt) {
    warnings.push(buildWarning("revocation-created-at-missing", "Revocation missing created_at; effective timing is ambiguous"));
    return revokedAt;
  }

  const maxSkewMs = REVOCATION_BACKDATE_SKEW_SECONDS * 1000;
  if (revokedAt < createdAt - maxSkewMs) {
    warnings.push(
      buildWarning(
        "revocation-backdated",
        "Revocation revoked_at predates issuance; treating effective revocation time as created_at"
      )
    );
  }

  return revokedAt < createdAt ? createdAt : revokedAt;
}

function resolveKeyAuthorizationForSigningKey({
  graph,
  issuerId,
  subjectId,
  delegationId,
  signingKeyKid,
  signingKeyDigest,
  eventTime,
  verificationTime,
  warnings
}) {
  if (!issuerId || !subjectId || !delegationId || !signingKeyKid || !signingKeyDigest) {
    return {
      authorization: null,
      active_at_event_time: false,
      active_now: false,
      revocation_effective_at: null
    };
  }

  const candidates = graph.objects.filter((candidate) => candidate.object_type === "dgd.key_authorization");
  for (const candidate of candidates) {
    if (candidate.issuer_id !== issuerId) {
      continue;
    }

    if (candidate.subject_id !== subjectId) {
      continue;
    }

    if (candidate.delegation_id !== delegationId) {
      continue;
    }

    const binding = candidate.authorized_key ?? null;
    const boundKid = typeof binding?.kid === "string" ? binding.kid : null;
    const boundDigest = typeof binding?.public_key_digest === "string" ? binding.public_key_digest : null;

    if (boundKid !== signingKeyKid) {
      continue;
    }

    if (boundDigest !== signingKeyDigest) {
      continue;
    }

    const crypto = graph.cryptoById.get(candidate.object_id);
    if (!crypto?.proof_valid) {
      continue;
    }

    const revocation = graph.objects.find(
      (entry) =>
        entry.object_type === "dgd.revocation" &&
        entry.target_object_type === "dgd.key_authorization" &&
        entry.target_object_id === candidate.object_id
    );
    const revocationEffectiveAt = revocation ? resolveEffectiveRevokedAt(revocation, warnings) : null;
    const activeAtEventTime = Boolean(
      isActiveInWindow(candidate, eventTime) && (!revocationEffectiveAt || eventTime < revocationEffectiveAt)
    );
    const activeNow = Boolean(
      isActiveInWindow(candidate, verificationTime) && (!revocationEffectiveAt || verificationTime < revocationEffectiveAt)
    );

    return {
      authorization: candidate,
      active_at_event_time: activeAtEventTime,
      active_now: activeNow,
      revocation_effective_at: revocationEffectiveAt
    };
  }

  return {
    authorization: null,
    active_at_event_time: false,
    active_now: false,
    revocation_effective_at: null
  };
}

function parseDigestAlgorithm(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const index = value.indexOf(":");
  if (index <= 0) {
    return null;
  }

  return value.slice(0, index);
}

function validateDigestValue(value, label, errors) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    errors.push(`${label} digest must be a string`);
    return null;
  }

  const index = value.indexOf(":");
  if (index <= 0) {
    errors.push(`${label} digest missing algorithm prefix`);
    return null;
  }

  const algorithm = value.slice(0, index);
  const hex = value.slice(index + 1);

  if (algorithm !== DIGID_V03_DIGEST_ALGORITHM) {
    errors.push(`${label} digest uses unsupported algorithm: ${algorithm}`);
    return algorithm;
  }

  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    errors.push(`${label} digest must be 64 hex chars for ${algorithm}`);
  }

  return algorithm;
}

export async function verifyFixtureManifest(manifestPath, options = {}) {
  const { manifest, repoRoot } = await loadFixtureManifest(manifestPath);
  const verificationTime = asInstant(options.verificationTime ?? manifest.verification_time ?? "2026-04-15T00:05:00Z");
  const entries = [...manifest.objects, ...(manifest.optional_objects ?? [])];
  const graph = {
    byId: new Map(),
    objects: [],
    envelopes: [],
    roles: new Map(),
    cryptoById: new Map()
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

      const keyRecord = verifyProof(document, signerIdentity);
      graph.cryptoById.set(document.object_id ?? document.envelope_id, {
        proof_valid: true,
        cryptosuite: document.proof.cryptosuite ?? null,
        proof_type: document.proof.type,
        canonicalization: document.proof.canonicalization,
        kid: document.proof.kid,
        key_algorithm: keyRecord.algorithm ?? null,
        key_status: keyRecord.status ?? null,
        key_purposes: Array.isArray(keyRecord.purposes) ? [...keyRecord.purposes] : null,
        key_created_at: keyRecord.created_at ?? null,
        key_not_before: keyRecord.not_before ?? null,
        key_expires_at: keyRecord.expires_at ?? null
      });
    } catch (error) {
      const documentId = document.object_id ?? document.envelope_id;
      errors.push(`${documentId}: ${error.message}`);
      graph.cryptoById.set(documentId, {
        proof_valid: false,
        cryptosuite: document.proof?.cryptosuite ?? null,
        proof_type: document.proof?.type ?? null,
        canonicalization: document.proof?.canonicalization ?? null,
        kid: document.proof?.kid ?? null,
        key_algorithm: null,
        key_status: null,
        key_purposes: null,
        key_created_at: null,
        key_not_before: null,
        key_expires_at: null,
        error: error.message
      });
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

  const digestAlgorithms = new Set();
  for (const envelope of graph.envelopes) {
    if (envelope.envelope_type === "dgd.event") {
      const digestAlgorithm = validateDigestValue(envelope.payload_digest, `${envelope.envelope_id}.payload_digest`, errors);
      if (digestAlgorithm) {
        digestAlgorithms.add(digestAlgorithm);
      }
      continue;
    }

    if (envelope.envelope_type === "dgd.message") {
      const contentDigest = envelope.payload?.content_digest ?? null;
      const digestAlgorithm = validateDigestValue(contentDigest, `${envelope.envelope_id}.payload.content_digest`, errors);
      if (digestAlgorithm) {
        digestAlgorithms.add(digestAlgorithm);
      }
    }
  }

  if (communication?.payload?.content_digest) {
    const digestAlgorithm = validateDigestValue(communication.payload.content_digest, `${communication.object_id}.payload.content_digest`, errors);
    if (digestAlgorithm) {
      digestAlgorithms.add(digestAlgorithm);
    }
  }

  const signerIdentity = communication ? graph.byId.get(communication.sender.identity_id) : null;
  const operatorIdentity = communication?.operator_id ? graph.byId.get(communication.operator_id) : null;
  const attestation =
    graph.roles.get("agent_attestation") ??
    graph.roles.get("human_attestation") ??
    graph.objects.find((candidate) => candidate.object_type === "dgd.attestation" && candidate.subject_id === signerIdentity?.object_id);
  const delegation = communication?.delegation_id ? graph.byId.get(communication.delegation_id) : null;
  const delegationRevocation = graph.objects.find(
    (candidate) =>
      candidate.object_type === "dgd.revocation" &&
      candidate.target_object_type === "dgd.delegation" &&
      candidate.target_object_id === delegation?.object_id
  );
  const delegationRevocationEffectiveAt = delegationRevocation ? resolveEffectiveRevokedAt(delegationRevocation, warnings) : null;
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

  const signatureValid = [...graph.cryptoById.values()].every((entry) => entry.proof_valid);
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
  const delegationActiveAtEventTime = delegationRequired
    ? Boolean(delegation && isActiveInWindow(delegation, eventTime) && (!delegationRevocationEffectiveAt || eventTime < delegationRevocationEffectiveAt))
    : true;
  const delegationActiveNow = delegationRequired
    ? Boolean(
        delegation &&
          isActiveInWindow(delegation, verificationTime) &&
          (!delegationRevocationEffectiveAt || verificationTime < delegationRevocationEffectiveAt)
      )
    : true;
  const freshnessStatus = evaluateFreshness(delegation ?? attestation ?? signerIdentity?.keys?.[0], verificationTime, maxAgeSeconds);
  const ownerBinding = evaluateOwnerBinding({ signerIdentity, operatorIdentity, attestation, delegation, communication });
  const authorityScope = evaluateDelegationScope({ communication, delegation, envelopes: graph.envelopes });
  const delegationRevokedNow = Boolean(delegationRevocationEffectiveAt && verificationTime >= delegationRevocationEffectiveAt);
  const revocationStatus = delegationRevokedNow ? "revoked" : freshnessStatus === "unknown" ? "unknown" : freshnessStatus === "stale" ? "stale" : "clear";

  const communicationCrypto = communication ? graph.cryptoById.get(communication.object_id) : null;
  const signingKeyKid = communicationCrypto?.kid ?? null;
  const keyBinding = evaluateKeyBinding({ signerIdentity, attestation, delegation, communication, signingKeyKid });
  const signingKeyRecord = signingKeyKid ? signerIdentity?.keys?.find((candidate) => candidate.kid === signingKeyKid) ?? null : null;
  const signingKeyDigest = signingKeyRecord?.public_key ? digestSpkiDerBase64(signingKeyRecord.public_key) : null;
  const keyAuthorizationEvaluation =
    delegationRequired && delegation && keyBinding.status === "missing"
      ? resolveKeyAuthorizationForSigningKey({
          graph,
          issuerId: delegation.issuer_id ?? null,
          subjectId: signerIdentity?.object_id ?? null,
          delegationId: delegation.object_id ?? null,
          signingKeyKid,
          signingKeyDigest,
          eventTime,
          verificationTime,
          warnings
        })
      : { authorization: null, active_at_event_time: false, active_now: false, revocation_effective_at: null };
  const keyAuthorization = keyAuthorizationEvaluation.authorization;
  const keyAuthorizationActiveAtEventTime = keyAuthorizationEvaluation.active_at_event_time;
  const keyAuthorizationActiveNow = keyAuthorizationEvaluation.active_now;
  const keyAuthorizationRevocationEffectiveAt = keyAuthorizationEvaluation.revocation_effective_at;

  let keyAuthorizationStatus = "not-required";
  const keyAuthorizationReasons = [];
  if (delegationRequired && delegation && keyBinding.status === "missing") {
    if (!keyAuthorization) {
      keyAuthorizationStatus = "missing";
    } else if (!keyAuthorizationActiveAtEventTime) {
      keyAuthorizationStatus = "inactive-at-event-time";
      if (keyAuthorizationRevocationEffectiveAt && eventTime >= keyAuthorizationRevocationEffectiveAt) {
        keyAuthorizationReasons.push("revoked-at-event-time");
      } else {
        keyAuthorizationReasons.push("inactive-at-event-time");
      }
    } else if (keyAuthorizationActiveAtEventTime && !keyAuthorizationActiveNow) {
      keyAuthorizationStatus = "expired-current-time";
      if (keyAuthorizationRevocationEffectiveAt && verificationTime >= keyAuthorizationRevocationEffectiveAt) {
        keyAuthorizationReasons.push("revoked-current-time");
      } else {
        keyAuthorizationReasons.push("inactive-current-time");
      }
    } else {
      keyAuthorizationStatus = "active";
    }
  }

  const signingKeyRevocation = signingKeyKid
    ? graph.objects.find(
        (candidate) =>
          candidate.object_type === "dgd.revocation" &&
          candidate.target_object_type === "dgd.signing_key" &&
          candidate.target_object_id === signingKeyKid
      )
    : null;
  const signingKeyRevocationEffectiveAt = signingKeyRevocation ? resolveEffectiveRevokedAt(signingKeyRevocation, warnings) : null;
  const signingKeyRevokedAtEventTime = Boolean(signingKeyRevocationEffectiveAt && eventTime >= signingKeyRevocationEffectiveAt);
  const signingKeyRevokedNow = Boolean(signingKeyRevocationEffectiveAt && verificationTime >= signingKeyRevocationEffectiveAt);
  const signingKeyRevocationEventTimeStatus = !signingKeyKid ? "unknown" : signingKeyRevokedAtEventTime ? "revoked" : "clear";
  const signingKeyRevocationCurrentTimeStatus = !signingKeyKid ? "unknown" : signingKeyRevokedNow ? "revoked" : "clear";

  const signingKeyLifecycle = evaluateSigningKeyLifecycle(
    communicationCrypto
      ? {
          status: communicationCrypto.key_status,
          purposes: communicationCrypto.key_purposes,
          created_at: communicationCrypto.key_created_at,
          not_before: communicationCrypto.key_not_before,
          expires_at: communicationCrypto.key_expires_at
        }
      : null,
    { eventTime, verificationTime, requiredPurpose: "assertion" }
  );
  const signingKeyPurposeValid = signingKeyLifecycle.purpose_status === "authorized";
  const signingKeyValidAtEventTime =
    signingKeyPurposeValid && signingKeyLifecycle.event_time_status === "valid" && signingKeyRevocationEventTimeStatus !== "revoked";
  const signingKeyActiveNow =
    signingKeyPurposeValid && signingKeyLifecycle.current_time_status === "active" && signingKeyRevocationCurrentTimeStatus !== "revoked";

  if (communication && !signingKeyPurposeValid) {
    errors.push(`${communication.object_id}: Signing key is not authorized for assertion`);
  } else if (communication && signingKeyLifecycle.event_time_status !== "valid") {
    errors.push(`${communication.object_id}: Signing key was not valid at event time`);
  } else if (communication && signingKeyRevocationEventTimeStatus === "revoked") {
    errors.push(`${communication.object_id}: Signing key was revoked at event time`);
  }

  if (communication && signingKeyValidAtEventTime && !signingKeyActiveNow) {
    if (signingKeyRevocationCurrentTimeStatus === "revoked") {
      warnings.push(buildWarning("signing-key-revoked-current-time", "Signing key revoked"));
    } else {
      warnings.push(buildWarning("signing-key-inactive-current-time", "Signing key no longer active"));
    }
  }

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

  if (keyBinding.status === "missing" && !keyAuthorizationActiveAtEventTime) {
    warnings.push(buildWarning(keyBinding.warning_code ?? "key-binding-missing", keyBinding.warning_message ?? "Delegated signing key binding missing"));
  }

  if (keyAuthorization && keyAuthorizationActiveAtEventTime && !keyAuthorizationActiveNow) {
    warnings.push(buildWarning("key-authorization-expired-current-time", "Authorized signing key no longer active"));
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
  const delegatedSigningKeyValidAtEventTime = keyBinding.status !== "missing" || keyAuthorizationActiveAtEventTime;
  const delegatedSigningKeyValidNow = keyBinding.status !== "missing" || keyAuthorizationActiveNow;
  const authorityScopeValid = !delegationRequired || authorityScope.status === "in-scope";
  const eventTimeValid = Boolean(
    signatureValid &&
      signerActiveAtEventTime &&
      signingKeyValidAtEventTime &&
      delegationActiveAtEventTime &&
      identityTrustedAtEventTime &&
      ownerBindingValid &&
      delegatedSigningKeyValidAtEventTime &&
      authorityScopeValid
  );
  const currentTimeValid = Boolean(
    signatureValid &&
      signerActiveNow &&
      signingKeyActiveNow &&
      delegationActiveNow &&
      identityTrustedNow &&
      ownerBindingValid &&
      delegatedSigningKeyValidNow &&
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
    delegatedSigningKeyValidAtEventTime &&
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
      crypto_suite: DIGID_V03_CRYPTOSUITE_ID,
      signature_cryptosuite: communicationCrypto?.cryptosuite ?? null,
      signature_proof_type: communicationCrypto?.proof_type ?? null,
      canonicalization: communicationCrypto?.canonicalization ?? null,
      signing_key_kid: communicationCrypto?.kid ?? null,
      signing_key_algorithm: communicationCrypto?.key_algorithm ?? null,
      signing_key_status: communicationCrypto?.key_status ?? null,
      signing_key_purpose_status: signingKeyLifecycle.purpose_status,
      signing_key_purpose_reasons: signingKeyLifecycle.purpose_reasons,
      signing_key_event_time_status: signingKeyLifecycle.event_time_status,
      signing_key_event_time_reasons: signingKeyLifecycle.event_time_reasons,
      signing_key_current_time_status: signingKeyLifecycle.current_time_status,
      signing_key_current_time_reasons: signingKeyLifecycle.current_time_reasons,
      signing_key_revocation_event_time_status: signingKeyRevocationEventTimeStatus,
      signing_key_revocation_current_time_status: signingKeyRevocationCurrentTimeStatus,
      signing_key_revocation_effective_at: signingKeyRevocationEffectiveAt ? new Date(signingKeyRevocationEffectiveAt).toISOString() : null,
      digest_algorithms: [...digestAlgorithms].sort(),
      owner_binding_status: ownerBinding.status,
      owner_binding_reasons: ownerBinding.reasons,
      key_binding_status: keyBinding.status === "missing" && keyAuthorizationActiveAtEventTime ? "bound" : keyBinding.status,
      key_binding_method:
        keyBinding.status !== "missing"
          ? "embedded"
          : keyAuthorizationActiveAtEventTime
            ? "key-authorization"
            : null,
      key_binding_reasons: keyBinding.status === "missing" && keyAuthorizationActiveAtEventTime ? [] : keyBinding.reasons,
      key_authorization_status: keyAuthorizationStatus,
      key_authorization_object_id: keyAuthorization?.object_id ?? null,
      key_authorization_reasons: keyAuthorizationReasons,
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
