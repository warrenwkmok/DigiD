import { asInstant } from "./policy.js";

function normalizePurposes(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry) => typeof entry === "string" && entry.length > 0);
}

export function evaluateSigningKeyPurpose(keyRecord, requiredPurpose = "assertion") {
  const purposes = normalizePurposes(keyRecord?.purposes);

  if (purposes.length === 0) {
    return { status: "missing", reasons: ["purposes-missing"] };
  }

  if (!purposes.includes(requiredPurpose)) {
    return { status: "not-authorized", reasons: [`purpose-${requiredPurpose}-missing`] };
  }

  return { status: "authorized", reasons: [] };
}

export function evaluateSigningKeyWindow(keyRecord, when) {
  const notBefore = asInstant(keyRecord?.not_before ?? keyRecord?.created_at ?? null);
  const expiresAt = asInstant(keyRecord?.expires_at ?? null);

  if (!when) {
    return { status: "unknown", reasons: ["time-missing"] };
  }

  if (notBefore && when < notBefore) {
    return { status: "not-yet-valid", reasons: ["not-before"] };
  }

  if (expiresAt && when > expiresAt) {
    return { status: "expired", reasons: ["expired"] };
  }

  return { status: "valid", reasons: [] };
}

export function evaluateSigningKeyOperationalStatus(keyRecord, when) {
  const window = evaluateSigningKeyWindow(keyRecord, when);
  const status = keyRecord?.status ?? null;

  if (window.status !== "valid") {
    return { status: "inactive", reasons: [`window-${window.status}`, ...window.reasons] };
  }

  if (!status) {
    return { status: "inactive", reasons: ["status-missing"] };
  }

  if (status !== "active") {
    return { status: "inactive", reasons: [`status-${status}`] };
  }

  return { status: "active", reasons: [] };
}

export function evaluateSigningKeyLifecycle(keyRecord, { eventTime, verificationTime, requiredPurpose = "assertion" } = {}) {
  const purpose = evaluateSigningKeyPurpose(keyRecord, requiredPurpose);
  const windowAtEventTime = evaluateSigningKeyWindow(keyRecord, eventTime);
  const operationalNow = evaluateSigningKeyOperationalStatus(keyRecord, verificationTime);

  return {
    purpose_status: purpose.status,
    purpose_reasons: purpose.reasons,
    event_time_status: windowAtEventTime.status,
    event_time_reasons: windowAtEventTime.reasons,
    current_time_status: operationalNow.status,
    current_time_reasons: operationalNow.reasons
  };
}

