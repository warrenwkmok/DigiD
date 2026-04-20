import { deriveCompactBanner } from "./display.js";

function deriveContextBinding(interactionClass) {
  if (interactionClass?.startsWith("live_")) {
    return "verified-surface-required";
  }

  if (interactionClass === "stored_artifact") {
    return "artifact-context-required";
  }

  return "portable-with-guardrails";
}

function deriveContextLossWarnings(interactionClass) {
  if (interactionClass?.startsWith("live_")) {
    return ["artifact-context-missing"];
  }

  if (interactionClass === "stored_artifact") {
    return ["artifact-context-missing"];
  }

  return [];
}

export function derivePortableResultContract(result) {
  const warningCodes = result.warnings.map((warning) => warning.code);
  const positiveCompactAllowed = result.decision === "allow-with-trust-indicator" && warningCodes.length === 0;
  const interactionClass = result.policy.interaction_class;
  const platformMismatchRelevant = interactionClass?.startsWith("live_") || interactionClass === "async_message" || interactionClass === "async_email";

  return {
    contract_version: "0.1",
    verified_at: result.verified_at,
    decision: result.decision,
    resolved_trust_state: result.resolved_trust_state,
    compact_label: result.compactBanner ?? deriveCompactBanner(result),
    verification_mode: result.verification_mode,
    interaction_class: interactionClass,
    warning_codes: warningCodes,
    must_preserve_fields: [
      "checks.issuer_trust_status",
      "checks.owner_binding_status",
      "checks.owner_binding_reasons",
      "checks.authority_scope_status",
      "checks.authority_scope_reasons",
      "checks.revocation_status",
      "checks.freshness_status",
      "checks.replay_status"
    ],
    rendering_guardrails: {
      preserve_warning_codes: true,
      warning_visibility: warningCodes.length > 0 ? "required" : "available",
      expanded_context: "required",
      positive_compact_label_without_details: positiveCompactAllowed,
      context_binding: deriveContextBinding(interactionClass),
      synthesize_warning_codes_on_context_loss: deriveContextLossWarnings(interactionClass),
      adapter_evidence: {
        contract_type: "dgd.adapter_evidence",
        local_only: true,
        required_fields: [
          "presentation_context.verified_context_status",
          "platform_identity.binding_status"
        ]
      },
      platform_identity: platformMismatchRelevant
        ? {
            mismatch_state_required: true,
            mismatch_warning_code: "platform-identity-mismatch"
          }
        : {
            mismatch_state_required: false,
            mismatch_warning_code: null
          }
    },
    checks: {
      signature_valid: result.checks.signature_valid,
      event_time_valid: result.checks.event_time_valid,
      current_time_valid: result.checks.current_time_valid,
      crypto_suite: result.checks.crypto_suite,
      signature_proof_type: result.checks.signature_proof_type,
      canonicalization: result.checks.canonicalization,
      signing_key_kid: result.checks.signing_key_kid,
      signing_key_algorithm: result.checks.signing_key_algorithm,
      digest_algorithms: result.checks.digest_algorithms,
      issuer_trust_status: result.checks.issuer_trust_status,
      owner_binding_status: result.checks.owner_binding_status,
      owner_binding_reasons: result.checks.owner_binding_reasons,
      authority_scope_status: result.checks.authority_scope_status,
      authority_scope_reasons: result.checks.authority_scope_reasons,
      revocation_status: result.checks.revocation_status,
      freshness_status: result.checks.freshness_status,
      replay_status: result.checks.replay_status
    }
  };
}
