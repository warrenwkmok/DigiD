import { createHash } from "node:crypto";

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = sortValue(value[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export function canonicalizeForProof(value) {
  return JSON.stringify(sortValue(value));
}

export function stripProof(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const copy = { ...value };
  delete copy.proof;
  return copy;
}

export function digestCanonicalPayload(payload) {
  return `sha256:${createHash("sha256").update(canonicalizeForProof(payload)).digest("hex")}`;
}
