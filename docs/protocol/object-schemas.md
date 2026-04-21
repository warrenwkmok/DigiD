# DigiD object schemas v0.3

This document tightens the first protocol draft into a more implementation-ready object model.
It should be read together with `docs/protocol/normative-protocol-draft.md`, which defines required vs optional behavior and verifier resolution order.

## Design goals

The first schema layer should be:
- signable with a deterministic canonical form
- strict enough for verifier implementation
- portable across channels
- explicit about delegation and lifecycle state
- compact enough to fit into envelopes, manifests, and APIs

## Common object rules

Every DigiD object shares these fields.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `object_type` | string | yes | Stable namespaced type like `dgd.identity` |
| `schema_version` | string | yes | Current draft: `0.3` |
| `object_id` | string | yes | Global DigiD identifier |
| `created_at` | RFC3339 UTC string | yes | Creation time |
| `updated_at` | RFC3339 UTC string | no | Last mutation time for mutable records |
| `issuer_id` | string | sometimes | Required when an issuer distinct from the subject creates the object |
| `status` | string | yes | Lifecycle state specific to object family |
| `critical_extensions` | string[] | no | Unknown listed values must cause rejection |
| `evidence` | object | no | Optional references to off-chain or off-protocol evidence |
| `proof` | object | no | Signature proof block when the object is signed |

### Common object invariants

For v0.3, every signed DigiD object should also follow these rules:
- top-level identifiers MUST be stable and immutable after issuance
- mutable operational state should be represented by a new signed object or explicit revocation, not silent in-place edits
- any field rendered to a receiver as trust-relevant should either be signed directly or derived from signed fields
- unknown top-level fields are allowed unless listed in `critical_extensions`
- if `proof` exists, the object MUST be verifiable without fetching unsigned side metadata

### Common identifier conventions

For the first implementation profile:
- `object_id` SHOULD use a family-scoped prefix like `dgd:identity:` or `dgd:delegation:`
- referenced ids MUST be exact strings, not inferred aliases
- ids MUST be immutable after issuance
- a verifier MUST treat unknown referenced ids as trust-incomplete, not silently absent

## Enumerations

### Identity classes
- `human`
- `agent`
- `organization`
- `service`
- `pseudonymous`
- `unverified`

### Verification states
- `unverified`
- `self-asserted`
- `verified-human`
- `verified-agent`
- `verified-organization`
- `delegated-agent`
- `delegated-service`
- `revoked`
- `suspended`

### Lifecycle statuses
- `draft`
- `active`
- `suspended`
- `revoked`
- `expired`

### Key statuses
- `active`
- `suspended`
- `revoked`
- `expired`

### Revocation freshness states
- `clear`
- `stale`
- `unknown`
- `revoked`

### Channels
- `voice`
- `messaging`
- `email`
- `video`
- `document`

### Channel subtypes
- `outbound-call`
- `inbound-call`
- `thread-message`
- `direct-message`
- `email-thread`
- `video-meeting`
- `document-share`

### Delegation actions
- `communicate`
- `identify`
- `sign-session`
- `sign-message`
- `issue-artifact`
- `request-response`

### Purpose profile
- purpose values SHOULD be stable machine-readable slugs such as `support-follow-up`, `billing-notice`, or `claims-update`
- a verifier MUST compare exact purpose strings, not fuzzy text similarity
- human-readable purpose labels MAY be rendered by adapters, but trust evaluation MUST use the canonical slug
- the first delegated live profile SHOULD reject envelopes that omit a purpose when the bound delegation has `purpose_bindings`

## Shared lineage blocks

The first fixture and implementation profile should normalize repeated trust-lineage fields into conceptual blocks even when the JSON remains flattened.

### Delegated authority lineage
- `sender.identity_id` or envelope `sender_id` / `actor_id`
- `operator_id`
- `delegation_id`
- `purpose`
- `channel`
- `channel_subtype`

### Session lineage
- `communication_id`
- `session_id` or envelope `conversation_id`
- sequence scope metadata when events are ordered

### Artifact lineage
- `artifact_type`
- `communication_id`
- `session_id`
- `derived_from`
- detached payload digest and length

Verifier note:
- a live delegated flow MUST fail lineage validation when these blocks disagree across signed objects unless an explicit future rotation or transfer profile permits the change

## Shared proof block

All signed DigiD objects should use the same proof structure.
The signer for each object family MUST be determinable from signed fields alone, without adapter-side hints.

```json
{
  "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
  "type": "ed25519-2020",
  "kid": "dgd:key:agent_01:key-2026-04",
  "created_at": "2026-04-15T00:00:00Z",
  "canonicalization": "JCS",
  "signature": "zBase64OrMultibaseSignature"
}
```

Notes:
- `cryptosuite` is a strict allowlist identifier; verifiers MUST reject unsupported cryptosuites rather than attempting best-effort verification
- `canonicalization` should default to JSON Canonicalization Scheme (`JCS`)
- the signature is calculated over the object with `proof` removed
- `proof.created_at` is metadata and is not itself signed; verifiers should rely on signed top-level timestamps like `created_at` on the object family being evaluated
- verifiers should reject unknown critical proof parameters
- the first implementation profile should only accept the `Ed25519` signing algorithm and MUST reject any mismatch between `proof.type` and the resolved signer key record `keys[].algorithm`
- `proof.kid` must resolve unambiguously to the signing identity during verification
- `keys[].public_key_encoding` MUST be `spki-der-base64` in the v0.3 reference profile
- `keys[].public_key` MUST be base64-encoded DER `spki` (`SubjectPublicKeyInfo`) for the referenced key in the v0.3 reference profile
- verifiers SHOULD enforce key purpose and lifecycle posture in addition to signature math: `keys[].purposes` must authorize `assertion`, the key must be within its declared `not_before`/`expires_at` window at sign time, and current-time trust should only render when the key is operationally `status: active` at verification time
- signer resolution for the first profile is family-specific and MUST follow this matrix:

| Object family | Expected signer identity |
| --- | --- |
| `dgd.identity` | `object_id` when self-controlled, otherwise `controller.controller_id` |
| `dgd.attestation` | `issuer_id` |
| `dgd.delegation` | `issuer_id` |
| `dgd.communication` | `sender.identity_id` |
| `dgd.session` | same signer lineage as the bound `dgd.communication` |
| `dgd.artifact` | same signer lineage as the artifact producer, which MUST align with the bound communication unless a future service-capture profile says otherwise |
| `dgd.verification_result` | verifier identity or local unsigned output when the profile explicitly permits unsigned local results |
| `dgd.revocation` | authorized revoker identity, typically `issuer_id` |

A verifier MUST reject an object when the resolved signer identity from object fields conflicts with the identity resolved from `proof.kid`.

## 1. Identity object

Represents a persistent subject capable of holding keys and appearing in trust decisions.

```json
{
  "object_type": "dgd.identity",
  "schema_version": "0.3",
  "object_id": "dgd:identity:agent_01JABC...",
  "identity_class": "agent",
  "display_name": "Acme Support Agent 01",
  "legal_name": null,
  "verification_state": "verified-agent",
  "status": "active",
  "primary_handle": "acme-support-agent-01",
  "keys": [
    {
      "kid": "dgd:key:agent_01:key-2026-04",
      "algorithm": "Ed25519",
      "public_key": "z6Mk...",
      "public_key_encoding": "spki-der-base64",
      "status": "active",
      "purposes": ["assertion", "authentication"],
      "created_at": "2026-04-15T00:00:00Z",
      "not_before": "2026-04-15T00:00:00Z",
      "expires_at": null,
      "revocation_checked_at": null
    }
  ],
  "controller": {
    "controller_id": "dgd:identity:org_acme",
    "relationship": "organization-issued"
  },
  "disclosure": {
    "display_level": "standard",
    "real_world_identity_disclosed": false,
    "supports_selective_disclosure": false
  },
  "service_endpoints": [
    {
      "type": "verification-api",
      "url": "https://verify.example.com/digid/identities/agent_01JABC"
    }
  ],
  "created_at": "2026-04-15T00:00:00Z",
  "updated_at": "2026-04-15T00:00:00Z",
  "status_reason": null
}
```

### Identity constraints
- `object_id` must be immutable
- at least one active key must exist for an `active` identity
- `verification_state` is user-facing interpretation, not raw evidence
- `controller.relationship` should be one of `self-controlled`, `organization-issued`, `delegated-service`, `custodial`
- key records should include `not_before` and may include `expires_at`
- key records MUST include `purposes` and the v0.3 reference verifier MUST treat `assertion` as required for signing DigiD protocol objects
- `keys[].status` is an operational posture signal for current-time trust; without a signed `revoked_at` timestamp, a verifier MUST NOT infer a precise historical revocation time solely from `status: revoked`
- if all keys are stale, expired, suspended, or revoked, the identity must not be treated as active for signing
- `display_name` is required for end-user rendered identities unless the identity class is intentionally pseudonymous
- `keys[].kid` values MUST be unique within the identity object
- `keys[].purposes` MUST include `assertion` for any key used to sign DigiD objects or envelopes
- key records MUST disclose `public_key_encoding` so multi-language implementations do not guess key parsing rules
- if `controller.controller_id` differs from `object_id`, verifier UX SHOULD avoid presenting the identity as self-controlled
- for agent or service identities that are not self-controlled, high-trust verification MUST depend on a signed owner-binding path, not on the agent key alone
- the first delegated-agent profile SHOULD treat controller binding, agent attestation, and active delegation as a combined ownership proof chain from the controlling human or organization to the agent signing key

## 2. Attestation object

Represents a signed statement by an issuer about a subject.

```json
{
  "object_type": "dgd.attestation",
  "schema_version": "0.3",
  "object_id": "dgd:attestation:01JXYZ...",
  "issuer_id": "dgd:identity:org_acme",
  "subject_id": "dgd:identity:agent_01JABC...",
  "subject_key": {
    "kid": "dgd:key:agent_01:key-2026-04",
    "public_key_digest": "sha256:..."
  },
  "attestation_type": "organization-issued-agent",
  "verification_state": "verified-agent",
  "status": "active",
  "issued_at": "2026-04-15T00:00:00Z",
  "valid_from": "2026-04-15T00:00:00Z",
  "valid_until": "2026-10-15T00:00:00Z",
  "revocation_check": {
    "mode": "online-or-cached",
    "max_age_seconds": 3600,
    "status": "clear"
  },
  "claims": {
    "authorized_channels": ["voice", "messaging", "email"],
    "organization_display_name": "Acme Support",
    "role": "support-agent"
  },
  "evidence": {
    "method": "internal-hr-and-admin-approval",
    "reference": "att-evidence-2026-04-15-001"
  },
  "proof": {
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
    "type": "ed25519-2020",
    "kid": "dgd:key:org_acme:key-2026-01",
    "created_at": "2026-04-15T00:00:01Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

### Attestation constraints
- `issuer_id` and `subject_id` must be different unless the type explicitly allows self-attestation
- expired or revoked attestations must not satisfy a high-trust verification path
- attestation type is machine-readable, not display text
- verifier should treat missing or stale `revocation_check` posture as degraded trust, not silent success
- `verification_state` and `attestation_type` MUST agree, for example `organization-issued-agent` cannot resolve to `verified-human`
- `claims.authorized_channels` SHOULD be treated as issuer intent, not direct delegation authority
- verifier profiles MAY require `subject_key` so high-trust delegated communication cannot be bound to a different subject signing key than the issuer attested
- if `subject_key` is present, `subject_key.kid` MUST resolve to a key on the subject identity and `subject_key.public_key_digest` MUST be a digest string with an algorithm prefix (example: `sha256:<hex>`)
- if `valid_until` is absent, verifier policy SHOULD treat the attestation as long-lived but still revocation-sensitive

## 3. Delegation object

Defines authority for one subject to act on behalf of another.

```json
{
  "object_type": "dgd.delegation",
  "schema_version": "0.3",
  "object_id": "dgd:delegation:01JKLM...",
  "issuer_id": "dgd:identity:org_acme",
  "delegate_id": "dgd:identity:agent_01JABC...",
  "delegate_key": {
    "kid": "dgd:key:agent_01:key-2026-04",
    "public_key_digest": "sha256:..."
  },
  "delegate_class": "agent",
  "status": "active",
  "authority": {
    "channels": ["voice", "email"],
    "actions": ["communicate", "identify", "sign-session", "sign-message"],
    "restrictions": ["no-financial-approval", "no-legal-commitment"],
    "purpose_bindings": ["support-follow-up", "account-notice"]
  },
  "valid_from": "2026-04-15T00:00:00Z",
  "valid_until": "2026-10-15T00:00:00Z",
  "revocation_endpoint": "https://verify.example.com/digid/revocations/01JKLM",
  "revocation_check": {
    "mode": "online-required",
    "max_age_seconds": 300,
    "status": "clear"
  },
  "proof": {
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
    "type": "ed25519-2020",
    "kid": "dgd:key:org_acme:key-2026-01",
    "created_at": "2026-04-15T00:00:01Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

### Delegation constraints
- verifier must check that the delegate identity is active
- verifier must check requested channel and action against `authority`
- expired delegation cannot be revived without a new object
- delegations used for live high-trust communication should require fresher revocation data than static attestations
- `authority.channels` and `authority.actions` MUST be non-empty arrays
- verifier profiles MAY require `delegate_key` so high-trust delegated communication cannot be bound to a different signing key than the issuer delegated
- if `delegate_key` is present, `delegate_key.kid` MUST resolve to a key on the delegate identity and `delegate_key.public_key_digest` MUST be a digest string with an algorithm prefix (example: `sha256:<hex>`)
- if `purpose_bindings` are present, the communication or event using the delegation MUST declare one matching purpose
- the first live-communication profile SHOULD require `valid_until` so delegated authority cannot drift into effectively permanent access
- if `authority.restrictions` are present, verifier output SHOULD surface them when rendering expanded trust details
- `delegate_id` MUST resolve to the same identity that signs delegated `dgd.communication`, `dgd.session`, `dgd.message`, and `dgd.event` artifacts in the first live profile
- the first live delegated profile MUST reject authority escalation when an envelope or communication claims an action not enumerated in the delegation, even if the channel is otherwise allowed
- the first live delegated profile MUST also reject owner-binding gaps where the delegate signing key is present but the controlling human or organization cannot be resolved through the signed identity, attestation, and delegation chain

## 4. Key authorization object (optional)

An issuer-signed authorization to treat a specific delegate signing key as eligible to exercise an existing delegation.

This is a v0.3 escape hatch for safe key rotation overlap without forcing the issuer to reissue every attestation/delegation immediately.

```json
{
  "object_type": "dgd.key_authorization",
  "schema_version": "0.3",
  "object_id": "dgd:key_authorization:01JKEYAUTH...",
  "issuer_id": "dgd:identity:org_acme",
  "subject_id": "dgd:identity:agent_01JABC...",
  "delegation_id": "dgd:delegation:01JKLM...",
  "authorized_key": {
    "kid": "dgd:key:agent_01:key-2026-05",
    "public_key_digest": "sha256:..."
  },
  "status": "active",
  "valid_from": "2026-04-15T00:05:30Z",
  "valid_until": "2026-10-15T00:00:00Z",
  "created_at": "2026-04-15T00:05:31Z",
  "proof": {
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
    "type": "ed25519-2020",
    "kid": "dgd:key:org_acme:key-2026-01",
    "created_at": "2026-04-15T00:05:31Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

### Key authorization constraints
- `issuer_id` MUST match the delegating identity (`dgd.delegation.issuer_id`) for the referenced `delegation_id`
- `subject_id` MUST match the delegate identity (`dgd.delegation.delegate_id`) for the referenced `delegation_id`
- `authorized_key.kid` MUST resolve to a key on the `subject_id` identity object and `authorized_key.public_key_digest` MUST be a digest string with an algorithm prefix (example: `sha256:<hex>`)
- a verifier MUST NOT treat a key authorization as expanding delegation scope; it only authorizes which delegate signing key is acceptable for that existing delegation
- verifiers MAY accept a valid `dgd.key_authorization` as an alternative binding method when `subject_key`/`delegate_key` bindings are missing or mismatched due to rotation overlap
- `dgd.key_authorization` SHOULD be short-lived for rotation overlap, not a permanent multi-key delegation mechanism
- `dgd.key_authorization` MUST be revocable via `dgd.revocation` with `target_object_type: dgd.key_authorization` and `target_object_id: <object_id>`

## 5. Signed communication object

A normalized high-level communication object for completed or in-progress exchanges.

```json
{
  "object_type": "dgd.communication",
  "schema_version": "0.3",
  "object_id": "dgd:communication:01JCOMM...",
  "status": "active",
  "channel": "voice",
  "channel_subtype": "outbound-call",
  "session_id": "dgd:session:voice_01JSESSION...",
  "sender": {
    "identity_id": "dgd:identity:agent_01JABC...",
    "identity_class": "agent",
    "verification_state": "delegated-agent"
  },
  "operator_id": "dgd:identity:org_acme",
  "delegation_id": "dgd:delegation:01JKLM...",
  "purpose": "support-follow-up",
  "payload": {
    "content_type": "session-manifest",
    "content_digest": "sha256:...",
    "content_length": 1842,
    "media_mode": "real-time-voice"
  },
  "timestamps": {
    "created_at": "2026-04-15T00:00:00Z",
    "session_started_at": "2026-04-15T00:00:10Z",
    "session_ended_at": null
  },
  "provenance": {
    "source_type": "agent-generated",
    "capture_method": "live-session",
    "edited": false
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

### Communication constraints
- `sender.identity_id` MUST be the same signer identity resolved from `proof.kid`
- `operator_id` MUST be present when `sender.verification_state` is delegated or organization-issued in a live communication flow
- `delegation_id` MUST be present when the communication claims operator-backed authority
- `session_id` MUST be stable for the lifetime of the live communication flow and SHOULD equal envelope `conversation_id` in the first live profile
- `purpose` SHOULD match an allowed delegation purpose when a delegation exists
- `timestamps.created_at` MUST be less than or equal to `session_started_at` when both are present
- `payload.content_digest` MUST bind the signed communication object to the first announced session or artifact payload
- the first demo profile SHOULD treat `dgd.communication` as the anchor object for all live-session envelopes in the same flow
- for live delegated flows, `dgd.communication` SHOULD be treated as mandatory protocol profile input, not optional metadata
- if `operator_id` is present, the communication MUST be treated as the authoritative lineage source for later envelope `sender_id`, `operator_id`, `delegation_id`, `conversation_id`, and `purpose` checks
- a verifier MUST treat an envelope as lineage-conflicting if it claims delegated authority that does not match the bound communication object, unless a future signed rotation profile explicitly permits the change
- a verifier MUST NOT treat a delegated-agent communication as owner-backed unless `operator_id`, `delegation_id`, the agent identity controller binding, and the agent signing key all resolve into one coherent ownership chain

### Communication signing boundary profile

For the first live communication profile, these fields are trust-bearing and therefore MUST live inside the signed communication object body, not unsigned adapter metadata:
- `sender.identity_id`
- `operator_id`
- `delegation_id`
- `session_id`
- `purpose`
- `payload.content_digest`
- `payload.media_mode`

These fields MAY remain unsigned operational metadata in adapter-specific systems if they are not rendered as trust claims and do not affect trust evaluation:
- local transport ids
- retry counters
- queue timestamps after signed issuance
- vendor-specific delivery metadata

If an adapter renders any unsigned field as if DigiD verified it, the verifier UI SHOULD treat that presentation as out of profile.
## 6. Session object

Represents the ordered interaction scope for a live communication flow.

```json
{
  "object_type": "dgd.session",
  "schema_version": "0.3",
  "object_id": "dgd:session:voice_01JSESSION...",
  "status": "active",
  "session_type": "voice.live",
  "communication_id": "dgd:communication:01JCOMM...",
  "channel": "voice",
  "operator_id": "dgd:identity:org_acme",
  "counterparty": {
    "role": "receiver",
    "display_label": "Customer endpoint"
  },
  "sequence_scope": {
    "scope_type": "conversation",
    "scope_id": "dgd:session:voice_01JSESSION...",
    "next_expected_sequence": 2
  },
  "timestamps": {
    "created_at": "2026-04-15T00:00:00Z",
    "started_at": "2026-04-15T00:00:10Z",
    "ended_at": null
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

### Session constraints
- `communication_id` MUST resolve to one active `dgd.communication` object
- `object_id` SHOULD equal envelope `conversation_id` for the first live-session profile
- `session_type` MUST be compatible with the communication channel
- `sequence_scope.scope_id` MUST equal `object_id` in the first live delegated profile
- `timestamps.started_at` MUST be greater than or equal to the communication `timestamps.session_started_at` when both exist
- if `operator_id` is present, it MUST match the bound communication lineage
- the first demo profile SHOULD require one signed `dgd.session` object so replay checks and ordered-event scope are explicit instead of inferred from envelopes alone
- `sequence_scope.next_expected_sequence` MUST either be omitted from immutable fixtures or reflect the next sequence after the highest signed event already included in the fixture set
- if `sequence_scope.next_expected_sequence` is present, verifiers MUST treat it as advisory replay metadata unless a future countersignature profile proves it was updated after the latest accepted event

## 7. Artifact object

Represents a detached recording, transcript, summary, or exported media artifact that is trust-bound to a communication flow.

```json
{
  "object_type": "dgd.artifact",
  "schema_version": "0.3",
  "object_id": "dgd:artifact:recording_01J...",
  "status": "active",
  "artifact_type": "voice.recording",
  "communication_id": "dgd:communication:01JCOMM...",
  "session_id": "dgd:session:voice_01JSESSION...",
  "derived_from": [
    "dgd:envelope:msg_voice_start_01J..."
  ],
  "payload": {
    "content_type": "audio/opus",
    "content_digest": "sha256:...",
    "content_length": 483210,
    "codec": "opus",
    "duration_ms": 48321
  },
  "provenance": {
    "capture_method": "native-call-recording",
    "transformation_state": "original",
    "edited": false,
    "published": false
  },
  "created_at": "2026-04-15T00:10:00Z",
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

### Artifact constraints
- `artifact_type` MUST determine the allowed payload descriptor fields
- `communication_id` MUST resolve to the same communication lineage used by any related message envelopes
- if `session_id` is present, it MUST match the communication `session_id`
- `payload.content_digest` MUST be computed over the detached raw bytes, not over the artifact object JSON
- `derived_from` SHOULD reference the signed communication or envelope lineage that made the artifact possible
- a verifier SHOULD degrade trust when an artifact claims `edited: false` but the provenance chain is incomplete or conflicting
- the first demo profile MAY keep artifacts optional, but any recording or transcript fixture SHOULD use `dgd.artifact` instead of leaving artifact identity implicit in message envelopes alone
- the first implementation profile SHOULD require `derived_from` whenever the artifact is generated from a live session so post-call manifests cannot silently detach from the signed event stream

## 8. Verification result object

Represents a portable verifier output that downstream UIs can render without repeating the full trust evaluation logic.

```json
{
  "object_type": "dgd.verification_result",
  "schema_version": "0.3",
  "object_id": "dgd:verification:01JVERIFY...",
  "subject_id": "dgd:communication:01JCOMM...",
  "status": "active",
  "verified_at": "2026-04-15T00:05:00Z",
  "decision": "allow-with-trust-indicator",
  "verification_mode": "dual",
  "checks": {
    "signature_valid": true,
    "signer_status": "active",
    "attestation_status": "active",
    "delegation_status": "active",
    "revocation_status": "clear",
    "freshness_status": "fresh",
    "payload_integrity": "intact",
    "time_valid": true,
    "event_time_valid": true,
    "current_time_valid": true
  },
  "resolved_trust_state": "org-issued-agent",
  "display_summary": "Org-issued agent for Acme Support",
  "warnings": [],
  "errors": []
}
```

### Verification result decisions
- `allow-with-trust-indicator`
- `allow-with-warning`
- `degraded-trust`
- `reject`

### Verification result constraints
- `verification_mode: dual` MUST include both `event_time_valid` and `current_time_valid`
- `warnings` MUST explain every downgrade that still results in non-reject output
- `display_summary` SHOULD be short enough to fit a compact trust banner without truncation

## 9. Revocation object

Represents an explicit revocation for an identity, key, attestation, delegation, or communication object.

```json
{
  "object_type": "dgd.revocation",
  "schema_version": "0.3",
  "object_id": "dgd:revocation:01JREV...",
  "issuer_id": "dgd:identity:org_acme",
  "target_object_id": "dgd:delegation:01JKLM...",
  "target_object_type": "dgd.delegation",
  "status": "active",
  "reason_code": "authorization-ended",
  "reason_detail": "Agent contract terminated",
  "revoked_at": "2026-05-01T00:00:00Z",
  "created_at": "2026-05-01T00:00:01Z",
  "proof": {
    "cryptosuite": "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3",
    "type": "ed25519-2020",
    "kid": "dgd:key:org_acme:key-2026-01",
    "created_at": "2026-05-01T00:00:01Z",
    "canonicalization": "JCS",
    "signature": "zSig..."
  }
}
```

### Revocation constraints
- `target_object_type` MUST match the referenced object's family
- `created_at` MUST be present and MUST be treated as the signed issuance time for the revocation statement
- the revocation issuer MUST be authorized to revoke the target family
- once active, a revocation object MUST be treated as append-only

### Revocation timing posture (v0.3 reference verifier)
- `revoked_at` is the claimed effective time
- to prevent silent retroactive revocation, the v0.3 reference verifier SHOULD treat the effective revocation time as `max(revoked_at, created_at)` with a small clock-skew allowance and MUST surface a warning when `revoked_at` significantly predates `created_at`

### Key revocation targeting
For key revocation, `target_object_type` SHOULD be `dgd.signing_key` and `target_object_id` SHOULD equal the key `kid` string that appears in `proof.kid`.

## Resolution order for the first implementation

A reference verifier should resolve DigiD objects in this order:
1. determine signer identity and required issuer or delegator references
2. validate object shape and required fields for `object_type`
3. verify signature and canonicalization rules
4. resolve active key on the signer identity
5. resolve issuer attestation path if the trust state depends on it
6. resolve delegation scope if operator-backed authority is claimed
7. resolve revocation and freshness posture for all trust-bearing objects
8. derive both event-time and current-time trust conclusions when they differ

## Validation guidance for the first implementation

A reference verifier should at minimum enforce:
1. required field presence by `object_type`
2. canonical signature verification using the referenced key
3. key status, identity status, attestation status, and delegation status
4. channel and action authorization for delegated actors
5. timestamp validity and revocation checks
6. clear downgrade behavior when an object is syntactically valid but trust-incomplete

## Minimal fixture profile for v0.3

The first fixture-driven implementation should treat these objects as required for a delegated-agent voice flow:
1. one active `dgd.identity` for the organization
2. one active `dgd.identity` for the agent
3. one active `dgd.attestation` from organization to agent
4. one active `dgd.delegation` from organization to agent with `voice` scope
5. one `dgd.communication` object signed by the agent
6. one signed `dgd.session` object aligned to the communication `session_id`
7. one or more envelopes referencing the same communication, session, and delegation lineage
8. zero or more `dgd.artifact` objects for recording or transcript comparisons
9. zero or more `dgd.key_authorization` objects to support key rotation overlap without reissuing the base delegation
10. zero or more `dgd.revocation` objects for degraded comparison cases

This profile gives the verifier a stable graph instead of letting demo fixtures omit trust-bearing links opportunistically.

## Open questions still worth deciding later
- whether identity and key documents should fully align with W3C DID conventions or stay DigiD-native
- whether selective disclosure should be in v1 or treated as a later privacy upgrade
- whether revocation should be pull-based only, push-based, or both
