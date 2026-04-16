# DigiD verifier policy profile v0.3

This document centralizes verifier policy that was previously scattered across the protocol draft.

The protocol defines what objects mean.
This profile defines how a verifier should evaluate risk-sensitive cases in the first implementation wedge.

## Purpose

The first verifier needs one policy surface for:
- freshness defaults
- replay posture
- duplicate-envelope handling
- event-time versus current-time rendering
- live-session versus offline artifact differences

Without this document, two conforming verifiers could produce meaningfully different trust outcomes from the same fixture family.

## Policy goals

The first policy profile should be:
- conservative for live communications
- explicit about downgrade versus reject behavior
- small enough for fixture-driven implementation
- honest about what DigiD proves and what it does not prove

## Interaction classes

The first verifier profile should classify inputs into one of these interaction classes:
- `live_voice`
- `live_video`
- `async_message`
- `async_email`
- `stored_artifact`
- `historical_audit`

The initial demo wedge is `live_voice`.

## Default policy table

| Interaction class | Default verification mode | Revocation max age | Replay sensitivity | Suggested default outcome on stale status |
| --- | --- | --- | --- | --- |
| `live_voice` | `dual` | 300 seconds | high | `allow-with-warning` or `degraded-trust` |
| `live_video` | `dual` | 300 seconds | high | `allow-with-warning` or `degraded-trust` |
| `async_message` | `current_time` | 3600 seconds | medium | `allow-with-warning` |
| `async_email` | `current_time` | 3600 seconds | medium | `allow-with-warning` |
| `stored_artifact` | `dual` | 86400 seconds | low | `allow-with-warning` |
| `historical_audit` | `event_time` | policy-defined | low | `allow-with-warning` |

These are verifier defaults, not immutable protocol constants.

## Evaluation model

The first verifier should calculate four things separately:
1. signature validity
2. authority validity at event time
3. authority validity at current time
4. freshness and replay posture at verification time

A compact trust label SHOULD be derived only after those checks are complete.

## Outcome classes

The first verifier should normalize outputs into:
- `allow-with-trust-indicator`
- `allow-with-warning`
- `degraded-trust`
- `reject`

## Recommended decision rules

### Reject
Use `reject` when any of these are true:
- signature verification fails
- signer identity cannot be resolved
- proof key is revoked, expired, or not authorized for assertion at required verification time
- required delegated authority is missing for a live delegated flow
- event ordering indicates likely replay or stream tampering under the active replay policy
- a critical extension is unsupported

### Degraded trust
Use `degraded-trust` when:
- signature is valid but current-time authority is missing or revoked
- delegation restrictions conflict with the claimed purpose or action
- revocation status is unknown for a live high-trust interaction and policy does not permit warning-only behavior
- manifest lineage is partially incomplete but the verifier can still explain the gap

### Allow with warning
Use `allow-with-warning` when:
- signature and authority are valid, but revocation freshness is stale
- event-time validity is true and current-time validity is uncertain
- duplicate presentation is observed but the verifier can safely identify it as a repeat rather than conflicting replay
- a lower-risk async or stored-artifact profile allows partial freshness degradation

### Allow with trust indicator
Use `allow-with-trust-indicator` only when:
- signature is valid
- required identity, attestation, and delegation path is complete
- current-time checks pass for the active interaction class
- freshness is within the active policy window
- no replay suspicion is unresolved

## Replay policy for the first live profile

The first `live_voice` policy should be opinionated.

### Required replay checks
A verifier should treat the following as replay-sensitive inputs:
- duplicate `envelope_id`
- duplicate `sequence` within the same sequence scope
- sequence regression within the same session lineage
- a message or event referencing the same `subject_id` but a conflicting `delegation_id`
- a message or event referencing the same `conversation_id` but a conflicting signer lineage

### Sequence scope rule
For the first live voice profile:
- primary sequence scope SHOULD be `conversation_id` when present
- otherwise it SHOULD fall back to `subject_id`
- the verifier SHOULD record sequence scope in diagnostic output

### Duplicate handling
- exact duplicate `envelope_id` with identical signed bytes MAY be surfaced as duplicate presentation, not automatic forgery
- exact duplicate `envelope_id` with different signed bytes MUST be rejected
- duplicate `sequence` within the same scope but different `envelope_id` values SHOULD be treated as replay-suspicious and rejected for live profiles

## Freshness policy

### Freshness states
The verifier should normalize freshness into:
- `fresh`
- `stale`
- `unknown`
- `not-required`

### Live-voice default
For `live_voice`:
- if revocation evidence age is `<= 300` seconds, treat as `fresh`
- if older than `300` seconds but still available, treat as `stale`
- if unavailable, treat as `unknown`
- `unknown` SHOULD normally downgrade at least to `degraded-trust`

### Historical-audit default
For `historical_audit`:
- stale revocation data SHOULD not erase event-time validity by itself
- current-time validity may still be reported separately if requested

## Event-time versus current-time policy

The first verifier should preserve both conclusions when they differ.

### Rendering rule
If `event_time_valid` and `current_time_valid` disagree:
- compact UI SHOULD prefer the safer present-tense posture for live surfaces
- expanded UI SHOULD explicitly show both conclusions
- wording SHOULD avoid implying that current authority existed if it only existed at sign time

### Example
Good:
- `Delegation no longer active`
- details: `Call artifacts were validly signed at event time, but current delegated authority is no longer active.`

Bad:
- `Verified agent for Acme Support` with only a hidden warning about revocation

## Restriction conflict policy

If a delegation contains restrictions and the claimed communication purpose conflicts with them:
- the verifier MUST NOT silently ignore the restriction
- live delegated flows SHOULD downgrade to `degraded-trust`
- expanded output SHOULD name the conflicting restriction when safe to display

## Manifest-aware policy

When the verifier is operating from `dgd.fixture_manifest` input:
- undeclared objects SHOULD be ignored or flagged, not silently merged into the trust graph
- a mismatch between manifest-declared `object_type` and actual file content MUST be rejected
- a declared lineage stability violation SHOULD at minimum downgrade test validity and SHOULD usually fail fixture evaluation

## Minimal output diagnostics

Even a CLI-first verifier should emit enough machine-readable detail to explain policy outcomes.
The first output should include at least:
- `decision`
- `resolved_trust_state`
- `signature_valid`
- `event_time_valid`
- `current_time_valid`
- `revocation_status`
- `freshness_status`
- `replay_status`
- `warnings`
- `errors`

## Non-goals for v0.3

This profile does not yet standardize:
- jurisdiction-specific legal trust levels
- identity-proofing vendor requirements
- network revocation distribution design
- advanced probabilistic fraud scoring

## Relationship to other docs

This profile should be read with:
- `docs/protocol/normative-protocol-draft.md`
- `docs/protocol/message-formats.md`
- `docs/protocol/fixture-manifest-profile.md`
- `docs/architecture/reference-verifier.md`
- `docs/mvp/first-demo-flow.md`

It is the operational policy companion to the protocol draft for the first verifier implementation slice.
