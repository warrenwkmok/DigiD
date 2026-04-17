import { createPublicKey, verify } from "node:crypto";
import { canonicalizeForProof, stripProof } from "./canonicalize.js";

function resolvePublicKey(publicKeyDerBase64) {
  return createPublicKey({
    key: Buffer.from(publicKeyDerBase64, "base64"),
    format: "der",
    type: "spki"
  });
}

export function verifyProof(document, signerIdentity) {
  if (!document.proof) {
    throw new Error("Missing proof");
  }

  if (document.proof.type !== "ed25519-2020") {
    throw new Error(`Unsupported proof type: ${document.proof.type}`);
  }

  if (document.proof.canonicalization !== "JCS") {
    throw new Error(`Unsupported canonicalization: ${document.proof.canonicalization}`);
  }

  const keyRecord = signerIdentity.keys.find((candidate) => candidate.kid === document.proof.kid);

  if (!keyRecord) {
    throw new Error(`Signer key ${document.proof.kid} not found on ${signerIdentity.object_id}`);
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
