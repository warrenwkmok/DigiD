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

### Delegation actions
- `communicate`
- `identify`
- `sign-session`
- `sign-message`
- `issue-artifact`
- `request-response`

## Shared proof block

All signed DigiD objects should use the same proof structure.

```json
{
  "type": "ed25519-2020",
  "kid": "dgd:key:agent_01:key-2026-04",
  "created_at": "2026-04-15T00:00:00Z",
  "canonicalization": "JCS",
  "signature": "zBase64OrMultibaseSignature"
}
```

Notes:
- `canonicalization` should default to JSON Canonicalization Scheme (`JCS`)
- the signature is calculated over the object with `proof` removed
- verifiers should reject unknown critical proof parameters
- the first implementation profile should only accept `Ed25519`
- `proof.kid` must resolve unambiguously to the signing identity during verification

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
- if all keys are stale, expired, suspended, or revoked, the identity must not be treated as active for signing
- `display_name` is required for end-user rendered identities unless the identity class is intentionally pseudonymous

## 2. Attestation object

Represents a signed statement by an issuer about a subject.

```json
{
  "object_type": "dgd.attestation",
  "schema_version": "0.3",
  "object_id": "dgd:attestation:01JXYZ...",
  "issuer_id": "dgd:identity:org_acme",
  "subject_id": "dgd:identity:agent_01JABC...",
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

## 3. Delegation object

Defines authority for one subject to act on behalf of another.

```json
{
  "object_type": "dgd.delegation",
  "schema_version": "0.3",
  "object_id": "dgd:delegation:01JKLM...",
  "issuer_id": "dgd:identity:org_acme",
  "delegate_id": "dgd:identity:agent_01JABC...",
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
- if `purpose_bindings` are present, the communication or event using the delegation MUST declare one matching purpose

## 4. Signed communication object

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
- `purpose` SHOULD match an allowed delegation purpose when a delegation exists
- `timestamps.created_at` MUST be less than or equal to `session_started_at` when both are present

## 5. Verification result object

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
  "resolved_trust_state": "delegated-agent",
  "display_summary": "Verified agent acting for Acme Support",
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

## 6. Revocation object

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
  "proof": {
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
- the revocation issuer MUST be authorized to revoke the target family
- once active, a revocation object MUST be treated as append-only

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

## Open questions still worth deciding later
- whether identity and key documents should fully align with W3C DID conventions or stay DigiD-native
- whether selective disclosure should be in v1 or treated as a later privacy upgrade
- whether revocation should be pull-based only, push-based, or both
