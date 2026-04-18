#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  applyAdapterEvidence,
  applyPresentationGuardrails,
  evaluatePresentationExpectations,
  renderExpandedDetails,
  verifyFixtureManifest
} from "../../../packages/verifier/src/index.js";

async function readJson(jsonPath) {
  return JSON.parse(await readFile(jsonPath, "utf8"));
}

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

function parsePresentationOptions(args) {
  const options = {
    platform_identity_status: "matched",
    verified_context_preserved: true
  };

  for (const arg of args) {
    if (arg === "--platform-mismatch") {
      options.platform_identity_status = "mismatch";
      continue;
    }

    if (arg === "--context-loss") {
      options.verified_context_preserved = false;
      continue;
    }

    throw new Error(`Unknown present flag: ${arg}`);
  }

  return options;
}

function printPresentation(result) {
  console.log(`\nBase label: ${result.base_compact_label}`);
  console.log(`Effective label: ${result.effective_compact_label}`);
  console.log(`Base decision: ${result.base_decision}`);
  console.log(`Effective decision: ${result.effective_decision}`);
  console.log(`Context status: ${result.presentation_context.verified_context_status}`);
  console.log(`Platform identity: ${result.presentation_context.platform_identity_status}`);
  console.log(`Base warnings: ${result.base_warning_codes.join(", ") || "none"}`);
  console.log(`Synthesized warnings: ${result.synthesized_warning_codes.join(", ") || "none"}`);
  console.log(`Effective warnings: ${result.effective_warning_codes.join(", ") || "none"}`);

  if (result.adapter_evidence) {
    console.log(`Adapter profile: ${result.adapter_evidence.adapter_profile}`);
    console.log(`Evidence id: ${result.adapter_evidence.evidence_id ?? "none"}`);
  }
}

async function runPresentationFixture(evidencePath) {
  const absoluteEvidencePath = path.resolve(evidencePath);
  const evidence = await readJson(absoluteEvidencePath);

  if (!evidence.manifest_path) {
    throw new Error(`Presentation evidence ${absoluteEvidencePath} is missing manifest_path`);
  }

  const manifestPath = path.resolve(path.dirname(absoluteEvidencePath), "..", "..", "..", evidence.manifest_path);
  const result = await verifyFixtureManifest(manifestPath);
  const presentation = applyAdapterEvidence(result.portable_result_contract, evidence);
  const expectations = evaluatePresentationExpectations(presentation, evidence.expected_outcome);

  return {
    evidence,
    evidencePath: absoluteEvidencePath,
    manifestPath,
    presentation,
    expectations
  };
}

async function runPresentationAudit(presentationDirectory) {
  const entries = await readdir(presentationDirectory, { withFileTypes: true });
  const evidenceNames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".presentation.json"))
    .map((entry) => entry.name)
    .sort();

  if (evidenceNames.length === 0) {
    console.error(`No presentation evidence files found in ${presentationDirectory}`);
    process.exit(1);
  }

  let failures = 0;

  for (const evidenceName of evidenceNames) {
    const evidencePath = path.resolve(presentationDirectory, evidenceName);
    const { presentation, expectations } = await runPresentationFixture(evidencePath);
    const status = expectations.passed ? "PASS" : "FAIL";

    console.log(
      `${status} ${evidenceName} -> ${presentation.effective_compact_label} (${presentation.effective_decision})`
    );

    if (!expectations.passed) {
      failures += 1;

      for (const mismatch of expectations.mismatches) {
        console.log(`  expectation: ${mismatch}`);
      }
    }
  }

  console.log("");
  console.log(`${evidenceNames.length - failures}/${evidenceNames.length} presentation expectations passed`);

  if (failures > 0) {
    process.exit(1);
  }
}

async function run() {
  const [, , command, ...args] = process.argv;

  if (!command || !["verify", "compare", "export", "audit", "present", "present-evidence", "present-audit"].includes(command)) {
    console.error("Usage: node apps/demo-cli/src/index.js <verify|compare|export|audit|present|present-evidence|present-audit> <manifest|manifest-dir|presentation-file> [other-manifest] [--platform-mismatch] [--context-loss]");
    process.exit(1);
  }

  if (command === "audit") {
    const manifestDirectory = path.resolve(args[0] ?? "fixtures/demo/manifests");
    await runAudit(manifestDirectory);
    return;
  }

  if (command === "present-audit") {
    const presentationDirectory = path.resolve(args[0] ?? "fixtures/demo/presentation");
    await runPresentationAudit(presentationDirectory);
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

  if (command === "present") {
    const manifestPath = args[0] ?? "fixtures/demo/manifests/voice.happy-path.manifest.json";
    const presentationOptions = parsePresentationOptions(args.slice(1));
    const result = await verifyFixtureManifest(path.resolve(manifestPath));
    const presentation = applyPresentationGuardrails(result.portable_result_contract, presentationOptions);
    printPresentation(presentation);
    return;
  }

  if (command === "present-evidence") {
    const evidencePath = args[0] ?? "fixtures/demo/presentation/voice.platform-mismatch.presentation.json";
    const { presentation, expectations } = await runPresentationFixture(evidencePath);
    printPresentation(presentation);

    console.log("");
    console.log("Presentation expectations:");
    if (expectations.passed) {
      console.log("- passed");
    } else {
      for (const mismatch of expectations.mismatches) {
        console.log(`- ${mismatch}`);
      }
    }

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
