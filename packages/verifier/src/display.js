export function deriveCompactBanner(result) {
  const warningCodes = new Set(result.warnings.map((warning) => warning.code));

  if (warningCodes.has("delegation-expired-current-time")) {
    return "Delegation no longer active";
  }

  if (warningCodes.has("authority-incomplete")) {
    return "Signature valid, authority not proven";
  }

  if (warningCodes.has("owner-binding-missing")) {
    return "Agent signature not bound to verified owner";
  }

  if (warningCodes.has("delegation-scope-conflict")) {
    return "Signature valid, authority out of scope";
  }

  if (warningCodes.has("revocation-stale")) {
    return "Verification stale, re-check recommended";
  }

  if (result.errors.length > 0) {
    return "Verification failed";
  }

  switch (result.resolved_trust_state) {
    case "delegated-agent":
      return `Verified agent for ${result.operator_identity?.display_name ?? "unknown operator"}`;
    case "verified-human":
      return "Verified human";
    case "unverified":
      return "Unverified sender";
    default:
      return "Signature valid, authority not proven";
  }
}

export function renderExpandedDetails(result) {
  const ownerBindingReasons = result.checks.owner_binding_reasons?.join(", ") || "none";
  const authorityScopeReasons = result.checks.authority_scope_reasons?.join(", ") || "none";

  return [
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
    ["Event-time valid", String(result.checks.event_time_valid)],
    ["Current-time valid", String(result.checks.current_time_valid)],
    ["Owner binding", result.checks.owner_binding_status],
    ["Owner binding reasons", ownerBindingReasons],
    ["Authority scope", result.checks.authority_scope_status],
    ["Authority scope reasons", authorityScopeReasons],
    ["Revocation status", result.checks.revocation_status],
    ["Freshness", result.checks.freshness_status],
    ["Replay status", result.checks.replay_status]
  ];
}
