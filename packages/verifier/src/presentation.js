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

const allowedVerifiedContextStatuses = new Set(["preserved", "lost"]);
const allowedPlatformIdentityStatuses = new Set(["matched", "mismatch", "unavailable"]);

function dedupe(values) {
  return [...new Set(values)];
}

function arraysEqual(left = [], right = []) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function normalizeAdapterEvidence(evidence) {
  if (evidence?.evidence_type !== "dgd.adapter_evidence") {
    throw new Error("Adapter evidence must declare evidence_type dgd.adapter_evidence");
  }

  const verifiedContextStatus = evidence.presentation_context?.verified_context_status ?? "preserved";
  if (!allowedVerifiedContextStatuses.has(verifiedContextStatus)) {
    throw new Error(`Unsupported verified_context_status: ${verifiedContextStatus}`);
  }

  const platformIdentityStatus = evidence.platform_identity?.binding_status ?? "matched";
  if (!allowedPlatformIdentityStatuses.has(platformIdentityStatus)) {
    throw new Error(`Unsupported platform identity binding status: ${platformIdentityStatus}`);
  }

  return {
    evidence_id: evidence.evidence_id ?? null,
    adapter_profile: evidence.adapter_profile ?? "unspecified",
    presentation_context: {
      verified_context_status: verifiedContextStatus,
      surface: evidence.presentation_context?.surface ?? null,
      context_source: evidence.presentation_context?.context_source ?? null
    },
    platform_identity: {
      binding_status: platformIdentityStatus,
      platform: evidence.platform_identity?.platform ?? null,
      native_label: evidence.platform_identity?.native_label ?? null,
      verified_label: evidence.platform_identity?.verified_label ?? null
    }
  };
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
    case "org-issued-agent":
      return "Org-issued agent, platform identity mismatch";
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

export function applyAdapterEvidence(contract, evidence) {
  const normalizedEvidence = normalizeAdapterEvidence(evidence);
  const presentation = applyPresentationGuardrails(contract, {
    verified_context_preserved: normalizedEvidence.presentation_context.verified_context_status !== "lost",
    platform_identity_status: normalizedEvidence.platform_identity.binding_status
  });

  return {
    ...presentation,
    adapter_evidence: normalizedEvidence
  };
}

export function evaluatePresentationExpectations(presentation, expectedOutcome) {
  if (!expectedOutcome) {
    return {
      checked: false,
      passed: true,
      mismatches: []
    };
  }

  const mismatches = [];

  if (expectedOutcome.base_decision && presentation.base_decision !== expectedOutcome.base_decision) {
    mismatches.push(`Expected base_decision ${expectedOutcome.base_decision}, received ${presentation.base_decision}`);
  }

  if (expectedOutcome.effective_decision && presentation.effective_decision !== expectedOutcome.effective_decision) {
    mismatches.push(`Expected effective_decision ${expectedOutcome.effective_decision}, received ${presentation.effective_decision}`);
  }

  if (
    expectedOutcome.effective_compact_label &&
    presentation.effective_compact_label !== expectedOutcome.effective_compact_label
  ) {
    mismatches.push(
      `Expected effective_compact_label ${expectedOutcome.effective_compact_label}, received ${presentation.effective_compact_label}`
    );
  }

  if (
    expectedOutcome.synthesized_warning_codes &&
    !arraysEqual(presentation.synthesized_warning_codes, expectedOutcome.synthesized_warning_codes)
  ) {
    mismatches.push(
      `Expected synthesized_warning_codes ${expectedOutcome.synthesized_warning_codes.join(", ") || "none"}, received ${presentation.synthesized_warning_codes.join(", ") || "none"}`
    );
  }

  if (
    expectedOutcome.effective_warning_codes &&
    !arraysEqual(presentation.effective_warning_codes, expectedOutcome.effective_warning_codes)
  ) {
    mismatches.push(
      `Expected effective_warning_codes ${expectedOutcome.effective_warning_codes.join(", ") || "none"}, received ${presentation.effective_warning_codes.join(", ") || "none"}`
    );
  }

  if (
    expectedOutcome.presentation_context?.verified_context_status &&
    presentation.presentation_context.verified_context_status !== expectedOutcome.presentation_context.verified_context_status
  ) {
    mismatches.push(
      `Expected verified_context_status ${expectedOutcome.presentation_context.verified_context_status}, received ${presentation.presentation_context.verified_context_status}`
    );
  }

  if (
    expectedOutcome.presentation_context?.platform_identity_status &&
    presentation.presentation_context.platform_identity_status !== expectedOutcome.presentation_context.platform_identity_status
  ) {
    mismatches.push(
      `Expected platform_identity_status ${expectedOutcome.presentation_context.platform_identity_status}, received ${presentation.presentation_context.platform_identity_status}`
    );
  }

  return {
    checked: true,
    passed: mismatches.length === 0,
    mismatches
  };
}
