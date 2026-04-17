#!/usr/bin/env node

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
}

async function run() {
  const [, , command, ...args] = process.argv;

  if (!command || !["verify", "compare"].includes(command)) {
    console.error("Usage: node apps/demo-cli/src/index.js <verify|compare> <manifest> [other-manifest]");
    process.exit(1);
  }

  if (command === "verify") {
    const manifestPath = args[0] ?? "fixtures/demo/manifests/voice.happy-path.manifest.json";
    const result = await verifyFixtureManifest(path.resolve(manifestPath));
    printResult(result);
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
