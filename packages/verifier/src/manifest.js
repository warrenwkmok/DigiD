import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadFixtureManifest(manifestPath) {
  const absolutePath = path.resolve(manifestPath);
  const manifest = JSON.parse(await readFile(absolutePath, "utf8"));

  if (manifest.manifest_type !== "dgd.fixture_manifest") {
    throw new Error(`Invalid manifest type in ${absolutePath}`);
  }

  return {
    manifest,
    manifestPath: absolutePath,
    repoRoot: path.resolve(path.dirname(absolutePath), "..", "..", "..")
  };
}
