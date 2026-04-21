import test from "node:test";
import assert from "node:assert/strict";

import {
  assertCanonicalizableForProof,
  canonicalizeForProof,
  digestCanonicalPayload
} from "../src/index.js";

test("canonicalization: sorts object keys recursively", () => {
  const value = {
    z: 1,
    a: {
      d: true,
      b: [3, { y: "last", x: "first" }]
    }
  };

  assert.equal(
    canonicalizeForProof(value),
    JSON.stringify({
      a: {
        b: [3, { x: "first", y: "last" }],
        d: true
      },
      z: 1
    })
  );
});

test("canonicalization: digest uses the v0.3 canonical form", () => {
  assert.equal(
    digestCanonicalPayload({ b: 2, a: 1 }),
    "sha256:43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"
  );
});

test("canonicalization: rejects unsafe integers", () => {
  assert.throws(
    () => assertCanonicalizableForProof({ unsafe: Number.MAX_SAFE_INTEGER + 1 }),
    /integer exceeds safe range/
  );
});

test("canonicalization: rejects unsupported runtime types that JSON would silently erase", () => {
  assert.throws(
    () => canonicalizeForProof({ omitted: undefined }),
    /undefined values are not allowed/
  );
});

test("canonicalization: rejects lone surrogate strings", () => {
  assert.throws(
    () => canonicalizeForProof({ bad: "\ud800" }),
    /lone high surrogate/
  );
});

