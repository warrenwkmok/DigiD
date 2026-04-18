const liveInteractionClasses = new Map([
  ["voice", "live_voice"],
  ["video", "live_video"],
  ["message", "async_message"],
  ["email", "async_email"]
]);

const policyDefaults = {
  live_voice: { verification_mode: "dual", revocation_max_age_seconds: 300, replay_sensitivity: "high" },
  live_video: { verification_mode: "dual", revocation_max_age_seconds: 300, replay_sensitivity: "high" },
  async_message: { verification_mode: "current_time", revocation_max_age_seconds: 3600, replay_sensitivity: "medium" },
  async_email: { verification_mode: "current_time", revocation_max_age_seconds: 3600, replay_sensitivity: "medium" },
  stored_artifact: { verification_mode: "dual", revocation_max_age_seconds: 86400, replay_sensitivity: "low" },
  historical_audit: { verification_mode: "event_time", revocation_max_age_seconds: null, replay_sensitivity: "low" }
};

export function asInstant(value) {
  return value ? new Date(value).getTime() : null;
}

export function resolveInteractionClass(manifest, communication) {
  if (manifest?.scenario_class?.includes("voice")) {
    return "live_voice";
  }

  if (communication?.channel && liveInteractionClasses.has(communication.channel)) {
    return liveInteractionClasses.get(communication.channel);
  }

  return "historical_audit";
}

export function resolveVerifierPolicy(manifest, communication) {
  const interactionClass = resolveInteractionClass(manifest, communication);
  const defaults = policyDefaults[interactionClass] ?? policyDefaults.historical_audit;

  return {
    interaction_class: interactionClass,
    verification_mode: manifest?.verification_defaults?.mode ?? defaults.verification_mode,
    revocation_max_age_seconds:
      manifest?.verification_defaults?.revocation_max_age_seconds ?? defaults.revocation_max_age_seconds,
    replay_sensitivity: defaults.replay_sensitivity
  };
}

export function evaluateFreshness(source, verificationTime, maxAgeSeconds) {
  if (maxAgeSeconds === null) {
    return "not-required";
  }

  const checkedAt = source?.revocation_check?.checked_at ?? source?.revocation_checked_at ?? null;

  if (!checkedAt) {
    return "unknown";
  }

  const ageSeconds = Math.floor((verificationTime - asInstant(checkedAt)) / 1000);
  return ageSeconds <= maxAgeSeconds ? "fresh" : "stale";
}

export function evaluateOwnerBinding({ signerIdentity, operatorIdentity, attestation, delegation, communication }) {
  if (signerIdentity?.identity_class !== "agent") {
    return { status: "not-required", reasons: [] };
  }

  const delegationRequired = Boolean(communication?.operator_id || communication?.delegation_id);
  if (!delegationRequired) {
    return { status: "not-required", reasons: [] };
  }

  const controllerId = signerIdentity.controller?.controller_id ?? null;
  const reasons = [];

  if (!controllerId || controllerId === signerIdentity.object_id) {
    reasons.push("controller-missing");
  }

  if (!operatorIdentity || operatorIdentity.object_id !== controllerId) {
    reasons.push("operator-controller-mismatch");
  }

  if (!attestation || attestation.subject_id !== signerIdentity.object_id || attestation.issuer_id !== controllerId) {
    reasons.push("attestation-owner-mismatch");
  }

  if (!delegation || delegation.delegate_id !== signerIdentity.object_id || delegation.issuer_id !== controllerId) {
    reasons.push("delegation-owner-mismatch");
  }

  return {
    status: reasons.length === 0 ? "bound" : "missing",
    reasons
  };
}

function categorizeAuthorityScopeReasons(reasons = []) {
  const hasPurpose = reasons.includes("purpose-out-of-scope");
  const hasChannel = reasons.includes("channel-out-of-scope");
  const hasAction = reasons.some(
    (reason) => reason.endsWith("-out-of-scope") && !["purpose-out-of-scope", "channel-out-of-scope"].includes(reason)
  );

  return { hasPurpose, hasChannel, hasAction };
}

export function summarizeAuthorityScopeConflict(reasons = [], options = {}) {
  const { compact = false } = options;
  const { hasPurpose, hasChannel, hasAction } = categorizeAuthorityScopeReasons(reasons);

  if (compact) {
    if (hasPurpose && !hasChannel && !hasAction) {
      return "Signature valid, purpose not delegated";
    }

    if (hasChannel && !hasPurpose && !hasAction) {
      return "Signature valid, channel not delegated";
    }

    if (hasAction && !hasPurpose && !hasChannel) {
      return "Signature valid, action not delegated";
    }

    return "Signature valid, authority out of scope";
  }

  if (hasPurpose && !hasChannel && !hasAction) {
    return "Delegated authority does not cover the claimed purpose";
  }

  if (hasChannel && !hasPurpose && !hasAction) {
    return "Delegated authority does not cover the claimed channel";
  }

  if (hasAction && !hasPurpose && !hasChannel) {
    return "Delegated authority does not cover the required communication action";
  }

  return "Delegated authority does not cover the claimed communication scope";
}

export function evaluateDelegationScope({ communication, delegation, envelopes }) {
  const delegationRequired = Boolean(communication?.operator_id || communication?.delegation_id);
  if (!delegationRequired) {
    return { status: "not-required", reasons: [] };
  }

  if (!delegation) {
    return { status: "missing", reasons: ["delegation-missing"] };
  }

  const authority = delegation.authority ?? {};
  const reasons = [];

  if (communication?.channel && Array.isArray(authority.channels) && !authority.channels.includes(communication.channel)) {
    reasons.push("channel-out-of-scope");
  }

  if (Array.isArray(authority.actions) && !authority.actions.includes("communicate")) {
    reasons.push("communicate-out-of-scope");
  }

  if (Array.isArray(authority.purpose_bindings) && authority.purpose_bindings.length > 0) {
    if (!communication?.purpose || !authority.purpose_bindings.includes(communication.purpose)) {
      reasons.push("purpose-out-of-scope");
    }
  }

  const requiredEnvelopeActions = new Set();
  for (const envelope of envelopes) {
    if (envelope.envelope_type === "dgd.event") {
      requiredEnvelopeActions.add("sign-session");
    }

    if (envelope.envelope_type === "dgd.message") {
      requiredEnvelopeActions.add("sign-message");
    }
  }

  for (const action of requiredEnvelopeActions) {
    if (Array.isArray(authority.actions) && !authority.actions.includes(action)) {
      reasons.push(`${action}-out-of-scope`);
    }
  }

  return {
    status: reasons.length === 0 ? "in-scope" : "out-of-scope",
    reasons
  };
}
