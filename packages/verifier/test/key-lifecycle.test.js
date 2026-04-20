import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSigningKeyLifecycle } from "../src/key-lifecycle.js";

test("signing key lifecycle: active + authorized", () => {
  const result = evaluateSigningKeyLifecycle(
    {
      status: "active",
      purposes: ["assertion"],
      not_before: "2026-04-15T00:00:00.000Z",
      expires_at: null
    },
    {
      eventTime: new Date("2026-04-15T00:00:10.000Z").getTime(),
      verificationTime: new Date("2026-04-15T00:05:00.000Z").getTime()
    }
  );

  assert.equal(result.purpose_status, "authorized");
  assert.equal(result.event_time_status, "valid");
  assert.equal(result.current_time_status, "active");
});

test("signing key lifecycle: expires after event time but before verification time", () => {
  const result = evaluateSigningKeyLifecycle(
    {
      status: "active",
      purposes: ["assertion"],
      not_before: "2026-04-15T00:00:00.000Z",
      expires_at: "2026-04-15T00:00:20.000Z"
    },
    {
      eventTime: new Date("2026-04-15T00:00:10.000Z").getTime(),
      verificationTime: new Date("2026-04-15T00:05:00.000Z").getTime()
    }
  );

  assert.equal(result.purpose_status, "authorized");
  assert.equal(result.event_time_status, "valid");
  assert.equal(result.current_time_status, "inactive");
});

test("signing key lifecycle: operationally revoked does not erase event-time window", () => {
  const result = evaluateSigningKeyLifecycle(
    {
      status: "revoked",
      purposes: ["assertion"],
      not_before: "2026-04-15T00:00:00.000Z",
      expires_at: null
    },
    {
      eventTime: new Date("2026-04-15T00:00:10.000Z").getTime(),
      verificationTime: new Date("2026-04-15T00:05:00.000Z").getTime()
    }
  );

  assert.equal(result.purpose_status, "authorized");
  assert.equal(result.event_time_status, "valid");
  assert.equal(result.current_time_status, "inactive");
});

test("signing key lifecycle: missing assertion purpose is not authorized", () => {
  const result = evaluateSigningKeyLifecycle(
    {
      status: "active",
      purposes: ["authentication"],
      not_before: "2026-04-15T00:00:00.000Z",
      expires_at: null
    },
    {
      eventTime: new Date("2026-04-15T00:00:10.000Z").getTime(),
      verificationTime: new Date("2026-04-15T00:05:00.000Z").getTime()
    }
  );

  assert.equal(result.purpose_status, "not-authorized");
});

