import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, createPrivateKey, createPublicKey, sign } from "node:crypto";
import {
  canonicalizeForProof,
  DIGID_V03_CANONICALIZATION,
  DIGID_V03_CRYPTOSUITE_ID,
  DIGID_V03_KEY_ALGORITHM,
  DIGID_V03_PROOF_TYPE,
  DIGID_V03_PUBLIC_KEY_ENCODING,
  stripProof
} from "../packages/protocol/src/index.js";
import { DEMO_FIXTURE_KEY_MATERIAL } from "./demo-fixture-keys.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function iso(value) {
  return new Date(value).toISOString();
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function resolveKeyMaterial(pkcs8DerBase64) {
  const privateKey = createPrivateKey({
    key: Buffer.from(pkcs8DerBase64, "base64"),
    format: "der",
    type: "pkcs8"
  });

  const publicKey = createPublicKey(privateKey);

  return {
    private_key: pkcs8DerBase64,
    public_key: publicKey.export({ format: "der", type: "spki" }).toString("base64")
  };
}

function keyRecord(identityId, suffix, keyMaterial) {
  return {
    kid: `dgd:key:${identityId.split(":").pop()}:${suffix}`,
    algorithm: DIGID_V03_KEY_ALGORITHM,
    public_key_encoding: DIGID_V03_PUBLIC_KEY_ENCODING,
    public_key: keyMaterial.public_key,
    private_key: keyMaterial.private_key
  };
}

function signDocument(document, key) {
  const proofless = stripProof(document);
  const signature = sign(
    null,
    Buffer.from(canonicalizeForProof(proofless)),
    {
      key: Buffer.from(key.private_key, "base64"),
      format: "der",
      type: "pkcs8"
    }
  ).toString("base64");

  return {
    ...proofless,
    proof: {
      cryptosuite: DIGID_V03_CRYPTOSUITE_ID,
      type: DIGID_V03_PROOF_TYPE,
      kid: key.kid,
      created_at: proofless.created_at ?? proofless.timestamps?.created_at ?? iso("2026-04-15T00:00:00Z"),
      canonicalization: DIGID_V03_CANONICALIZATION,
      signature
    }
  };
}

async function writeJson(relativePath, value) {
  const absolutePath = path.join(repoRoot, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const orgId = "dgd:identity:org_globex";
  const key = keyRecord(
    orgId,
    "key-2026-01",
    resolveKeyMaterial(DEMO_FIXTURE_KEY_MATERIAL.org_globex.pkcs8_der_base64)
  );

  const orgIdentity = signDocument(
    {
      object_type: "dgd.identity",
      schema_version: "0.3",
      object_id: orgId,
      identity_class: "organization",
      display_name: "Globex Corporate",
      verification_state: "verified-organization",
      status: "active",
      keys: [
        {
          kid: key.kid,
          algorithm: DIGID_V03_KEY_ALGORITHM,
          public_key: key.public_key,
          public_key_encoding: DIGID_V03_PUBLIC_KEY_ENCODING,
          status: "active",
          purposes: ["assertion"],
          created_at: iso("2026-04-15T00:30:00Z"),
          not_before: iso("2026-04-15T00:30:00Z"),
          expires_at: null,
          revocation_checked_at: iso("2026-04-15T00:34:00Z")
        }
      ],
      controller: {
        controller_id: orgId,
        relationship: "self-controlled"
      },
      disclosure: {
        display_level: "standard",
        real_world_identity_disclosed: true,
        supports_selective_disclosure: false
      },
      created_at: iso("2026-04-15T00:30:00Z")
    },
    key
  );

  const communication = signDocument(
    {
      object_type: "dgd.communication",
      schema_version: "0.3",
      object_id: "dgd:communication:message_globex_01",
      status: "active",
      channel: "message",
      channel_subtype: "broadcast",
      session_id: "dgd:session:message_globex_01",
      sender: {
        identity_id: orgId,
        identity_class: "organization",
        verification_state: "verified-organization"
      },
      purpose: "policy-update",
      payload: {
        content_type: "session-manifest",
        content_digest: sha256("globex-message-policy-update-thread"),
        content_length: 128,
        media_mode: "async-message"
      },
      timestamps: {
        created_at: iso("2026-04-15T00:30:05Z"),
        session_started_at: iso("2026-04-15T00:30:05Z"),
        session_ended_at: null
      },
      created_at: iso("2026-04-15T00:30:05Z")
    },
    key
  );

  const session = signDocument(
    {
      object_type: "dgd.session",
      schema_version: "0.3",
      object_id: "dgd:session:message_globex_01",
      status: "active",
      session_type: "message.thread",
      communication_id: communication.object_id,
      channel: "message",
      sequence_scope: {
        scope_type: "conversation",
        scope_id: "dgd:session:message_globex_01",
        next_expected_sequence: 1
      },
      timestamps: {
        created_at: iso("2026-04-15T00:30:05Z"),
        started_at: iso("2026-04-15T00:30:05Z"),
        ended_at: null
      },
      created_at: iso("2026-04-15T00:30:05Z")
    },
    key
  );

  const messagePayload = {
    content_type: "application/dgd+json",
    content_digest: sha256("globex-message-policy-update"),
    content_length: 96,
    summary: "Policy update from Globex Corporate",
    purpose: "policy-update"
  };

  const message = signDocument(
    {
      envelope_type: "dgd.message",
      schema_version: "0.3",
      envelope_id: "dgd:envelope:msg_globex_policy_update_01",
      message_type: "message.policy.update",
      subject_id: communication.object_id,
      channel: "message",
      sender_id: orgId,
      conversation_id: session.object_id,
      created_at: iso("2026-04-15T00:30:11Z"),
      purpose: "policy-update",
      verification_context: {
        verification_mode: "current_time",
        revocation_max_age_seconds: 3600
      },
      payload: messagePayload
    },
    key
  );

  const manifest = {
    manifest_type: "dgd.fixture_manifest",
    schema_version: "0.3",
    manifest_id: "dgd:manifest:message_verified_organization",
    scenario_id: "message-verified-organization",
    scenario_class: "verified-organization-message",
    description: "Pinned verified organization message for Globex Corporate",
    lineage_group: "demo-message-globex-01",
    verification_time: iso("2026-04-15T00:35:00Z"),
    verification_defaults: {
      mode: "current_time",
      revocation_max_age_seconds: 3600,
      trusted_issuer_ids: [orgId]
    },
    objects: [
      {
        role: "organization_identity",
        object_type: "dgd.identity",
        path: "fixtures/demo/globex.identity.json",
        required: true,
        stable_across_lineage: true
      },
      {
        role: "communication_anchor",
        object_type: "dgd.communication",
        path: "fixtures/demo/globex.communication.json",
        required: true,
        stable_across_lineage: true
      },
      {
        role: "session_object",
        object_type: "dgd.session",
        path: "fixtures/demo/globex.session.json",
        required: true,
        stable_across_lineage: true
      },
      {
        role: "policy_message",
        object_type: "dgd.message",
        path: "fixtures/demo/messages/globex.policy-update.message.json",
        required: true,
        stable_across_lineage: true
      }
    ],
    expected_outcome: {
      compact_label: "Verified organization",
      decision: "allow-with-trust-indicator",
      resolved_trust_state: "verified-organization",
      warning_codes: [],
      error_count: 0,
      checks: {
        signature_valid: true,
        event_time_valid: true,
        current_time_valid: true,
        owner_binding_status: "not-required",
        authority_scope_status: "not-required",
        revocation_status: "clear",
        freshness_status: "fresh",
        replay_status: "clear"
      }
    }
  };

  await writeJson("fixtures/demo/globex.identity.json", orgIdentity);
  await writeJson("fixtures/demo/globex.communication.json", communication);
  await writeJson("fixtures/demo/globex.session.json", session);
  await writeJson("fixtures/demo/messages/globex.policy-update.message.json", message);
  await writeJson("fixtures/demo/manifests/message.verified-organization.manifest.json", manifest);
}

main().catch((error) => {
  console.error(error.stack);
  process.exitCode = 1;
});
