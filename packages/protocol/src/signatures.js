import { createPublicKey, verify } from "node:crypto";
import { canonicalizeForProof, stripProof } from "./canonicalize.js";

const SUPPORTED_PROOF_TYPE = "ed25519-2020";
const SUPPORTED_CANONICALIZATION = "JCS";
const SUPPORTED_KEY_ALGORITHM = "Ed25519";

function resolvePublicKey(publicKeyDerBase64) {
  try {
    return createPublicKey({
      key: Buffer.from(publicKeyDerBase64, "base64"),
      format: "der",
      type: "spki"
    });
  } catch (error) {
    throw new Error(`Invalid public_key encoding: ${error.message}`);
  }
}

export function verifyProof(document, signerIdentity) {
  if (!document.proof) {
    throw new Error("Missing proof");
  }

  if (document.proof.type !== SUPPORTED_PROOF_TYPE) {
    throw new Error(`Unsupported proof type: ${document.proof.type}`);
  }

  if (document.proof.canonicalization !== SUPPORTED_CANONICALIZATION) {
    throw new Error(`Unsupported canonicalization: ${document.proof.canonicalization}`);
  }

  const keyRecord = signerIdentity.keys.find((candidate) => candidate.kid === document.proof.kid);

  if (!keyRecord) {
    throw new Error(`Signer key ${document.proof.kid} not found on ${signerIdentity.object_id}`);
  }

  if (!keyRecord.algorithm) {
    throw new Error(`Signer key ${keyRecord.kid} is missing algorithm disclosure`);
  }

  if (keyRecord.algorithm !== SUPPORTED_KEY_ALGORITHM) {
    throw new Error(`Unsupported key algorithm for ${keyRecord.kid}: ${keyRecord.algorithm}`);
  }

  if (!keyRecord.public_key || typeof keyRecord.public_key !== "string") {
    throw new Error(`Signer key ${keyRecord.kid} is missing public_key`);
  }

  const verified = verify(
    null,
    Buffer.from(canonicalizeForProof(stripProof(document))),
    resolvePublicKey(keyRecord.public_key),
    Buffer.from(document.proof.signature, "base64")
  );

  if (!verified) {
    throw new Error(`Signature verification failed for ${document.object_id ?? document.envelope_id}`);
  }

  return keyRecord;
}
