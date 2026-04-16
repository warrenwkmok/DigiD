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
- payload metadata that supports detached-content verification
- a proof block

For v0.3:
- envelopes MUST include explicit signer fields (`sender_id` or `actor_id`)
- envelopes MAY include `critical_extensions`
- verifiers MUST reject unsupported critical extensions
- envelopes tied to live communications SHOULD include enough context for event-time and current-time verification
- signer identity and `proof.kid` MUST resolve to the same active identity record

## Envelope field requirements

| Field | Applies to | Required | Notes |
| --- | --- | --- | --- |
| `envelope_type` | all | yes | `dgd.message` or `dgd.event` |
| `schema_version` | all | yes | Current draft: `0.3` |
| `envelope_id` | all | yes | Stable unique identifier |
| `subject_id` | all | yes | Communication, session, artifact, or trust object being described |
| `sender_id` | message | yes | Message signer identity |
| `actor_id` | event | yes | Event signer identity |
| `operator_id` | all | no | Required when authority is being exercised for another party |
| `delegation_id` | all | no | Required when delegated authority is claimed |
| `created_at` | all | yes | Envelope creation time |
| `verification_context` | all | yes | Verification mode and freshness posture |
| `payload` | all | yes | Minimal payload or payload descriptor |
| `payload_digest` | event | yes | Digest over canonical event payload bytes |
| `proof` | all | yes | Signature proof block |

## Envelope binding profile

For the first implementation profile:
- every live-session envelope MUST reference the same `dgd.communication` anchor in `subject_id`, or explicitly reference an artifact derived from that communication
- `conversation_id` SHOULD carry the session lineage id used across messages and events
- signer identity fields, `operator_id`, and `delegation_id` are trust-bearing fields and therefore MUST be inside the signed envelope body
- any receiver-visible summary such as trust-banner copy SHOULD either be signed directly in `payload.summary` or deterministically derived from signed fields
- event payloads MUST be canonicalized before digesting so independent verifiers can reproduce `payload_digest`

## Verification context profile

```json
{
  "verification_mode": "dual",
  "revocation_max_age_seconds": 300,
  "historical_policy": "allow-if-valid-at-sign-time"
}
```

Notes:
- `verification_mode` should be one of `event_time`, `current_time`, or `dual`
- `historical_policy` is optional for v0.3 but helps explain why a mathematically valid old signature may still downgrade today
- live voice or video flows SHOULD default to `dual`

## 1. Base message envelope

Use this for signed payload-bearing communications across messaging, email, voice session manifests, video manifests, and documents.

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.3",
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
  "schema_version": "0.3",
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

## Message and event binding rules

To keep envelopes meaningful instead of merely signed blobs:
- `subject_id` MUST reference a concrete DigiD object, session, or artifact record
- if `operator_id` is present and differs from the signer, `delegation_id` MUST be present unless the issuer is authoring the envelope directly
- if `delegation_id` is present, the payload SHOULD carry a purpose or action hint that the verifier can compare against delegation scope
- event and message envelopes for the same live session SHOULD share the same session or conversation id lineage
- a verifier SHOULD reject a live-session envelope that references a delegation lineage inconsistent with the bound `dgd.communication` object
- the first demo profile SHOULD require `voice.session.started` and `voice.session.announcement` to reference the same `subject_id` and `conversation_id`

## Core message types for the first prototype

### Voice session announcement message

Signed object that a verifier UI can render at call start.

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.3",
  "envelope_id": "dgd:envelope:msg_voice_start_01J...",
  "message_type": "voice.session.announcement",
  "subject_id": "dgd:communication:01JCOMM...",
  "channel": "voice",
  "sender_id": "dgd:identity:agent_01JABC...",
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "conversation_id": "dgd:session:voice_01JSESSION...",
  "created_at": "2026-04-15T00:00:10Z",
  "verification_context": {
    "verification_mode": "dual",
    "revocation_max_age_seconds": 300
  },
  "payload": {
    "content_type": "application/dgd+json",
    "content_digest": "sha256:...",
    "content_length": 902,
    "summary": "Verified agent for Acme Support",
    "purpose": "support-follow-up"
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
  "schema_version": "0.3",
  "envelope_id": "dgd:envelope:msg_recording_01J...",
  "message_type": "voice.recording.manifest",
  "subject_id": "dgd:artifact:recording_01J...",
  "channel": "voice",
  "sender_id": "dgd:identity:agent_01JABC...",
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "conversation_id": "dgd:session:voice_01JSESSION...",
  "created_at": "2026-04-15T00:10:00Z",
  "verification_context": {
    "verification_mode": "dual",
    "revocation_max_age_seconds": 300
  },
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
  "schema_version": "0.3",
  "envelope_id": "dgd:envelope:msg_chat_01J...",
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

### Email message

```json
{
  "envelope_type": "dgd.message",
  "schema_version": "0.3",
  "envelope_id": "dgd:envelope:msg_mail_01J...",
  "message_type": "email.message",
  "subject_id": "dgd:communication:mail_01J...",
  "channel": "email",
  "sender_id": "dgd:identity:agent_01J...",
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "conversation_id": "mail-thread-01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "verification_context": {
    "verification_mode": "current_time",
    "revocation_max_age_seconds": 3600
  },
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
Required payload keys for the fixture profile:
- `issued_object_id`
- `identity_class`
- `verification_state`

### `attestation.issued`
Created when an issuer signs an attestation.
Required payload keys:
- `issued_object_id`
- `attestation_type`
- `subject_id`

### `delegation.issued`
Created when an issuer signs a delegation.
Required payload keys:
- `issued_object_id`
- `delegate_id`
- `channels`
- `actions`
- `purpose_bindings`

### `voice.session.started`
Created when an outbound or inbound voice session is initiated.
Required payload keys:
- `purpose`
- `direction`
- `channel_subtype`

### `voice.session.ended`
Created when the live session finishes.
Required payload keys:
- `reason`
- `duration_ms`

### `artifact.recorded`
Created when a recording, transcript, or summary manifest is generated.
Required payload keys:
- `artifact_id`
- `artifact_type`
- `content_digest`

### `verification.performed`
Created when a verifier resolves trust state for a subject.
Required payload keys:
- `decision`
- `resolved_trust_state`
- `verification_mode`
- `revocation_status`

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
6. `voice.session.announcement` message for the trust banner payload
7. `verification.performed` by the receiver-side verifier
8. optional `artifact.recorded`
9. `voice.session.ended`

## Envelope invariants

### Message invariants
- `message_type` MUST be compatible with `channel`
- `payload.content_digest` MUST be present when content is detached
- `verification_context` MUST be present
- if `operator_id` is present and differs from `sender_id`, `delegation_id` MUST be present unless the message type is issuer-authored
- `voice.session.announcement` SHOULD reference the same communication object later summarized by `verification.performed`

### Event invariants
- `sequence` MUST increase monotonically within the same session or stream
- `voice.session.started` SHOULD be the first ordered event in a voice session stream
- `verification.performed` SHOULD record whether the result reflects `event_time`, `current_time`, or `dual` evaluation
- revocation events SHOULD identify the revoked object in payload fields even when `subject_id` is the broader session or communication object

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
  "sequence": 3,
  "verification_context": {
    "verification_mode": "dual",
    "revocation_max_age_seconds": 300
  },
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

## Demo envelope mapping

| Demo step | Envelope | Required signer | Required linked ids | Key verifier checks |
| --- | --- | --- | --- | --- |
| call start | `voice.session.started` | agent key | `subject_id`, `operator_id`, `delegation_id` | signer active, delegation in scope, purpose allowed |
| trust banner | `voice.session.announcement` | agent key | `subject_id`, `conversation_id`, `delegation_id` | same signer lineage as start event |
| verifier output | `verification.performed` | verifier key or local unsigned result | `subject_id` | decision matches checks and evaluation mode |
| post-call artifact | `artifact.recorded` or recording manifest | agent or service key | artifact id, conversation id | payload digest integrity |

## Verification rules for envelopes

A reference verifier should:
1. validate envelope shape by `envelope_type`
2. verify the `proof` against the signing key
3. resolve the signer identity and ensure it is active
4. if `delegation_id` exists, verify authority for the channel and action
5. ensure `message_type` or `event_type` is consistent with the channel
6. resolve the referenced `dgd.communication` object when the envelope participates in a live session flow
7. evaluate revocation freshness against the envelope's verification context or verifier defaults
8. surface downgrade warnings for valid signatures paired with expired, revoked, stale, or unknown trust objects

## Implementation note for digest reproducibility

The first signing library should expose two deterministic helpers:
1. canonicalize-and-sign for the full envelope with `proof` removed
2. canonicalize-and-digest for event `payload` bytes before filling `payload_digest`

That keeps message verification and event verification reproducible with the same canonicalization rules.

## Serialization guidance

For v0.3, keep transport simple:
- primary wire format: JSON
- canonical signing form: JCS
- binary payloads should be referenced by digest, not inlined
- host platforms can carry the envelope as metadata, attachment, header, QR payload, or verifier URL param

## Implementation note

The first code slice should treat `dgd.message` and `dgd.event` as two discriminated unions in a signing library. That will keep the prototype small while leaving room for channel-specific adapters later.
