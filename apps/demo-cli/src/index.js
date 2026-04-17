#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";
import { renderExpandedDetails, verifyFixtureManifest } from "../../../packages/verifier/src/index.js";

function printResult(result) {
  console.log(`\n${result.compactBanner}`);
  console.log("=".repeat(result.compactBanner.length));
  console.log(`Scenario: ${result.scenario_id}`);
  console.log(`Policy: ${result.policy.interaction_class} (${result.policy.replay_sensitivity} replay sensitivity)`);
  console.log("");

  for (const [label, value] of renderExpandedDetails(result)) {
    console.log(`${label}: ${value}`);
  }

  console.log("");
  console.log("Warnings:");
  if (result.warnings.length === 0) {
    console.log("- none");
  } else {
    for (const warning of result.warnings) {
      console.log(`- ${warning.code}: ${warning.message}`);
    }
  }

  console.log("Errors:");
  if (result.errors.length === 0) {
    console.log("- none");
  } else {
    for (const error of result.errors) {
      console.log(`- ${error}`);
    }
  }

  console.log("");
  console.log("Fixture expectations:");
  if (!result.expectations?.checked) {
    console.log("- none declared");
  } else if (result.expectations.passed) {
    console.log("- passed");
  } else {
    for (const mismatch of result.expectations.mismatches) {
      console.log(`- ${mismatch}`);
    }
  }
}

async function runAudit(manifestDirectory) {
  const entries = await readdir(manifestDirectory, { withFileTypes: true });
  const manifestNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".manifest.json"))
    .map((entry) => entry.name)
    .sort();

  if (manifestNames.length === 0) {
    console.error(`No manifest files found in ${manifestDirectory}`);
    process.exit(1);
  }

  let failures = 0;

  for (const manifestName of manifestNames) {
    const manifestPath = path.resolve(manifestDirectory, manifestName);
    const result = await verifyFixtureManifest(manifestPath);
    const passed = result.expectations?.checked ? result.expectations.passed : result.errors.length === 0;
    const status = passed ? "PASS" : "FAIL";

    console.log(`${status} ${manifestName} -> ${result.compactBanner} (${result.decision})`);

    if (!passed) {
      failures += 1;

      for (const mismatch of result.expectations?.mismatches ?? []) {
        console.log(`  expectation: ${mismatch}`);
      }

      for (const error of result.errors) {
        console.log(`  error: ${error}`);
      }
    }
  }

  console.log("");
  console.log(`${manifestNames.length - failures}/${manifestNames.length} manifest expectations passed`);

  if (failures > 0) {
    process.exit(1);
  }
}

async function run() {
  const [, , command, ...args] = process.argv;

  if (!command || !["verify", "compare", "export", "audit"].includes(command)) {
    console.error("Usage: node apps/demo-cli/src/index.js <verify|compare|export|audit> <manifest|manifest-dir> [other-manifest]");
    process.exit(1);
  }

  if (command === "audit") {
    const manifestDirectory = path.resolve(args[0] ?? "fixtures/demo/manifests");
    await runAudit(manifestDirectory);
    return;
  }

  if (command === "verify") {
    const manifestPath = args[0] ?? "fixtures/demo/manifests/voice.happy-path.manifest.json";
    const result = await verifyFixtureManifest(path.resolve(manifestPath));
    printResult(result);
    return;
  }

  if (command === "export") {
    const manifestPath = args[0] ?? "fixtures/demo/manifests/voice.happy-path.manifest.json";
    const result = await verifyFixtureManifest(path.resolve(manifestPath));
    console.log(JSON.stringify(result.portable_result_contract, null, 2));
    return;
  }

  const left = await verifyFixtureManifest(path.resolve(args[0]));
  const right = await verifyFixtureManifest(path.resolve(args[1]));

  console.log(`\nCompare: ${left.scenario_id} vs ${right.scenario_id}\n`);
  console.log(`Left : ${left.compactBanner} (${left.decision})`);
  console.log(`Right: ${right.compactBanner} (${right.decision})`);
  console.log("");
  console.log(`Left warnings : ${left.warnings.map((warning) => warning.code).join(", ") || "none"}`);
  console.log(`Right warnings: ${right.warnings.map((warning) => warning.code).join(", ") || "none"}`);
  console.log(`Left owner/scope : ${left.checks.owner_binding_status} / ${left.checks.authority_scope_status}`);
  console.log(`Right owner/scope: ${right.checks.owner_binding_status} / ${right.checks.authority_scope_status}`);
  console.log(`Left errors   : ${left.errors.join("; ") || "none"}`);
  console.log(`Right errors  : ${right.errors.join("; ") || "none"}`);
}

run().catch((error) => {
  console.error(error.stack);
  process.exit(1);
});
