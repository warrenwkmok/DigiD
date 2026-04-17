export function deriveCompactBanner(result) {
  if (result.compact_label) {
    return result.compact_label;
  }

  if (result.warnings.some((warning) => warning.code === "owner-binding-missing")) {
    return "Agent signature not bound to verified owner";
  }

  if (result.warnings.some((warning) => warning.code === "delegation-scope-conflict")) {
    return "Signature valid, authority out of scope";
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
  return [
    ["Decision", result.decision],
    ["Trust state", result.resolved_trust_state],
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
    ["Authority scope", result.checks.authority_scope_status],
    ["Revocation status", result.checks.revocation_status],
    ["Freshness", result.checks.freshness_status],
    ["Replay status", result.checks.replay_status]
  ];
}
