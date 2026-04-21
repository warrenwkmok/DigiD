import { summarizeAuthorityScopeConflict } from "./policy.js";

export function deriveCompactBanner(result) {
  const warningCodes = new Set(result.warnings.map((warning) => warning.code));

  if (warningCodes.has("delegation-expired-current-time")) {
    return "Delegation no longer active";
  }

  if (warningCodes.has("key-authorization-expired-current-time")) {
    return "Authorized signing key no longer active";
  }

  if (warningCodes.has("signing-key-revoked-current-time")) {
    return "Signing key revoked";
  }

  if (warningCodes.has("signing-key-inactive-current-time")) {
    return "Signing key no longer active";
  }

  if (warningCodes.has("issuer-untrusted")) {
    return "Signature valid, issuer not trusted";
  }

  if (warningCodes.has("authority-incomplete")) {
    return "Signature valid, authority not proven";
  }

  if (warningCodes.has("owner-binding-missing")) {
    return "Agent signature not bound to verified owner";
  }

  if (warningCodes.has("key-binding-mismatch")) {
    return "Delegated signing key not bound by issuer";
  }

  if (warningCodes.has("key-binding-missing")) {
    return "Delegated signing key binding missing";
  }

  if (warningCodes.has("delegation-scope-conflict")) {
    return summarizeAuthorityScopeConflict(result.checks.authority_scope_reasons, { compact: true });
  }

  if (warningCodes.has("revocation-stale")) {
    return "Verification stale, re-check recommended";
  }

  if (result.errors.length > 0) {
    return "Verification failed";
  }

  switch (result.resolved_trust_state) {
    case "org-issued-agent":
      return `Org-issued agent for ${result.operator_identity?.display_name ?? "unknown operator"}`;
    case "delegated-agent":
      return `Delegated agent for ${result.operator_identity?.display_name ?? "unknown operator"}`;
    case "verified-human":
      return "Verified human";
    case "verified-organization":
      return "Verified organization";
    case "verified-agent":
      return "Verified agent";
    case "unverified":
      return "Unverified sender";
    default:
      return "Signature valid, authority not proven";
  }
}

export function renderExpandedDetails(result) {
  const ownerBindingReasons = result.checks.owner_binding_reasons?.join(", ") || "none";
  const keyBindingReasons = result.checks.key_binding_reasons?.join(", ") || "none";
  const keyAuthorizationReasons = result.checks.key_authorization_reasons?.join(", ") || "none";
  const authorityScopeReasons = result.checks.authority_scope_reasons?.join(", ") || "none";
  const showCryptoDetails = process.env.DIGID_SHOW_CRYPTO_DETAILS === "1";

  const rows = [
    ["Verified at", result.verified_at],
    ["Decision", result.decision],
    ["Trust state", result.resolved_trust_state],
    ["Fixture expectations", result.expectations?.checked ? String(result.expectations.passed) : "not-checked"],
    ["Sender", result.signer_identity?.display_name ?? "unknown"],
    ["Sender class", result.signer_identity?.identity_class ?? "unknown"],
    ["Operator", result.operator_identity?.display_name ?? "none"],
    ["Purpose", result.communication?.purpose ?? "unknown"],
    ["Verification mode", result.verification_mode],
    ["Interaction class", result.policy.interaction_class],
    ["Signature valid", String(result.checks.signature_valid)],
    ["Signing key purpose", result.checks.signing_key_purpose_status ?? "unknown"],
    ["Signing key event-time", result.checks.signing_key_event_time_status ?? "unknown"],
    ["Signing key current-time", result.checks.signing_key_current_time_status ?? "unknown"],
    ["Signing key revocation event-time", result.checks.signing_key_revocation_event_time_status ?? "unknown"],
    ["Signing key revocation current-time", result.checks.signing_key_revocation_current_time_status ?? "unknown"],
    ["Issuer trust", result.checks.issuer_trust_status ?? "unknown"],
    ["Event-time valid", String(result.checks.event_time_valid)],
    ["Current-time valid", String(result.checks.current_time_valid)],
    ["Owner binding", result.checks.owner_binding_status],
    ["Owner binding reasons", ownerBindingReasons],
    ["Key binding", result.checks.key_binding_status ?? "unknown"],
    ["Key binding method", result.checks.key_binding_method ?? "none"],
    ["Key binding reasons", keyBindingReasons],
    ["Key authorization", result.checks.key_authorization_status ?? "unknown"],
    ["Key authorization reasons", keyAuthorizationReasons],
    ["Authority scope", result.checks.authority_scope_status],
    ["Authority scope reasons", authorityScopeReasons],
    ["Revocation status", result.checks.revocation_status],
    ["Freshness", result.checks.freshness_status],
    ["Replay status", result.checks.replay_status]
  ];

  if (showCryptoDetails) {
    rows.push(["Crypto suite", result.checks.crypto_suite ?? "unknown"]);
    rows.push(["Proof cryptosuite", result.checks.signature_cryptosuite ?? "unknown"]);
    rows.push(["Proof type", result.checks.signature_proof_type ?? "unknown"]);
    rows.push(["Canonicalization", result.checks.canonicalization ?? "unknown"]);
    rows.push(["Signing key", result.checks.signing_key_kid ?? "unknown"]);
    rows.push(["Key algorithm", result.checks.signing_key_algorithm ?? "unknown"]);
    rows.push(["Digest algorithms", (result.checks.digest_algorithms ?? []).join(", ") || "none"]);
  }

  return rows;
}
