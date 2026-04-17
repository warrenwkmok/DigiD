const decisionPriority = new Map([
  ["allow-with-trust-indicator", 0],
  ["allow-with-warning", 1],
  ["degraded-trust", 2],
  ["reject", 3]
]);

const warningMessages = {
  "artifact-context-missing": "Artifact copied outside verified context",
  "platform-identity-mismatch": "Platform identity does not match verified DigiD identity"
};

function dedupe(values) {
  return [...new Set(values)];
}

function chooseDecision(baseDecision, synthesizedWarningCodes) {
  if (synthesizedWarningCodes.length === 0) {
    return baseDecision;
  }

  return decisionPriority.get(baseDecision) >= decisionPriority.get("allow-with-warning")
    ? baseDecision
    : "allow-with-warning";
}

function deriveMismatchCompactLabel(contract) {
  switch (contract.resolved_trust_state) {
    case "delegated-agent":
    case "verified-agent":
      return "Verified agent, platform identity mismatch";
    case "verified-human":
      return "Verified human, platform identity mismatch";
    case "verified-organization":
      return "Verified organization, platform identity mismatch";
    default:
      return warningMessages["platform-identity-mismatch"];
  }
}

function deriveEffectiveCompactLabel(contract, synthesizedWarningCodes) {
  const warnings = new Set(synthesizedWarningCodes);

  if (warnings.has("artifact-context-missing")) {
    return warningMessages["artifact-context-missing"];
  }

  if (contract.warning_codes.length > 0) {
    return contract.compact_label;
  }

  if (warnings.has("platform-identity-mismatch")) {
    return deriveMismatchCompactLabel(contract);
  }

  return contract.compact_label;
}

export function applyPresentationGuardrails(contract, options = {}) {
  const verifiedContextPreserved = options.verified_context_preserved !== false;
  const platformIdentityStatus = options.platform_identity_status ?? "matched";
  const synthesizedWarningCodes = [];

  if (!verifiedContextPreserved) {
    synthesizedWarningCodes.push(...(contract.rendering_guardrails?.synthesize_warning_codes_on_context_loss ?? []));
  }

  if (
    platformIdentityStatus === "mismatch" &&
    contract.rendering_guardrails?.platform_identity?.mismatch_state_required
  ) {
    synthesizedWarningCodes.push(contract.rendering_guardrails.platform_identity.mismatch_warning_code);
  }

  const effectiveWarningCodes = dedupe([...contract.warning_codes, ...synthesizedWarningCodes]);
  const effectiveDecision = chooseDecision(contract.decision, synthesizedWarningCodes);
  const effectiveCompactLabel = deriveEffectiveCompactLabel(contract, synthesizedWarningCodes);

  return {
    contract_version: "0.1",
    base_contract_version: contract.contract_version,
    verified_at: contract.verified_at,
    interaction_class: contract.interaction_class,
    resolved_trust_state: contract.resolved_trust_state,
    base_decision: contract.decision,
    effective_decision: effectiveDecision,
    base_compact_label: contract.compact_label,
    effective_compact_label: effectiveCompactLabel,
    base_warning_codes: contract.warning_codes,
    synthesized_warning_codes: synthesizedWarningCodes,
    effective_warning_codes: effectiveWarningCodes,
    synthesized_warnings: synthesizedWarningCodes.map((code) => ({
      code,
      message: warningMessages[code] ?? code
    })),
    presentation_context: {
      verified_context_status: verifiedContextPreserved ? "preserved" : "lost",
      platform_identity_status: platformIdentityStatus
    },
    must_preserve_fields: contract.must_preserve_fields,
    checks: contract.checks
  };
}
