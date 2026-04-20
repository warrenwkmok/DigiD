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

For the first delegated live profile, envelopes should be thought of as carrying three signed contracts at once:
- authority lineage, who is speaking and under whose authority
- session lineage, which ordered interaction scope this belongs to
- payload binding, what bytes or structured payload the signature actually covers

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
| `conversation_id` | all live-session envelopes | yes | Stable lineage scope for ordered session envelopes |
| `created_at` | all | yes | Envelope creation time |
| `purpose` | delegated live message and event envelopes | yes | MUST match the bound communication object when delegated authority is claimed |
| `verification_context` | all | yes | Verification mode and freshness posture |
| `payload` | all | yes | Minimal payload or payload descriptor |
| `payload_digest` | event | yes | Digest over canonical event payload bytes |
| `sequence` | event | ordered live-session events yes | Monotonic within `conversation_id`; optional outside ordered scopes |
| `proof` | all | yes | Signature proof block |

## Envelope binding profile

For the first implementation profile:
- every live-session envelope MUST reference the same `dgd.communication` anchor in `subject_id`, or explicitly reference an artifact derived from that communication
- `conversation_id` SHOULD carry the signed `dgd.session.object_id` used across messages and events
- signer identity fields, `operator_id`, and `delegation_id` are trust-bearing fields and therefore MUST be inside the signed envelope body
- any receiver-visible summary such as trust-banner copy SHOULD either be signed directly in `payload.summary` or deterministically derived from signed fields
- event payloads MUST be canonicalized before digesting so independent verifiers can reproduce `payload_digest`
- envelopes in the first delegated live profile MUST inherit signer lineage, operator lineage, delegation lineage, conversation lineage, and purpose lineage from the bound `dgd.communication` object unless a future profile explicitly defines signed rotation or transfer semantics
- a verifier SHOULD resolve the signed `dgd.session` object before accepting live-session sequence order, duplicate detection scope, or artifact lineage tied to `conversation_id`

## Signed versus referenced field contract

The first verifier slice should treat envelope fields in three buckets.

### Bucket 1, must be signed directly in the envelope
- `sender_id` or `actor_id`
- `operator_id`
- `delegation_id`
- `conversation_id`
- `created_at`
- top-level `purpose` for delegated live envelopes
- `verification_context`
- `payload.summary` when shown directly to users
- payload fields used to compare channel, purpose, sequence, or authority scope

### Bucket 2, may be represented by digest or signed descriptor
- detached content bytes for message bodies, recordings, transcripts, and artifacts
- large structured payloads that are too bulky to inline, provided the envelope signs a stable digest, content type, and length
- event payload objects, where the envelope signs `payload_digest` over the canonical payload bytes
- message payload descriptors for detached trust banners, transcripts, or manifests, where the envelope signs `payload.content_digest`, `payload.content_length`, and any directly rendered summary fields

### Bucket 3, must stay out of trust claims unless separately signed
- adapter delivery ids
- local retry state
- transport hop metadata
- unsigned UI embellishments or explanatory copy

A verifier MUST NOT present bucket 3 fields as proven by DigiD. If rendered at all, they should be visually secondary and explicitly advisory.

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
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
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
  "conversation_id": "dgd:session:voice_01JSESSION...",
  "purpose": "support-follow-up",
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
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
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
- if `delegation_id` is present, the envelope MUST carry a top-level `purpose` that the verifier can compare against delegation scope
- every live-session message or event MUST include `conversation_id`
- event and message envelopes for the same live session MUST share the same session or conversation id lineage
- a verifier SHOULD reject a live-session envelope that references a delegation lineage inconsistent with the bound `dgd.communication` object
- the first demo profile SHOULD require `voice.session.started` and `voice.session.announcement` to reference the same `subject_id` and `conversation_id`
- a verifier SHOULD reject a live-session envelope whose `conversation_id` cannot be resolved to one signed `dgd.session` object in scope
- a live-session envelope that changes `sender_id`, `operator_id`, or `delegation_id` within the same `conversation_id` MUST be treated as lineage-conflicting unless an explicit signed rotation event profile is defined
- `voice.session.started` and `voice.session.announcement` in the first live delegated profile MUST also agree on `purpose`, unless the announcement payload explicitly narrows the purpose text without changing its delegation meaning
- if `subject_id` references a derived artifact instead of the communication anchor, the envelope MUST still carry a `conversation_id` and lineage that resolves back to one active `dgd.communication` object in scope
- if `subject_id` references a `dgd.artifact`, the artifact `session_id` and `communication_id` MUST agree with the envelope lineage
- for ordered live-session events, `sequence` MUST start at `1` for the first signed event in a fixture stream and increase by exactly `1` thereafter unless a future gap-tolerant profile explicitly says otherwise
- the first implementation profile MUST treat duplicate `sequence` values within the same `conversation_id` as replay-suspected, even when signed bytes differ
- message envelopes in the first live delegated voice profile SHOULD remain non-sequenced and instead bind to the nearest preceding signed event plus the shared `conversation_id`, so adapters do not quietly create two competing ordered streams

## Core message types for the first prototype

### Voice session announcement message

Signed object that a verifier UI can render at call start.
In the first delegated voice profile this message is intentionally not sequence-bearing. It binds to the same `conversation_id` and communication lineage as `voice.session.started`, and the verifier should treat it as the trust-banner payload for that session state rather than as a separate ordered event.

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
  "purpose": "support-follow-up",
  "verification_context": {
    "verification_mode": "dual",
    "revocation_max_age_seconds": 300
  },
  "payload": {
    "content_type": "application/dgd+json",
    "content_digest": "sha256:...",
    "content_length": 902,
    "summary": "Org-issued agent for Acme Support",
    "purpose": "support-follow-up"
  },
  "proof": {
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
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
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
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
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
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
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
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

## Event payload schema profile

The first implementation should normalize event payloads as typed JSON objects instead of prose-only descriptions.
Unless an event type says otherwise:
- payloads MUST include only the listed fields plus optional non-critical extensions
- ids in payloads MUST match the ids referenced elsewhere in the same envelope
- fields that duplicate top-level trust-bearing ids are allowed only when they make downstream rendering or auditing deterministic

| Event type | Required payload fields | Optional payload fields | Notes |
| --- | --- | --- | --- |
| `identity.issued` | `issued_object_id`, `identity_class`, `verification_state` | `controller_id` | `issued_object_id` SHOULD equal the identity object id in scope |
| `attestation.issued` | `issued_object_id`, `attestation_type`, `subject_id` | `verification_state`, `valid_until` | `subject_id` MUST match the attested subject |
| `delegation.issued` | `issued_object_id`, `delegate_id`, `channels`, `actions`, `purpose_bindings` | `valid_until`, `restrictions` | `channels` and `actions` MUST mirror the delegation object used for trust evaluation |
| `voice.session.started` | `direction`, `channel_subtype` | `session_started_at`, `announcement_expected` | delegated live envelopes now carry canonical `purpose` at the top level rather than only in payload |
| `voice.session.ended` | `reason`, `duration_ms` | `session_ended_at` | `duration_ms` SHOULD agree with communication timestamps when both exist |
| `artifact.recorded` | `artifact_id`, `artifact_type`, `content_digest` | `content_length`, `codec`, `duration_ms` | `artifact_id` SHOULD resolve to the recorded artifact or manifest object |
| `verification.performed` | `decision`, `resolved_trust_state`, `verification_mode`, `revocation_status`, `warning_codes` | `freshness_status`, `replay_status` | This event records verifier output, not signer authority |
| `key.revoked` | `revoked_kid`, `reason_code`, `revoked_at` | `replacement_kid` | For verifier-grade revocation, prefer a signed `dgd.revocation` targeting `dgd.signing_key` with `target_object_id = revoked_kid` |
| `attestation.revoked` | `revoked_object_id`, `reason_code`, `revoked_at` | `subject_id` | `revoked_object_id` MUST resolve to a `dgd.attestation` |
| `delegation.revoked` | `revoked_object_id`, `reason_code`, `revoked_at` | `delegate_id` | `revoked_object_id` MUST resolve to a `dgd.delegation` |

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
- `conversation_id` MUST be the primary ordered-event scope for live-session events in v0.3
- `voice.session.started` SHOULD be the first ordered event in a voice session stream
- delegated live events and messages MUST keep `purpose` identical to the bound communication object unless a later signed narrowing profile explicitly permits a more specific child purpose
- `verification.performed` SHOULD record whether the result reflects `event_time`, `current_time`, or `dual` evaluation
- revocation events SHOULD identify the revoked object in payload fields even when `subject_id` is the broader session or communication object
- payload fields that restate signer, operator, or delegation lineage MUST exactly match the top-level envelope ids when included
- for the first fixture-driven implementation, ordered event streams MUST be contiguous within one manifest scenario so replay and regression tests are deterministic without transport-specific gap recovery rules

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
    "resolved_trust_state": "org-issued-agent",
    "verification_mode": "dual",
    "revocation_status": "stale",
    "warning_codes": ["revocation-stale"]
  },
  "payload_digest": "sha256:...",
  "proof": {
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
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
| call start | `voice.session.started` | agent key | `subject_id`, `operator_id`, `delegation_id`, `conversation_id` | signer active, delegation in scope, session lineage resolved, purpose allowed |
| trust banner | `voice.session.announcement` | agent key | `subject_id`, `conversation_id`, `delegation_id` | same signer and session lineage as start event |
| verifier output | `verification.performed` | verifier key or local unsigned result | `subject_id`, `conversation_id` | decision matches checks and evaluation mode |
| post-call artifact | `artifact.recorded` or recording manifest | agent or service key | artifact id, conversation id | artifact lineage matches session and communication |

## Warning and reason code profile

To keep verifier output portable across adapters, the first profile should normalize a small machine-readable warning and reason-code set.

### Warning codes
- `revocation-stale`
- `revocation-unknown`
- `delegation-expired-current-time`
- `key-expired-current-time`
- `lineage-conflict`
- `replay-suspected`
- `issuer-untrusted`
- `authority-incomplete`
- `owner-binding-missing`
- `delegation-scope-conflict`
- `platform-identity-mismatch`
- `artifact-context-missing`

### Reason codes for session end or revocation-adjacent events
- `completed`
- `caller-ended`
- `receiver-ended`
- `network-failure`
- `policy-blocked`
- `authorization-ended`
- `superseded`

Rules:
- verifier-produced `warning_codes` MUST use stable slugs from this list unless declared as non-critical extensions
- user-facing warning copy MAY vary by adapter, but SHOULD map back to these stable codes
- when `warning_codes` includes `delegation-scope-conflict`, user-facing copy SHOULD preserve the primary failed scope dimension (`purpose`, `channel`, or required action) when the verifier can determine it cleanly from signed inputs
- event payload `reason` fields SHOULD use the reason-code profile instead of free text when an exact code exists

## Verification rules for envelopes

A reference verifier should:
1. validate envelope shape by `envelope_type`
2. verify the `proof` against the signing key
3. resolve the signer identity and ensure it is active
4. if `delegation_id` exists, verify authority for the channel and action
5. ensure `message_type` or `event_type` is consistent with the channel
6. resolve the referenced `dgd.communication` object when the envelope participates in a live session flow
7. resolve the referenced `dgd.session` object for conversation scope, sequence checks, and artifact lineage
8. compare envelope signer, operator, delegation, conversation, and purpose lineage against the bound communication and session objects
9. evaluate revocation freshness against the envelope's verification context or verifier defaults
10. surface downgrade warnings for valid signatures paired with expired, revoked, stale, or unknown trust objects

## Implementation note for digest reproducibility

The first signing library should expose two deterministic helpers:
1. canonicalize-and-sign for the full envelope with `proof` removed
2. canonicalize-and-digest for event `payload` bytes before filling `payload_digest`

That keeps message verification and event verification reproducible with the same canonicalization rules.

For the first implementation profile:
- `payload_digest` for `dgd.event` MUST be computed over the JCS-canonicalized JSON bytes of the `payload` object only
- `payload.content_digest` for detached message or artifact content MUST be computed over the raw detached content bytes, not over the enclosing envelope JSON
- if a message includes user-visible fields such as `summary` or `purpose` that a verifier UI renders directly, those fields MUST live inside the signed `payload` object, not in unsigned side metadata
- a verifier SHOULD treat any unsigned UI-facing detached metadata as advisory only, never trust-bearing

## Fixture-manifest integration note

When envelopes are consumed through a fixture manifest:
- the manifest order defines dependency resolution order
- `voice.session.started` and `voice.session.announcement` SHOULD each declare the same lineage through `subject_id`, `conversation_id`, `sender_id`, `operator_id`, and `delegation_id`
- duplicate `envelope_id` values with non-identical signed bytes MUST be treated as invalid
- duplicate `sequence` values in the same declared scope SHOULD be treated as replay-suspicious under the verifier policy profile
- manifest scenarios for the first ordered live-session slice SHOULD declare one contiguous event stream per `conversation_id`, plus any non-sequenced trust-banner messages that bind to it

See `docs/protocol/fixture-manifest-profile.md` and `docs/architecture/verifier-policy-profile.md`.

## Serialization guidance

For v0.3, keep transport simple:
- primary wire format: JSON
- canonical signing form: JCS
- binary payloads should be referenced by digest, not inlined
- host platforms can carry the envelope as metadata, attachment, header, QR payload, or verifier URL param

## Implementation note

The first code slice should treat `dgd.message` and `dgd.event` as two discriminated unions in a signing library. That will keep the prototype small while leaving room for channel-specific adapters later.

The event side should also expose a typed payload registry keyed by `event_type`, so fixtures and verifiers share one machine-readable payload contract instead of re-encoding required fields in multiple places.
