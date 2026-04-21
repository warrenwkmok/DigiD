import { createHash } from "node:crypto";

function assertNoLoneSurrogates(value, path) {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);

    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (!(nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff)) {
        throw new Error(`Unsupported canonicalization input at ${path}: string contains lone high surrogate`);
      }
      index += 1;
      continue;
    }

    if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      throw new Error(`Unsupported canonicalization input at ${path}: string contains lone low surrogate`);
    }
  }
}

function assertCanonicalizableValue(value, path) {
  if (value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) {
        throw new Error(`Unsupported canonicalization input at ${path}[${index}]: sparse arrays are not allowed`);
      }
      assertCanonicalizableValue(value[index], `${path}[${index}]`);
    }
    return;
  }

  switch (typeof value) {
    case "boolean":
      return;
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(`Unsupported canonicalization input at ${path}: numbers must be finite`);
      }
      if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
        throw new Error(`Unsupported canonicalization input at ${path}: integer exceeds safe range`);
      }
      return;
    case "string":
      assertNoLoneSurrogates(value, path);
      return;
    case "object": {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new Error(`Unsupported canonicalization input at ${path}: only plain JSON objects are allowed`);
      }

      for (const key of Object.keys(value)) {
        assertNoLoneSurrogates(key, `${path}.${key}#key`);
        assertCanonicalizableValue(value[key], `${path}.${key}`);
      }
      return;
    }
    default:
      throw new Error(`Unsupported canonicalization input at ${path}: ${typeof value} values are not allowed`);
  }
}

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

export function assertCanonicalizableForProof(value) {
  assertCanonicalizableValue(value, "$");
}

export function canonicalizeForProof(value) {
  assertCanonicalizableForProof(value);
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
