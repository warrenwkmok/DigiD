import { readFile } from "node:fs/promises";
import path from "node:path";

const TRUST_BUNDLE_CLASSES = new Set(["local", "partner", "public"]);
const ACTIVE_STATUS = "active";

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function parseInstant(value) {
  if (!isNonEmptyString(value)) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function requireString(value, label, sourcePath) {
  if (!isNonEmptyString(value)) {
    throw new Error(`${label} must be a non-empty string in ${sourcePath}`);
  }
}

function validateTrustBundle(bundle, sourcePath) {
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    throw new Error(`Trust bundle in ${sourcePath} must be a JSON object`);
  }

  if (bundle.bundle_type !== "dgd.trust_bundle") {
    throw new Error(`Trust bundle in ${sourcePath} must declare bundle_type = dgd.trust_bundle`);
  }

  requireString(bundle.schema_version, "schema_version", sourcePath);
  requireString(bundle.bundle_id, "bundle_id", sourcePath);
  requireString(bundle.version, "version", sourcePath);
  requireString(bundle.published_at, "published_at", sourcePath);
  requireString(bundle.status, "status", sourcePath);

  if (!TRUST_BUNDLE_CLASSES.has(bundle.bundle_class)) {
    throw new Error(`Unsupported trust bundle class in ${sourcePath}: ${bundle.bundle_class}`);
  }

  if (!bundle.operator || typeof bundle.operator !== "object" || Array.isArray(bundle.operator)) {
    throw new Error(`Trust bundle in ${sourcePath} must include operator metadata`);
  }

  requireString(bundle.operator.name, "operator.name", sourcePath);

  if (!bundle.scope || typeof bundle.scope !== "object" || Array.isArray(bundle.scope)) {
    throw new Error(`Trust bundle in ${sourcePath} must include scope metadata`);
  }

  requireString(bundle.scope.scope_id, "scope.scope_id", sourcePath);
  requireString(bundle.scope.scope_name, "scope.scope_name", sourcePath);

  if (!Array.isArray(bundle.scope.subject_classes) || bundle.scope.subject_classes.length === 0) {
    throw new Error(`Trust bundle in ${sourcePath} must include scope.subject_classes`);
  }

  if (!Array.isArray(bundle.issuers) || bundle.issuers.length === 0) {
    throw new Error(`Trust bundle in ${sourcePath} must include at least one issuer entry`);
  }

  for (const [index, issuer] of bundle.issuers.entries()) {
    if (!issuer || typeof issuer !== "object" || Array.isArray(issuer)) {
      throw new Error(`Trust bundle issuer ${index} in ${sourcePath} must be an object`);
    }

    requireString(issuer.issuer_id, `issuers[${index}].issuer_id`, sourcePath);
    requireString(issuer.issuer_class, `issuers[${index}].issuer_class`, sourcePath);
    requireString(issuer.trust_ceiling, `issuers[${index}].trust_ceiling`, sourcePath);
    requireString(issuer.status, `issuers[${index}].status`, sourcePath);

    if (!Array.isArray(issuer.allowed_subject_classes) || issuer.allowed_subject_classes.length === 0) {
      throw new Error(`Trust bundle issuer ${index} in ${sourcePath} must include allowed_subject_classes`);
    }
  }
}

function buildInlineLocalTrustInput(trustedIssuerIds, source) {
  const trustedIds = trustedIssuerIds.filter(isNonEmptyString);

  return {
    trustedIssuerIds: new Set(trustedIds),
    trustInputClass: trustedIds.length > 0 ? "local" : "none",
    issuerTrustSource: source,
    trustBundleId: null,
    trustBundleVersion: null,
    trustBundleStatus: null,
    trustBundleScope: null,
    trustBundlePath: null
  };
}

export async function resolveTrustInputs({ manifest, repoRoot, verificationTime, defaultTrustedIssuerId }) {
  const verificationDefaults = manifest?.verification_defaults ?? {};
  const hasExplicitTrustedIssuerIds = Array.isArray(verificationDefaults.trusted_issuer_ids);
  const explicitTrustedIssuerIds = hasExplicitTrustedIssuerIds ? verificationDefaults.trusted_issuer_ids : [];
  const trustBundlePath = isNonEmptyString(verificationDefaults.trust_bundle_path)
    ? verificationDefaults.trust_bundle_path
    : null;

  if (trustBundlePath && explicitTrustedIssuerIds.length > 0) {
    throw new Error("verification_defaults cannot declare both trust_bundle_path and trusted_issuer_ids");
  }

  if (!trustBundlePath) {
    if (hasExplicitTrustedIssuerIds) {
      return buildInlineLocalTrustInput(explicitTrustedIssuerIds, "trusted-issuer-ids");
    }

    if (isNonEmptyString(defaultTrustedIssuerId)) {
      return buildInlineLocalTrustInput([defaultTrustedIssuerId], "implicit-local-demo-root");
    }

    return buildInlineLocalTrustInput([], "none");
  }

  const absoluteBundlePath = path.resolve(repoRoot, trustBundlePath);
  const trustBundle = JSON.parse(await readFile(absoluteBundlePath, "utf8"));
  validateTrustBundle(trustBundle, absoluteBundlePath);

  const bundlePublishedAt = parseInstant(trustBundle.published_at);
  if (bundlePublishedAt === null) {
    throw new Error(`Trust bundle ${absoluteBundlePath} has invalid published_at`);
  }

  const bundleExpiresAt = parseInstant(trustBundle.expires_at ?? null);
  const bundleActive =
    trustBundle.status === ACTIVE_STATUS &&
    bundlePublishedAt <= verificationTime &&
    (!bundleExpiresAt || verificationTime < bundleExpiresAt);
  const trustedIssuerIds = bundleActive
    ? trustBundle.issuers
        .filter((issuer) => issuer.status === ACTIVE_STATUS && isNonEmptyString(issuer.issuer_id))
        .map((issuer) => issuer.issuer_id)
    : [];

  return {
    trustedIssuerIds: new Set(trustedIssuerIds),
    trustInputClass: trustBundle.bundle_class,
    issuerTrustSource: "trust-bundle",
    trustBundleId: trustBundle.bundle_id,
    trustBundleVersion: trustBundle.version,
    trustBundleStatus: bundleActive ? "active" : bundleExpiresAt && verificationTime >= bundleExpiresAt ? "expired" : trustBundle.status,
    trustBundleScope: trustBundle.scope.scope_name,
    trustBundlePath: absoluteBundlePath
  };
}
