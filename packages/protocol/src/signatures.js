import { createPublicKey, verify } from "node:crypto";
import { canonicalizeForProof, stripProof } from "./canonicalize.js";

import {
  DIGID_V03_CANONICALIZATION,
  DIGID_V03_CRYPTOSUITE_ID,
  DIGID_V03_KEY_ALGORITHM,
  DIGID_V03_PROOF_TYPE,
  DIGID_V03_PUBLIC_KEY_ENCODING
} from "./cryptosuite.js";

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

  if (!document.proof.cryptosuite) {
    throw new Error("Missing proof cryptosuite disclosure");
  }

  if (document.proof.cryptosuite !== DIGID_V03_CRYPTOSUITE_ID) {
    throw new Error(`Unsupported proof cryptosuite: ${document.proof.cryptosuite}`);
  }

  if (document.proof.type !== DIGID_V03_PROOF_TYPE) {
    throw new Error(`Unsupported proof type: ${document.proof.type}`);
  }

  if (document.proof.canonicalization !== DIGID_V03_CANONICALIZATION) {
    throw new Error(`Unsupported canonicalization: ${document.proof.canonicalization}`);
  }

  const keyRecord = signerIdentity.keys.find((candidate) => candidate.kid === document.proof.kid);

  if (!keyRecord) {
    throw new Error(`Signer key ${document.proof.kid} not found on ${signerIdentity.object_id}`);
  }

  if (!keyRecord.algorithm) {
    throw new Error(`Signer key ${keyRecord.kid} is missing algorithm disclosure`);
  }

  if (keyRecord.algorithm !== DIGID_V03_KEY_ALGORITHM) {
    throw new Error(`Unsupported key algorithm for ${keyRecord.kid}: ${keyRecord.algorithm}`);
  }

  if (!keyRecord.public_key || typeof keyRecord.public_key !== "string") {
    throw new Error(`Signer key ${keyRecord.kid} is missing public_key`);
  }

  if (!keyRecord.public_key_encoding) {
    throw new Error(`Signer key ${keyRecord.kid} is missing public_key_encoding disclosure`);
  }

  if (keyRecord.public_key_encoding !== DIGID_V03_PUBLIC_KEY_ENCODING) {
    throw new Error(`Unsupported public_key_encoding for ${keyRecord.kid}: ${keyRecord.public_key_encoding}`);
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
