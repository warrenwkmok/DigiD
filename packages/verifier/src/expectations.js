function pushMismatch(mismatches, field, expected, actual) {
  mismatches.push(`${field}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
}

function normalizeWarningCodes(warnings) {
  return warnings.map((warning) => warning.code).sort();
}

export function evaluateFixtureExpectations(result, expectedOutcome) {
  if (!expectedOutcome) {
    return {
      checked: false,
      passed: true,
      mismatches: []
    };
  }

  const mismatches = [];

  if (expectedOutcome.compact_label !== undefined && result.compactBanner !== expectedOutcome.compact_label) {
    pushMismatch(mismatches, "compact_label", expectedOutcome.compact_label, result.compactBanner);
  }

  if (expectedOutcome.decision !== undefined && result.decision !== expectedOutcome.decision) {
    pushMismatch(mismatches, "decision", expectedOutcome.decision, result.decision);
  }

  if (
    expectedOutcome.resolved_trust_state !== undefined &&
    result.resolved_trust_state !== expectedOutcome.resolved_trust_state
  ) {
    pushMismatch(mismatches, "resolved_trust_state", expectedOutcome.resolved_trust_state, result.resolved_trust_state);
  }

  if (expectedOutcome.error_count !== undefined && result.errors.length !== expectedOutcome.error_count) {
    pushMismatch(mismatches, "error_count", expectedOutcome.error_count, result.errors.length);
  }

  if (Array.isArray(expectedOutcome.warning_codes)) {
    const expectedCodes = [...expectedOutcome.warning_codes].sort();
    const actualCodes = normalizeWarningCodes(result.warnings);

    if (JSON.stringify(actualCodes) !== JSON.stringify(expectedCodes)) {
      pushMismatch(mismatches, "warning_codes", expectedCodes, actualCodes);
    }
  }

  if (expectedOutcome.checks) {
    for (const [checkName, expectedValue] of Object.entries(expectedOutcome.checks)) {
      if (result.checks[checkName] !== expectedValue) {
        pushMismatch(mismatches, `checks.${checkName}`, expectedValue, result.checks[checkName]);
      }
    }
  }

  return {
    checked: true,
    passed: mismatches.length === 0,
    mismatches
  };
}
