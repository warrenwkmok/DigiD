import { generateKeyPairSync, sign, createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalizeForProof, digestCanonicalPayload, stripProof } from "../packages/protocol/src/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function iso(value) {
  return new Date(value).toISOString();
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function keyRecord(identityId, suffix, privateKey, publicKey) {
  return {
    kid: `dgd:key:${identityId.split(":").pop()}:${suffix}`,
    algorithm: "Ed25519",
    public_key: publicKey.export({ format: "der", type: "spki" }).toString("base64"),
    private_key: privateKey.export({ format: "der", type: "pkcs8" }).toString("base64")
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
      type: "ed25519-2020",
      kid: key.kid,
      created_at: proofless.created_at ?? proofless.timestamps?.created_at ?? iso("2026-04-15T00:00:00Z"),
      canonicalization: "JCS",
      signature
    }
  };
}

function buildKeys() {
  const org = generateKeyPairSync("ed25519");
  const rogueOrg = generateKeyPairSync("ed25519");
  const agent = generateKeyPairSync("ed25519");
  const human = generateKeyPairSync("ed25519");
  const unverified = generateKeyPairSync("ed25519");

  return {
    org: keyRecord("dgd:identity:org_acme", "key-2026-01", org.privateKey, org.publicKey),
    rogueOrg: keyRecord("dgd:identity:org_northwind", "key-2026-01", rogueOrg.privateKey, rogueOrg.publicKey),
    agent: keyRecord("dgd:identity:agent_01", "key-2026-04", agent.privateKey, agent.publicKey),
    human: keyRecord("dgd:identity:human_01", "key-2026-04", human.privateKey, human.publicKey),
    unverified: keyRecord("dgd:identity:unverified_01", "key-2026-04", unverified.privateKey, unverified.publicKey)
  };
}

async function ensureDirectories() {
  const directories = [
    "fixtures/demo/manifests",
    "fixtures/demo/events",
    "fixtures/demo/messages",
    "fixtures/demo/owner-binding",
    "fixtures/demo/owner-binding/events",
    "fixtures/demo/owner-binding/messages",
    "fixtures/demo/revocations",
    "fixtures/demo/results"
  ];

  for (const directory of directories) {
    await mkdir(path.join(repoRoot, directory), { recursive: true });
  }
}

async function writeJson(relativePath, value) {
  await writeFile(path.join(repoRoot, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildDelegatedVoiceFixtures(keys) {
  const orgIdentity = signDocument({
    object_type: "dgd.identity",
    schema_version: "0.3",
    object_id: "dgd:identity:org_acme",
    identity_class: "organization",
    display_name: "Acme Support",
    verification_state: "verified-organization",
    status: "active",
    keys: [
      {
        kid: keys.org.kid,
        algorithm: "Ed25519",
        public_key: keys.org.public_key,
        status: "active",
        purposes: ["assertion"],
        created_at: iso("2026-04-15T00:00:00Z"),
        not_before: iso("2026-04-15T00:00:00Z"),
        expires_at: null,
        revocation_checked_at: iso("2026-04-15T00:04:00Z")
      }
    ],
    controller: {
      controller_id: "dgd:identity:org_acme",
      relationship: "self-controlled"
    },
    disclosure: {
      display_level: "standard",
      real_world_identity_disclosed: true,
      supports_selective_disclosure: false
    },
    created_at: iso("2026-04-15T00:00:00Z")
  }, keys.org);

  const agentIdentity = signDocument({
    object_type: "dgd.identity",
    schema_version: "0.3",
    object_id: "dgd:identity:agent_01",
    identity_class: "agent",
    display_name: "Acme Support Agent 01",
    verification_state: "verified-agent",
    status: "active",
    keys: [
      {
        kid: keys.agent.kid,
        algorithm: "Ed25519",
        public_key: keys.agent.public_key,
        status: "active",
        purposes: ["assertion"],
        created_at: iso("2026-04-15T00:00:00Z"),
        not_before: iso("2026-04-15T00:00:00Z"),
        expires_at: null,
        revocation_checked_at: iso("2026-04-15T00:04:00Z")
      }
    ],
    controller: {
      controller_id: "dgd:identity:org_acme",
      relationship: "organization-issued"
    },
    disclosure: {
      display_level: "standard",
      real_world_identity_disclosed: false,
      supports_selective_disclosure: false
    },
    created_at: iso("2026-04-15T00:00:00Z")
  }, keys.org);

  const agentAttestation = signDocument({
    object_type: "dgd.attestation",
    schema_version: "0.3",
    object_id: "dgd:attestation:agent_01",
    issuer_id: "dgd:identity:org_acme",
    subject_id: "dgd:identity:agent_01",
    attestation_type: "organization-issued-agent",
    verification_state: "verified-agent",
    status: "active",
    valid_from: iso("2026-04-15T00:00:00Z"),
    valid_until: iso("2026-10-15T00:00:00Z"),
    revocation_check: {
      mode: "online-or-cached",
      max_age_seconds: 3600,
      status: "clear",
      checked_at: iso("2026-04-15T00:04:00Z")
    },
    created_at: iso("2026-04-15T00:00:01Z")
  }, keys.org);

  const agentDelegation = signDocument({
    object_type: "dgd.delegation",
    schema_version: "0.3",
    object_id: "dgd:delegation:agent_01_voice",
    issuer_id: "dgd:identity:org_acme",
    delegate_id: "dgd:identity:agent_01",
    delegate_class: "agent",
    status: "active",
    authority: {
      channels: ["voice"],
      actions: ["communicate", "sign-session", "sign-message"],
      restrictions: ["no-financial-approval"],
      purpose_bindings: ["support-follow-up"]
    },
    valid_from: iso("2026-04-15T00:00:00Z"),
    valid_until: iso("2026-10-15T00:00:00Z"),
    revocation_check: {
      mode: "online-required",
      max_age_seconds: 300,
      status: "clear",
      checked_at: iso("2026-04-15T00:04:00Z")
    },
    created_at: iso("2026-04-15T00:00:02Z")
  }, keys.org);

  const communication = signDocument({
    object_type: "dgd.communication",
    schema_version: "0.3",
    object_id: "dgd:communication:voice_acme_01",
    status: "active",
    channel: "voice",
    channel_subtype: "outbound-call",
    session_id: "dgd:session:voice_acme_01",
    sender: {
      identity_id: "dgd:identity:agent_01",
      identity_class: "agent",
      verification_state: "delegated-agent"
    },
    operator_id: "dgd:identity:org_acme",
    delegation_id: "dgd:delegation:agent_01_voice",
    purpose: "support-follow-up",
    payload: {
      content_type: "session-manifest",
      content_digest: sha256("voice-acme-session-manifest"),
      content_length: 128,
      media_mode: "real-time-voice"
    },
    timestamps: {
      created_at: iso("2026-04-15T00:00:05Z"),
      session_started_at: iso("2026-04-15T00:00:10Z"),
      session_ended_at: null
    },
    created_at: iso("2026-04-15T00:00:05Z")
  }, keys.agent);

  const session = signDocument({
    object_type: "dgd.session",
    schema_version: "0.3",
    object_id: "dgd:session:voice_acme_01",
    status: "active",
    session_type: "voice.live",
    communication_id: "dgd:communication:voice_acme_01",
    channel: "voice",
    operator_id: "dgd:identity:org_acme",
    sequence_scope: {
      scope_type: "conversation",
      scope_id: "dgd:session:voice_acme_01",
      next_expected_sequence: 2
    },
    timestamps: {
      created_at: iso("2026-04-15T00:00:05Z"),
      started_at: iso("2026-04-15T00:00:10Z"),
      ended_at: null
    },
    created_at: iso("2026-04-15T00:00:05Z")
  }, keys.agent);

  const startedPayload = {
    direction: "outbound",
    channel_subtype: "outbound-call",
    session_started_at: iso("2026-04-15T00:00:10Z"),
    announcement_expected: true
  };

  const startedEvent = signDocument({
    envelope_type: "dgd.event",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:event_voice_started_01",
    event_type: "voice.session.started",
    subject_id: "dgd:communication:voice_acme_01",
    actor_id: "dgd:identity:agent_01",
    operator_id: "dgd:identity:org_acme",
    delegation_id: "dgd:delegation:agent_01_voice",
    conversation_id: "dgd:session:voice_acme_01",
    created_at: iso("2026-04-15T00:00:10Z"),
    purpose: "support-follow-up",
    sequence: 1,
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload: startedPayload,
    payload_digest: digestCanonicalPayload(startedPayload)
  }, keys.agent);

  const announcementPayload = {
    content_type: "application/dgd+json",
    content_digest: sha256("verified-agent-for-acme-support"),
    content_length: 64,
    summary: "Verified agent for Acme Support",
    purpose: "support-follow-up"
  };

  const announcementMessage = signDocument({
    envelope_type: "dgd.message",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:msg_voice_announcement_01",
    message_type: "voice.session.announcement",
    subject_id: "dgd:communication:voice_acme_01",
    channel: "voice",
    sender_id: "dgd:identity:agent_01",
    operator_id: "dgd:identity:org_acme",
    delegation_id: "dgd:delegation:agent_01_voice",
    conversation_id: "dgd:session:voice_acme_01",
    created_at: iso("2026-04-15T00:00:11Z"),
    purpose: "support-follow-up",
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload: announcementPayload
  }, keys.agent);

  const revocation = signDocument({
    object_type: "dgd.revocation",
    schema_version: "0.3",
    object_id: "dgd:revocation:delegation_agent_01_voice",
    issuer_id: "dgd:identity:org_acme",
    target_object_id: "dgd:delegation:agent_01_voice",
    target_object_type: "dgd.delegation",
    status: "active",
    reason_code: "authorization-ended",
    revoked_at: iso("2026-04-15T00:12:00Z"),
    created_at: iso("2026-04-15T00:12:00Z")
  }, keys.org);

  return {
    "fixtures/demo/org.identity.json": orgIdentity,
    "fixtures/demo/agent.identity.json": agentIdentity,
    "fixtures/demo/agent.attestation.json": agentAttestation,
    "fixtures/demo/agent.delegation.json": agentDelegation,
    "fixtures/demo/voice.communication.json": communication,
    "fixtures/demo/voice.session.json": session,
    "fixtures/demo/events/voice.session.started.json": startedEvent,
    "fixtures/demo/messages/voice.session.announcement.json": announcementMessage,
    "fixtures/demo/revocations/delegation.revoked.json": revocation
  };
}

function buildDirectHumanFixtures(keys) {
  const humanIdentity = signDocument({
    object_type: "dgd.identity",
    schema_version: "0.3",
    object_id: "dgd:identity:human_01",
    identity_class: "human",
    display_name: "Jordan Lee",
    verification_state: "verified-human",
    status: "active",
    keys: [
      {
        kid: keys.human.kid,
        algorithm: "Ed25519",
        public_key: keys.human.public_key,
        status: "active",
        purposes: ["assertion"],
        created_at: iso("2026-04-15T00:00:00Z"),
        not_before: iso("2026-04-15T00:00:00Z"),
        expires_at: null,
        revocation_checked_at: iso("2026-04-15T00:04:00Z")
      }
    ],
    controller: {
      controller_id: "dgd:identity:human_01",
      relationship: "self-controlled"
    },
    disclosure: {
      display_level: "standard",
      real_world_identity_disclosed: true,
      supports_selective_disclosure: false
    },
    created_at: iso("2026-04-15T00:00:00Z")
  }, keys.human);

  const humanAttestation = signDocument({
    object_type: "dgd.attestation",
    schema_version: "0.3",
    object_id: "dgd:attestation:human_01",
    issuer_id: "dgd:identity:org_acme",
    subject_id: "dgd:identity:human_01",
    attestation_type: "verified-human",
    verification_state: "verified-human",
    status: "active",
    valid_from: iso("2026-04-15T00:00:00Z"),
    valid_until: iso("2026-10-15T00:00:00Z"),
    revocation_check: {
      mode: "online-or-cached",
      max_age_seconds: 3600,
      status: "clear",
      checked_at: iso("2026-04-15T00:04:00Z")
    },
    created_at: iso("2026-04-15T00:00:03Z")
  }, keys.org);

  const communication = signDocument({
    object_type: "dgd.communication",
    schema_version: "0.3",
    object_id: "dgd:communication:voice_human_01",
    status: "active",
    channel: "voice",
    channel_subtype: "outbound-call",
    session_id: "dgd:session:voice_human_01",
    sender: {
      identity_id: "dgd:identity:human_01",
      identity_class: "human",
      verification_state: "verified-human"
    },
    purpose: "support-follow-up",
    payload: {
      content_type: "session-manifest",
      content_digest: sha256("voice-human-session-manifest"),
      content_length: 88,
      media_mode: "real-time-voice"
    },
    timestamps: {
      created_at: iso("2026-04-15T00:01:05Z"),
      session_started_at: iso("2026-04-15T00:01:10Z"),
      session_ended_at: null
    },
    created_at: iso("2026-04-15T00:01:05Z")
  }, keys.human);

  const session = signDocument({
    object_type: "dgd.session",
    schema_version: "0.3",
    object_id: "dgd:session:voice_human_01",
    status: "active",
    session_type: "voice.live",
    communication_id: "dgd:communication:voice_human_01",
    channel: "voice",
    sequence_scope: {
      scope_type: "conversation",
      scope_id: "dgd:session:voice_human_01",
      next_expected_sequence: 2
    },
    timestamps: {
      created_at: iso("2026-04-15T00:01:05Z"),
      started_at: iso("2026-04-15T00:01:10Z"),
      ended_at: null
    },
    created_at: iso("2026-04-15T00:01:05Z")
  }, keys.human);

  const payload = {
    direction: "outbound",
    channel_subtype: "outbound-call",
    session_started_at: iso("2026-04-15T00:01:10Z"),
    announcement_expected: true
  };

  const startedEvent = signDocument({
    envelope_type: "dgd.event",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:event_voice_human_started_01",
    event_type: "voice.session.started",
    subject_id: "dgd:communication:voice_human_01",
    actor_id: "dgd:identity:human_01",
    conversation_id: "dgd:session:voice_human_01",
    created_at: iso("2026-04-15T00:01:10Z"),
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload,
    payload_digest: digestCanonicalPayload(payload),
    sequence: 1
  }, keys.human);

  const announcementMessage = signDocument({
    envelope_type: "dgd.message",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:msg_voice_human_announcement_01",
    message_type: "voice.session.announcement",
    subject_id: "dgd:communication:voice_human_01",
    channel: "voice",
    sender_id: "dgd:identity:human_01",
    conversation_id: "dgd:session:voice_human_01",
    created_at: iso("2026-04-15T00:01:11Z"),
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload: {
      content_type: "application/dgd+json",
      content_digest: sha256("verified-human"),
      content_length: 24,
      summary: "Verified human"
    }
  }, keys.human);

  return {
    "fixtures/demo/human.identity.json": humanIdentity,
    "fixtures/demo/human.attestation.json": humanAttestation,
    "fixtures/demo/human.communication.json": communication,
    "fixtures/demo/human.session.json": session,
    "fixtures/demo/events/human.voice.session.started.json": startedEvent,
    "fixtures/demo/messages/human.voice.session.announcement.json": announcementMessage
  };
}

function buildUnverifiedFixtures(keys) {
  const identity = signDocument({
    object_type: "dgd.identity",
    schema_version: "0.3",
    object_id: "dgd:identity:unverified_01",
    identity_class: "unverified",
    display_name: "Caller Unknown 01",
    verification_state: "self-asserted",
    status: "active",
    keys: [
      {
        kid: keys.unverified.kid,
        algorithm: "Ed25519",
        public_key: keys.unverified.public_key,
        status: "active",
        purposes: ["assertion"],
        created_at: iso("2026-04-15T00:00:00Z"),
        not_before: iso("2026-04-15T00:00:00Z"),
        expires_at: null,
        revocation_checked_at: null
      }
    ],
    controller: {
      controller_id: "dgd:identity:unverified_01",
      relationship: "self-controlled"
    },
    disclosure: {
      display_level: "minimal",
      real_world_identity_disclosed: false,
      supports_selective_disclosure: false
    },
    created_at: iso("2026-04-15T00:00:00Z")
  }, keys.unverified);

  const communication = signDocument({
    object_type: "dgd.communication",
    schema_version: "0.3",
    object_id: "dgd:communication:voice_unverified_01",
    status: "active",
    channel: "voice",
    channel_subtype: "outbound-call",
    session_id: "dgd:session:voice_unverified_01",
    sender: {
      identity_id: "dgd:identity:unverified_01",
      identity_class: "unverified",
      verification_state: "self-asserted"
    },
    purpose: "support-follow-up",
    payload: {
      content_type: "session-manifest",
      content_digest: sha256("voice-unverified-session-manifest"),
      content_length: 96,
      media_mode: "real-time-voice"
    },
    timestamps: {
      created_at: iso("2026-04-15T00:02:05Z"),
      session_started_at: iso("2026-04-15T00:02:10Z"),
      session_ended_at: null
    },
    created_at: iso("2026-04-15T00:02:05Z")
  }, keys.unverified);

  const session = signDocument({
    object_type: "dgd.session",
    schema_version: "0.3",
    object_id: "dgd:session:voice_unverified_01",
    status: "active",
    session_type: "voice.live",
    communication_id: "dgd:communication:voice_unverified_01",
    channel: "voice",
    sequence_scope: {
      scope_type: "conversation",
      scope_id: "dgd:session:voice_unverified_01",
      next_expected_sequence: 2
    },
    timestamps: {
      created_at: iso("2026-04-15T00:02:05Z"),
      started_at: iso("2026-04-15T00:02:10Z"),
      ended_at: null
    },
    created_at: iso("2026-04-15T00:02:05Z")
  }, keys.unverified);

  const payload = {
    direction: "outbound",
    channel_subtype: "outbound-call",
    session_started_at: iso("2026-04-15T00:02:10Z"),
    announcement_expected: true
  };

  const startedEvent = signDocument({
    envelope_type: "dgd.event",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:event_voice_unverified_started_01",
    event_type: "voice.session.started",
    subject_id: "dgd:communication:voice_unverified_01",
    actor_id: "dgd:identity:unverified_01",
    conversation_id: "dgd:session:voice_unverified_01",
    created_at: iso("2026-04-15T00:02:10Z"),
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload,
    payload_digest: digestCanonicalPayload(payload),
    sequence: 1
  }, keys.unverified);

  const announcementMessage = signDocument({
    envelope_type: "dgd.message",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:msg_voice_unverified_announcement_01",
    message_type: "voice.session.announcement",
    subject_id: "dgd:communication:voice_unverified_01",
    channel: "voice",
    sender_id: "dgd:identity:unverified_01",
    conversation_id: "dgd:session:voice_unverified_01",
    created_at: iso("2026-04-15T00:02:11Z"),
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload: {
      content_type: "application/dgd+json",
      content_digest: sha256("unverified-sender"),
      content_length: 19,
      summary: "Unverified sender"
    }
  }, keys.unverified);

  return {
    "fixtures/demo/unverified.identity.json": identity,
    "fixtures/demo/unverified.communication.json": communication,
    "fixtures/demo/unverified.session.json": session,
    "fixtures/demo/events/unverified.voice.session.started.json": startedEvent,
    "fixtures/demo/messages/unverified.voice.session.announcement.json": announcementMessage
  };
}

function buildOwnerBindingMismatchFixtures(keys) {
  const verifiedOrgIdentity = signDocument({
    object_type: "dgd.identity",
    schema_version: "0.3",
    object_id: "dgd:identity:org_acme_owner_binding",
    identity_class: "organization",
    display_name: "Acme Support",
    verification_state: "verified-organization",
    status: "active",
    keys: [
      {
        kid: `${keys.org.kid}:owner-binding`,
        algorithm: "Ed25519",
        public_key: keys.org.public_key,
        status: "active",
        purposes: ["assertion"],
        created_at: iso("2026-04-15T00:20:00Z"),
        not_before: iso("2026-04-15T00:20:00Z"),
        expires_at: null,
        revocation_checked_at: iso("2026-04-15T00:24:00Z")
      }
    ],
    controller: {
      controller_id: "dgd:identity:org_acme_owner_binding",
      relationship: "self-controlled"
    },
    disclosure: {
      display_level: "standard",
      real_world_identity_disclosed: true,
      supports_selective_disclosure: false
    },
    created_at: iso("2026-04-15T00:20:00Z")
  }, {
    ...keys.org,
    kid: `${keys.org.kid}:owner-binding`
  });

  const rogueOrgIdentity = signDocument({
    object_type: "dgd.identity",
    schema_version: "0.3",
    object_id: "dgd:identity:org_northwind",
    identity_class: "organization",
    display_name: "Northwind Sales",
    verification_state: "verified-organization",
    status: "active",
    keys: [
      {
        kid: keys.rogueOrg.kid,
        algorithm: "Ed25519",
        public_key: keys.rogueOrg.public_key,
        status: "active",
        purposes: ["assertion"],
        created_at: iso("2026-04-15T00:20:00Z"),
        not_before: iso("2026-04-15T00:20:00Z"),
        expires_at: null,
        revocation_checked_at: iso("2026-04-15T00:24:00Z")
      }
    ],
    controller: {
      controller_id: "dgd:identity:org_northwind",
      relationship: "self-controlled"
    },
    disclosure: {
      display_level: "standard",
      real_world_identity_disclosed: true,
      supports_selective_disclosure: false
    },
    created_at: iso("2026-04-15T00:20:00Z")
  }, keys.rogueOrg);

  const agentIdentity = signDocument({
    object_type: "dgd.identity",
    schema_version: "0.3",
    object_id: "dgd:identity:agent_owner_binding_01",
    identity_class: "agent",
    display_name: "Acme Follow-up Agent 07",
    verification_state: "verified-agent",
    status: "active",
    keys: [
      {
        kid: "dgd:key:agent_owner_binding_01:key-2026-04",
        algorithm: "Ed25519",
        public_key: keys.agent.public_key,
        status: "active",
        purposes: ["assertion"],
        created_at: iso("2026-04-15T00:20:00Z"),
        not_before: iso("2026-04-15T00:20:00Z"),
        expires_at: null,
        revocation_checked_at: iso("2026-04-15T00:24:00Z")
      }
    ],
    controller: {
      controller_id: "dgd:identity:org_acme_owner_binding",
      relationship: "organization-issued"
    },
    disclosure: {
      display_level: "standard",
      real_world_identity_disclosed: false,
      supports_selective_disclosure: false
    },
    created_at: iso("2026-04-15T00:20:01Z")
  }, {
    ...keys.org,
    kid: `${keys.org.kid}:owner-binding`
  });

  const attestation = signDocument({
    object_type: "dgd.attestation",
    schema_version: "0.3",
    object_id: "dgd:attestation:agent_owner_binding_01",
    issuer_id: "dgd:identity:org_acme_owner_binding",
    subject_id: "dgd:identity:agent_owner_binding_01",
    attestation_type: "organization-issued-agent",
    verification_state: "verified-agent",
    status: "active",
    valid_from: iso("2026-04-15T00:20:00Z"),
    valid_until: iso("2026-10-15T00:20:00Z"),
    revocation_check: {
      mode: "online-or-cached",
      max_age_seconds: 3600,
      status: "clear",
      checked_at: iso("2026-04-15T00:24:00Z")
    },
    created_at: iso("2026-04-15T00:20:02Z")
  }, {
    ...keys.org,
    kid: `${keys.org.kid}:owner-binding`
  });

  const rogueDelegation = signDocument({
    object_type: "dgd.delegation",
    schema_version: "0.3",
    object_id: "dgd:delegation:agent_owner_binding_01_voice",
    issuer_id: "dgd:identity:org_northwind",
    delegate_id: "dgd:identity:agent_owner_binding_01",
    delegate_class: "agent",
    status: "active",
    authority: {
      channels: ["voice"],
      actions: ["communicate", "sign-session", "sign-message"],
      restrictions: ["no-financial-approval"],
      purpose_bindings: ["support-follow-up"]
    },
    valid_from: iso("2026-04-15T00:20:00Z"),
    valid_until: iso("2026-10-15T00:20:00Z"),
    revocation_check: {
      mode: "online-required",
      max_age_seconds: 300,
      status: "clear",
      checked_at: iso("2026-04-15T00:24:00Z")
    },
    created_at: iso("2026-04-15T00:20:03Z")
  }, keys.rogueOrg);

  const communication = signDocument({
    object_type: "dgd.communication",
    schema_version: "0.3",
    object_id: "dgd:communication:voice_owner_binding_01",
    status: "active",
    channel: "voice",
    channel_subtype: "outbound-call",
    session_id: "dgd:session:voice_owner_binding_01",
    sender: {
      identity_id: "dgd:identity:agent_owner_binding_01",
      identity_class: "agent",
      verification_state: "delegated-agent"
    },
    operator_id: "dgd:identity:org_northwind",
    delegation_id: "dgd:delegation:agent_owner_binding_01_voice",
    purpose: "support-follow-up",
    payload: {
      content_type: "session-manifest",
      content_digest: sha256("voice-owner-binding-session-manifest"),
      content_length: 128,
      media_mode: "real-time-voice"
    },
    timestamps: {
      created_at: iso("2026-04-15T00:20:05Z"),
      session_started_at: iso("2026-04-15T00:20:10Z"),
      session_ended_at: null
    },
    created_at: iso("2026-04-15T00:20:05Z")
  }, {
    ...keys.agent,
    kid: "dgd:key:agent_owner_binding_01:key-2026-04"
  });

  const session = signDocument({
    object_type: "dgd.session",
    schema_version: "0.3",
    object_id: "dgd:session:voice_owner_binding_01",
    status: "active",
    session_type: "voice.live",
    communication_id: "dgd:communication:voice_owner_binding_01",
    channel: "voice",
    operator_id: "dgd:identity:org_northwind",
    sequence_scope: {
      scope_type: "conversation",
      scope_id: "dgd:session:voice_owner_binding_01",
      next_expected_sequence: 2
    },
    timestamps: {
      created_at: iso("2026-04-15T00:20:05Z"),
      started_at: iso("2026-04-15T00:20:10Z"),
      ended_at: null
    },
    created_at: iso("2026-04-15T00:20:05Z")
  }, {
    ...keys.agent,
    kid: "dgd:key:agent_owner_binding_01:key-2026-04"
  });

  const startedPayload = {
    direction: "outbound",
    channel_subtype: "outbound-call",
    session_started_at: iso("2026-04-15T00:20:10Z"),
    announcement_expected: true
  };

  const startedEvent = signDocument({
    envelope_type: "dgd.event",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:event_voice_owner_binding_started_01",
    event_type: "voice.session.started",
    subject_id: "dgd:communication:voice_owner_binding_01",
    actor_id: "dgd:identity:agent_owner_binding_01",
    operator_id: "dgd:identity:org_northwind",
    delegation_id: "dgd:delegation:agent_owner_binding_01_voice",
    conversation_id: "dgd:session:voice_owner_binding_01",
    created_at: iso("2026-04-15T00:20:10Z"),
    purpose: "support-follow-up",
    sequence: 1,
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload: startedPayload,
    payload_digest: digestCanonicalPayload(startedPayload)
  }, {
    ...keys.agent,
    kid: "dgd:key:agent_owner_binding_01:key-2026-04"
  });

  const announcementPayload = {
    content_type: "application/dgd+json",
    content_digest: sha256("agent-signature-not-bound-to-verified-owner"),
    content_length: 96,
    summary: "Agent signature not bound to verified owner",
    purpose: "support-follow-up"
  };

  const announcementMessage = signDocument({
    envelope_type: "dgd.message",
    schema_version: "0.3",
    envelope_id: "dgd:envelope:msg_voice_owner_binding_announcement_01",
    message_type: "voice.session.announcement",
    subject_id: "dgd:communication:voice_owner_binding_01",
    channel: "voice",
    sender_id: "dgd:identity:agent_owner_binding_01",
    operator_id: "dgd:identity:org_northwind",
    delegation_id: "dgd:delegation:agent_owner_binding_01_voice",
    conversation_id: "dgd:session:voice_owner_binding_01",
    created_at: iso("2026-04-15T00:20:11Z"),
    purpose: "support-follow-up",
    verification_context: {
      verification_mode: "dual",
      revocation_max_age_seconds: 300
    },
    payload: announcementPayload
  }, {
    ...keys.agent,
    kid: "dgd:key:agent_owner_binding_01:key-2026-04"
  });

  return {
    "fixtures/demo/owner-binding/owner.identity.json": verifiedOrgIdentity,
    "fixtures/demo/owner-binding/rogue-org.identity.json": rogueOrgIdentity,
    "fixtures/demo/owner-binding/agent.identity.json": agentIdentity,
    "fixtures/demo/owner-binding/agent.attestation.json": attestation,
    "fixtures/demo/owner-binding/agent.delegation.json": rogueDelegation,
    "fixtures/demo/owner-binding/voice.communication.json": communication,
    "fixtures/demo/owner-binding/voice.session.json": session,
    "fixtures/demo/owner-binding/events/voice.session.started.json": startedEvent,
    "fixtures/demo/owner-binding/messages/voice.session.announcement.json": announcementMessage
  };
}

function buildManifests() {
  const baseObjects = [
    { role: "organization_identity", object_type: "dgd.identity", path: "fixtures/demo/org.identity.json", required: true, stable_across_lineage: true },
    { role: "agent_identity", object_type: "dgd.identity", path: "fixtures/demo/agent.identity.json", required: true, stable_across_lineage: true },
    { role: "agent_attestation", object_type: "dgd.attestation", path: "fixtures/demo/agent.attestation.json", required: true, stable_across_lineage: true },
    { role: "agent_delegation", object_type: "dgd.delegation", path: "fixtures/demo/agent.delegation.json", required: true, stable_across_lineage: true },
    { role: "communication_anchor", object_type: "dgd.communication", path: "fixtures/demo/voice.communication.json", required: true, stable_across_lineage: true },
    { role: "session_object", object_type: "dgd.session", path: "fixtures/demo/voice.session.json", required: true, stable_across_lineage: true },
    { role: "session_started_event", object_type: "dgd.event", path: "fixtures/demo/events/voice.session.started.json", required: true, stable_across_lineage: true },
    { role: "session_announcement_message", object_type: "dgd.message", path: "fixtures/demo/messages/voice.session.announcement.json", required: true, stable_across_lineage: true }
  ];

  return {
    "fixtures/demo/manifests/voice.happy-path.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_happy_path",
      scenario_id: "voice-happy-path",
      scenario_class: "delegated-agent-voice",
      description: "Verified delegated agent voice call for Acme Support",
      lineage_group: "demo-voice-acme-01",
      verification_time: iso("2026-04-15T00:05:00Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300, trusted_issuer_ids: ["dgd:identity:org_acme"] },
      objects: baseObjects,
      expected_outcome: {
        compact_label: "Org-issued agent for Acme Support",
        decision: "allow-with-trust-indicator",
        resolved_trust_state: "org-issued-agent",
        warning_codes: [],
        error_count: 0,
        checks: {
          signature_valid: true,
          event_time_valid: true,
          current_time_valid: true,
          owner_binding_status: "bound",
          authority_scope_status: "in-scope",
          revocation_status: "clear",
          freshness_status: "fresh",
          replay_status: "clear"
        }
      }
    },
    "fixtures/demo/manifests/voice.issuer-untrusted.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_issuer_untrusted",
      scenario_id: "voice-issuer-untrusted",
      scenario_class: "delegated-agent-voice",
      description: "All signatures valid, but issuer is not trusted by verifier policy",
      lineage_group: "demo-voice-acme-01",
      verification_time: iso("2026-04-15T00:05:00Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300, trusted_issuer_ids: [] },
      objects: baseObjects,
      expected_outcome: {
        compact_label: "Signature valid, issuer not trusted",
        decision: "degraded-trust",
        resolved_trust_state: "unverified",
        warning_codes: ["issuer-untrusted"],
        error_count: 0,
        checks: {
          signature_valid: true,
          event_time_valid: false,
          current_time_valid: false,
          owner_binding_status: "bound",
          authority_scope_status: "in-scope",
          revocation_status: "clear",
          freshness_status: "fresh",
          replay_status: "clear"
        }
      }
    },
    "fixtures/demo/manifests/voice.delegation-revoked.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_delegation_revoked",
      scenario_id: "voice-delegation-revoked",
      scenario_class: "delegated-agent-voice",
      description: "Delegation revoked after the call",
      lineage_group: "demo-voice-acme-01",
      verification_time: iso("2026-04-15T00:15:00Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300, trusted_issuer_ids: ["dgd:identity:org_acme"] },
      objects: [...baseObjects, { role: "delegation_revocation", object_type: "dgd.revocation", path: "fixtures/demo/revocations/delegation.revoked.json", required: true, stable_across_lineage: false }],
      expected_outcome: {
        compact_label: "Delegation no longer active",
        decision: "allow-with-warning",
        resolved_trust_state: "org-issued-agent",
        warning_codes: ["delegation-expired-current-time", "revocation-stale"],
        error_count: 0,
        checks: {
          signature_valid: true,
          event_time_valid: true,
          current_time_valid: false,
          owner_binding_status: "bound",
          authority_scope_status: "in-scope",
          revocation_status: "revoked",
          freshness_status: "stale",
          replay_status: "clear"
        }
      }
    },
    "fixtures/demo/manifests/voice.revocation-stale.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_revocation_stale",
      scenario_id: "voice-revocation-stale",
      scenario_class: "delegated-agent-voice",
      description: "Revocation checks have gone stale",
      lineage_group: "demo-voice-acme-01",
      verification_time: iso("2026-04-15T00:12:30Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300, trusted_issuer_ids: ["dgd:identity:org_acme"] },
      objects: baseObjects,
      expected_outcome: {
        compact_label: "Verification stale, re-check recommended",
        decision: "allow-with-warning",
        resolved_trust_state: "org-issued-agent",
        warning_codes: ["revocation-stale"],
        error_count: 0,
        checks: {
          signature_valid: true,
          event_time_valid: true,
          current_time_valid: true,
          owner_binding_status: "bound",
          authority_scope_status: "in-scope",
          revocation_status: "stale",
          freshness_status: "stale",
          replay_status: "clear"
        }
      }
    },
    "fixtures/demo/manifests/voice.missing-delegation.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_missing_delegation",
      scenario_id: "voice-missing-delegation",
      scenario_class: "delegated-agent-voice",
      description: "Delegated envelope lineage without the delegation object",
      lineage_group: "demo-voice-acme-01",
      verification_time: iso("2026-04-15T00:05:00Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300, trusted_issuer_ids: ["dgd:identity:org_acme"] },
      objects: baseObjects.filter((entry) => entry.role !== "agent_delegation"),
      expected_outcome: {
        compact_label: "Signature valid, authority not proven",
        decision: "degraded-trust",
        resolved_trust_state: "verified-agent",
        warning_codes: ["authority-incomplete", "owner-binding-missing"],
        error_count: 0,
        checks: {
          signature_valid: true,
          event_time_valid: false,
          current_time_valid: false,
          owner_binding_status: "missing",
          authority_scope_status: "missing",
          revocation_status: "clear",
          freshness_status: "fresh",
          replay_status: "clear"
        }
      }
    },
    "fixtures/demo/manifests/voice.verified-human.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_verified_human",
      scenario_id: "voice-verified-human",
      scenario_class: "verified-human-voice",
      description: "Verified human direct voice call",
      lineage_group: "demo-voice-human-01",
      verification_time: iso("2026-04-15T00:05:00Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300, trusted_issuer_ids: ["dgd:identity:org_acme"] },
      objects: [
        { role: "organization_identity", object_type: "dgd.identity", path: "fixtures/demo/org.identity.json", required: true, stable_across_lineage: true },
        { role: "human_identity", object_type: "dgd.identity", path: "fixtures/demo/human.identity.json", required: true, stable_across_lineage: true },
        { role: "human_attestation", object_type: "dgd.attestation", path: "fixtures/demo/human.attestation.json", required: true, stable_across_lineage: true },
        { role: "communication_anchor", object_type: "dgd.communication", path: "fixtures/demo/human.communication.json", required: true, stable_across_lineage: true },
        { role: "session_object", object_type: "dgd.session", path: "fixtures/demo/human.session.json", required: true, stable_across_lineage: true },
        { role: "session_started_event", object_type: "dgd.event", path: "fixtures/demo/events/human.voice.session.started.json", required: true, stable_across_lineage: true },
        { role: "session_announcement_message", object_type: "dgd.message", path: "fixtures/demo/messages/human.voice.session.announcement.json", required: true, stable_across_lineage: true }
      ],
      expected_outcome: {
        compact_label: "Verified human",
        decision: "allow-with-trust-indicator",
        resolved_trust_state: "verified-human",
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
    },
    "fixtures/demo/manifests/voice.unverified-sender.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_unverified_sender",
      scenario_id: "voice-unverified-sender",
      scenario_class: "unverified-voice",
      description: "Self-asserted sender comparison scenario",
      lineage_group: "demo-voice-unverified-01",
      verification_time: iso("2026-04-15T00:05:00Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300 },
      objects: [
        { role: "unverified_identity", object_type: "dgd.identity", path: "fixtures/demo/unverified.identity.json", required: true, stable_across_lineage: true },
        { role: "communication_anchor", object_type: "dgd.communication", path: "fixtures/demo/unverified.communication.json", required: true, stable_across_lineage: true },
        { role: "session_object", object_type: "dgd.session", path: "fixtures/demo/unverified.session.json", required: true, stable_across_lineage: true },
        { role: "session_started_event", object_type: "dgd.event", path: "fixtures/demo/events/unverified.voice.session.started.json", required: true, stable_across_lineage: true },
        { role: "session_announcement_message", object_type: "dgd.message", path: "fixtures/demo/messages/unverified.voice.session.announcement.json", required: true, stable_across_lineage: true }
      ],
      expected_outcome: {
        compact_label: "Unverified sender",
        decision: "degraded-trust",
        resolved_trust_state: "unverified",
        warning_codes: ["revocation-unknown"],
        error_count: 0,
        checks: {
          signature_valid: true,
          event_time_valid: false,
          current_time_valid: false,
          owner_binding_status: "not-required",
          authority_scope_status: "not-required",
          revocation_status: "unknown",
          freshness_status: "unknown",
          replay_status: "clear"
        }
      }
    },
    "fixtures/demo/manifests/voice.owner-binding-mismatch.manifest.json": {
      manifest_type: "dgd.fixture_manifest",
      schema_version: "0.3",
      manifest_id: "dgd:manifest:voice_owner_binding_mismatch",
      scenario_id: "voice-owner-binding-mismatch",
      scenario_class: "delegated-agent-voice",
      description: "Valid delegated voice lineage where the acting operator and delegation issuer do not match the agent's verified owner",
      lineage_group: "demo-voice-owner-binding-01",
      verification_time: iso("2026-04-15T00:25:00Z"),
      verification_defaults: { mode: "dual", revocation_max_age_seconds: 300, trusted_issuer_ids: ["dgd:identity:org_acme_owner_binding"] },
      objects: [
        { role: "owner_identity", object_type: "dgd.identity", path: "fixtures/demo/owner-binding/owner.identity.json", required: true, stable_across_lineage: true },
        { role: "rogue_operator_identity", object_type: "dgd.identity", path: "fixtures/demo/owner-binding/rogue-org.identity.json", required: true, stable_across_lineage: true },
        { role: "agent_identity", object_type: "dgd.identity", path: "fixtures/demo/owner-binding/agent.identity.json", required: true, stable_across_lineage: true },
        { role: "agent_attestation", object_type: "dgd.attestation", path: "fixtures/demo/owner-binding/agent.attestation.json", required: true, stable_across_lineage: true },
        { role: "agent_delegation", object_type: "dgd.delegation", path: "fixtures/demo/owner-binding/agent.delegation.json", required: true, stable_across_lineage: true },
        { role: "communication_anchor", object_type: "dgd.communication", path: "fixtures/demo/owner-binding/voice.communication.json", required: true, stable_across_lineage: true },
        { role: "session_object", object_type: "dgd.session", path: "fixtures/demo/owner-binding/voice.session.json", required: true, stable_across_lineage: true },
        { role: "session_started_event", object_type: "dgd.event", path: "fixtures/demo/owner-binding/events/voice.session.started.json", required: true, stable_across_lineage: true },
        { role: "session_announcement_message", object_type: "dgd.message", path: "fixtures/demo/owner-binding/messages/voice.session.announcement.json", required: true, stable_across_lineage: true }
      ],
      expected_outcome: {
        compact_label: "Agent signature not bound to verified owner",
        decision: "degraded-trust",
        resolved_trust_state: "verified-agent",
        warning_codes: ["owner-binding-missing"],
        error_count: 0,
        checks: {
          signature_valid: true,
          event_time_valid: false,
          current_time_valid: false,
          owner_binding_status: "missing",
          authority_scope_status: "in-scope",
          revocation_status: "clear",
          freshness_status: "fresh",
          replay_status: "clear"
        }
      }
    }
  };
}

async function main() {
  await ensureDirectories();
  const keys = buildKeys();
  const files = {
    ...buildDelegatedVoiceFixtures(keys),
    ...buildDirectHumanFixtures(keys),
    ...buildUnverifiedFixtures(keys),
    ...buildOwnerBindingMismatchFixtures(keys),
    ...buildManifests()
  };

  await Promise.all(Object.entries(files).map(([relativePath, value]) => writeJson(relativePath, value)));
}

main().catch((error) => {
  console.error(error.stack);
  process.exit(1);
});
