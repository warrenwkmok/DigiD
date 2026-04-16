# DigiD signed message and event formats v0.3

This document defines the first portable envelope model for DigiD.

## Why split messages from events

DigiD needs two adjacent but distinct signed shapes:
- **message envelopes** for user-visible communications or media artifacts
- **event envelopes** for lifecycle events that help verifiers reconstruct what happened

A message says, "this communication object exists."
An event says, "this protocol-relevant step happened."

## Shared envelope rules

All envelopes should include:
- a stable type name
- a schema version
- an envelope id
- a subject id for the thing being described
- a sender or actor id
- a created timestamp
- a payload digest or embedded minimal payload
- a proof block

For v0.3:
- envelopes SHOULD include explicit signer fields (`sender_id` or `actor_id`)
- envelopes MAY include `critical_extensions`
- verifiers MUST reject unsupported critical extensions
- envelopes tied to live communications SHOULD include enough context for event-time and current-time verification

## 1. Base message envelope

Use this for signed payload-bearing communications across messaging, email, voice session manifests, video manifests, and documents.

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.2",
  "envelope_id": "dgd:envelope:msg_01J...",
  "message_type": "messaging.text",
  "subject_id": "dgd:communication:chat_01J...",
  "channel": "messaging",
  "sender_id": "dgd:identity:human_01J...",
  "operator_id": null,
  "delegation_id": null,
  "conversation_id": "thread_01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "verification_context": {
    "verification_mode": "current_time",
    "revocation_max_age_seconds": 3600
  },
  "payload": {
    "content_type": "text/plain",
    "content_digest": "sha256:...",
    "content_length": 124,
    "encoding": "utf-8"
  },
  "proof": {
    "type": "ed25519-2020",
    "kid": "dgd:key:human_01:key-2026-04",
    "created_at": "2026-04-15T00:00:00Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

## 2. Base event envelope

Use this for protocol lifecycle events and verification-audit events.

```json
{
  "envelope_type": "dgd.event",
  "schema_version": "0.2",
  "envelope_id": "dgd:envelope:event_01J...",
  "event_type": "voice.session.started",
  "subject_id": "dgd:session:voice_01JSESSION...",
  "actor_id": "dgd:identity:agent_01JABC...",
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "created_at": "2026-04-15T00:00:10Z",
  "sequence": 1,
  "verification_context": {
    "verification_mode": "dual",
    "revocation_max_age_seconds": 300
  },
  "payload": {
    "purpose": "support-follow-up",
    "direction": "outbound"
  },
  "payload_digest": "sha256:...",
  "proof": {
    "type": "ed25519-2020",
    "kid": "dgd:key:agent_01:key-2026-04",
    "created_at": "2026-04-15T00:00:10Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

## Core message types for the first prototype

### Voice session announcement message

Signed object that a verifier UI can render at call start.

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.2",
  "envelope_id": "dgd:envelope:msg_voice_start_01J...",
  "message_type": "voice.session.announcement",
  "subject_id": "dgd:communication:01JCOMM...",
  "channel": "voice",
  "sender_id": "dgd:identity:agent_01JABC...",
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "conversation_id": "dgd:session:voice_01JSESSION...",
  "created_at": "2026-04-15T00:00:10Z",
  "payload": {
    "content_type": "application/dgd+json",
    "content_digest": "sha256:...",
    "content_length": 902,
    "summary": "Verified agent for Acme Support"
  },
  "proof": {
    "type": "ed25519-2020",
    "kid": "dgd:key:agent_01:key-2026-04",
    "created_at": "2026-04-15T00:00:10Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

### Voice recording manifest message

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.2",
  "envelope_id": "dgd:envelope:msg_recording_01J...",
  "message_type": "voice.recording.manifest",
  "subject_id": "dgd:artifact:recording_01J...",
  "channel": "voice",
  "sender_id": "dgd:identity:agent_01JABC...",
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "conversation_id": "dgd:session:voice_01JSESSION...",
  "created_at": "2026-04-15T00:10:00Z",
  "payload": {
    "content_type": "audio/opus",
    "content_digest": "sha256:...",
    "content_length": 483210,
    "codec": "opus",
    "duration_ms": 48321
  },
  "proof": {
    "type": "ed25519-2020",
    "kid": "dgd:key:agent_01:key-2026-04",
    "created_at": "2026-04-15T00:10:00Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

### Messaging text message

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.2",
  "envelope_id": "dgd:envelope:msg_chat_01J...",
  "message_type": "messaging.text",
  "subject_id": "dgd:communication:chat_01J...",
  "channel": "messaging",
  "sender_id": "dgd:identity:human_01J...",
  "operator_id": null,
  "delegation_id": null,
  "conversation_id": "thread_01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "payload": {
    "content_type": "text/plain",
    "content_digest": "sha256:...",
    "content_length": 124,
    "encoding": "utf-8"
  },
  "proof": {
    "type": "ed25519-2020",
    "kid": "dgd:key:human_01:key-2026-04",
    "created_at": "2026-04-15T00:00:00Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

### Email message

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.2",
  "envelope_id": "dgd:envelope:msg_mail_01J...",
  "message_type": "email.message",
  "subject_id": "dgd:communication:mail_01J...",
  "channel": "email",
  "sender_id": "dgd:identity:agent_01J...",
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "conversation_id": "mail-thread-01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "payload": {
    "content_type": "message/rfc822",
    "content_digest": "sha256:...",
    "content_length": 4120,
    "subject_digest": "sha256:..."
  },
  "proof": {
    "type": "ed25519-2020",
    "kid": "dgd:key:agent_01:key-2026-04",
    "created_at": "2026-04-15T00:00:00Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

## Core event types for the first prototype

These events are enough to power the first verified agent-human demo flow.

### `identity.issued`
Created when an identity record becomes active.

### `attestation.issued`
Created when an issuer signs an attestation.

### `delegation.issued`
Created when an issuer signs a delegation.

### `voice.session.started`
Created when an outbound or inbound voice session is initiated.

### `voice.session.ended`
Created when the live session finishes.

### `artifact.recorded`
Created when a recording, transcript, or summary manifest is generated.

### `verification.performed`
Created when a verifier resolves trust state for a subject.

### `key.revoked`
Created when a signing key becomes invalid before its scheduled expiry.

### `attestation.revoked`
Created when an attestation can no longer support trust resolution.

### `delegation.revoked`
Created when a delegation is no longer valid.

## First demo event sequence

1. `identity.issued` for organization
2. `identity.issued` for agent
3. `attestation.issued` binding org to agent identity state
4. `delegation.issued` granting communication authority
5. `voice.session.started` for the outbound call
6. `verification.performed` by the receiver-side verifier
7. optional `artifact.recorded`
8. `voice.session.ended`

## Envelope invariants

### Message invariants
- `message_type` MUST be compatible with `channel`
- `payload.content_digest` MUST be present when content is detached
- if `operator_id` is present and differs from `sender_id`, `delegation_id` SHOULD be present unless the message type is issuer-authored

### Event invariants
- `sequence` MUST increase monotonically within the same session or stream
- `voice.session.started` SHOULD be the first ordered event in a voice session stream
- `verification.performed` SHOULD record whether the result reflects `event_time`, `current_time`, or `dual` evaluation

## Signed verification event example

```json
{
  "envelope_type": "dgd.event",
  "schema_version": "0.3",
  "envelope_id": "dgd:envelope:event_verify_01J...",
  "event_type": "verification.performed",
  "subject_id": "dgd:communication:01JCOMM...",
  "actor_id": "dgd:identity:verifier_service_01J...",
  "created_at": "2026-04-15T00:05:00Z",
  "payload": {
    "decision": "allow-with-warning",
    "resolved_trust_state": "delegated-agent",
    "verification_mode": "dual",
    "revocation_status": "stale"
  },
  "payload_digest": "sha256:...",
  "proof": {
    "type": "ed25519-2020",
    "kid": "dgd:key:verifier_service:key-2026-04",
    "created_at": "2026-04-15T00:05:00Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

## Verification rules for envelopes

A reference verifier should:
1. validate envelope shape by `envelope_type`
2. verify the `proof` against the signing key
3. resolve the signer identity and ensure it is active
4. if `delegation_id` exists, verify authority for the channel and action
5. ensure `message_type` or `event_type` is consistent with the channel
6. evaluate revocation freshness against the envelope's verification context or verifier defaults
7. surface downgrade warnings for valid signatures paired with expired, revoked, stale, or unknown trust objects

## Serialization guidance

For v0.2, keep transport simple:
- primary wire format: JSON
- canonical signing form: JCS
- binary payloads should be referenced by digest, not inlined
- host platforms can carry the envelope as metadata, attachment, header, QR payload, or verifier URL param

## Implementation note

The first code slice should treat `dgd.message` and `dgd.event` as two discriminated unions in a signing library. That will keep the prototype small while leaving room for channel-specific adapters later.
