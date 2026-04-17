# DigiD normative protocol draft v0.3

This document defines the minimum normative rules a verifier and issuer must share for the first DigiD implementation.

Its purpose is to remove ambiguity from the object model and make the first verifier wedge buildable.

## Conformance language

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

## Supported object families

The first verifier profile supports these object families:
- `dgd.identity`
- `dgd.attestation`
- `dgd.delegation`
- `dgd.communication`
- `dgd.session`
- `dgd.artifact`
- `dgd.verification_result`
- `dgd.revocation`
- `dgd.message`
- `dgd.event`

Objects outside this set MUST be ignored unless a verifier profile explicitly adds support.

## Required common fields

All DigiD objects and envelopes MUST include:
- stable type field: `object_type` or `envelope_type`
- `schema_version`
- globally unique identifier: `object_id` or `envelope_id`
- `created_at`
- `status` for objects that have lifecycle state
- `proof` for signed artifacts unless the profile explicitly allows unsigned local verifier output

## Unknown fields and extensions

Verifiers MUST ignore unknown non-critical fields.

If an object includes `critical_extensions`, the verifier MUST understand every listed extension identifier or reject the object.

Example:

```json
{
  "critical_extensions": [
    "urn:dgd:ext:key-attestation-chain",
    "urn:dgd:ext:freshness-receipt"
  ]
}
```

## Signature requirements

For v0.3 profile:
- signing algorithm MUST be `Ed25519`
- canonicalization MUST be `JCS`
- the signature input MUST be the full JSON object with `proof` removed
- detached binary payloads MUST be referenced by digest, not embedded in the signing rule itself

A verifier MUST reject:
- unsupported signature algorithms
- unsupported canonicalization methods
- signatures whose `kid` cannot be resolved
- signatures from revoked keys

## Resolution order

A verifier MUST resolve DigiD trust in this order.

### For signed objects
1. parse JSON and determine object or envelope family
2. validate required fields for that family
3. validate proof shape
4. resolve `proof.kid` to a key on the signer identity
5. verify signature bytes
6. verify signer key lifecycle state
7. verify signer identity lifecycle state
8. resolve required attestations for claimed verification state
9. resolve required delegation if the signer claims operator-backed authority
10. evaluate revocation objects and freshness posture
11. derive trust state and warnings
12. produce a `dgd.verification_result`

### Signer identity selection
A verifier MUST determine the signer identity from one of:
- explicit signer field such as `sender_id` or `actor_id`
- the object's own subject if it is a self-signed identity or self-signed lifecycle object
- a profile-specific issuer field when the object is issuer-signed

If signer identity resolution is ambiguous, verification MUST fail.

## Relationship requirements by object family

### `dgd.identity`
- MAY be self-controlled or issuer-controlled
- MUST contain at least one key record
- MUST NOT claim `status: active` without at least one active signing key

### `dgd.attestation`
- MUST reference `issuer_id` and `subject_id`
- MUST define `attestation_type`
- MUST define validity window with `valid_from`
- SHOULD define `valid_until` unless intentionally non-expiring

### `dgd.delegation`
- MUST reference delegator in `issuer_id`
- MUST reference delegate in `delegate_id`
- MUST include `authority.channels` and `authority.actions`
- MUST include `valid_from`
- SHOULD include `valid_until`

### `dgd.session`
- MUST reference one `communication_id`
- MUST define one ordered interaction scope
- MUST align `object_id` with live envelope `conversation_id` in the first delegated live profile

### `dgd.artifact`
- MUST reference the communication lineage it was derived from
- MUST include payload digest metadata for detached content
- MUST keep `session_id` aligned when the artifact came from a live session

### `dgd.message`
- MUST include `message_type`
- MUST include `subject_id`
- MUST include `channel`
- MUST include sender identity field
- MUST include payload digest metadata

### `dgd.event`
- MUST include `event_type`
- MUST include `subject_id`
- MUST include actor identity field
- MUST include monotonic `sequence` within the scoped stream if the event belongs to an ordered session
- MUST include `purpose` when delegated authority is claimed in the first live delegated profile
- for the first fixture-driven live-session profile, ordered events within one `conversation_id` MUST form a contiguous sequence starting at `1`

## Trust path requirements

A verifier MUST NOT render `verified-agent` or `delegated-agent` unless:
- the signer identity is active
- the signing key is active at evaluation time or valid at event time under accepted historical policy
- a qualifying attestation path exists
- any required delegation exists and is in scope

A verifier MUST NOT render `verified-human` unless a qualifying human-verification attestation path exists.

## Historical verification vs current verification

DigiD distinguishes two evaluation modes:
- `event_time`: evaluate whether the object was valid when signed
- `current_time`: evaluate whether the trust chain is still operationally valid now

A verifier SHOULD expose both when they differ.

Example:
- event-time valid, current delegation revoked
- event-time valid, current key expired

## Revocation and freshness posture

A verifier MUST classify revocation status as one of:
- `clear`
- `revoked`
- `stale`
- `unknown`

A verifier profile MUST define freshness thresholds.

Default v0.3 thresholds:
- online high-trust checks: revocation data SHOULD be fresher than 5 minutes
- normal interactive checks: revocation data SHOULD be fresher than 1 hour
- offline or cached checks older than 1 hour MUST surface `stale`
- absence of revocation data MUST surface `unknown`

`clear` MUST NOT be shown when the verifier cannot prove freshness within profile limits.

## Verification result minimum output

A conforming verifier result MUST include:
- `decision`
- `resolved_trust_state`
- `verified_at`
- `verification_mode` (`event_time`, `current_time`, or `dual`)
- `checks.revocation_status`
- `checks.freshness_status`
- user-visible warnings when trust is degraded

## Minimum rejection cases

The verifier MUST reject when:
- required fields are missing
- signature verification fails
- signer identity cannot be resolved
- a listed critical extension is unsupported
- delegation is required but missing
- channel or action is out of scope for delegation
- delegated live lineage conflicts across communication, session, and envelope objects
- an ordered live-session fixture stream has duplicate, regressing, or non-contiguous event `sequence` values within one `conversation_id`

## Minimum downgrade cases

The verifier SHOULD downgrade instead of hard reject when:
- signature is mathematically valid but revocation freshness is stale
- event-time validity succeeds but current-time authority has expired
- signer identity is active but attestation evidence is incomplete

## Warning code portability

The first verifier profile SHOULD emit stable machine-readable warning codes alongside user-facing warning strings.
At minimum, the profile should support:
- `revocation-stale`
- `revocation-unknown`
- `delegation-expired-current-time`
- `key-expired-current-time`
- `lineage-conflict`
- `replay-suspected`
- `authority-incomplete`

Adapters MAY rephrase warning text, but SHOULD preserve the underlying code so downstream analytics, audits, and UI tests can compare outcomes consistently.

## First implementation note

The first implementation SHOULD encode these rules as discriminated unions plus a deterministic resolution pipeline so demo fixtures and later production adapters share the same trust logic.