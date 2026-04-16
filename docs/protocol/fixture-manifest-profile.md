# DigiD fixture manifest profile v0.3

This document defines the first machine-consumable fixture contract for DigiD.

The goal is to keep the first verifier implementation honest, reproducible, and comparison-friendly.
A fixture set should not rely on directory luck, filename guesses, or hidden object ordering.

## Why this exists

The repo already defines the object graph for the first delegated voice demo.
What was still missing was a signed-graph intake contract that says:
- which files belong to a scenario
- what order they should be resolved in
- which identifiers must stay stable across contrast scenarios
- which fields are allowed to vary between scenarios

Without that, two verifier implementations could appear to support the same demo while silently testing different trust graphs.

## Scope

This profile is for:
- static fixture families checked into the repo
- the first delegated agent voice demo
- future comparison scenarios derived from the same base lineage

This profile is not yet a network transport format.
It is an implementation and test harness contract.

## Manifest object

A manifest should be a JSON document shaped like this:

```json
{
  "manifest_type": "dgd.fixture_manifest",
  "schema_version": "0.3",
  "manifest_id": "dgd:manifest:demo_voice_happy_path_01J...",
  "scenario_id": "demo-voice-happy-path",
  "scenario_class": "delegated-agent-voice",
  "description": "Verified delegated agent voice call for Acme Support",
  "lineage_group": "demo-voice-acme-01",
  "baseline": {
    "scenario_id": "demo-voice-happy-path",
    "must_match_ids": [
      "dgd:identity:org_acme",
      "dgd:identity:agent_01JABC...",
      "dgd:attestation:01JXYZ...",
      "dgd:delegation:01JKLM...",
      "dgd:communication:01JCOMM..."
    ]
  },
  "verification_defaults": {
    "mode": "dual",
    "revocation_max_age_seconds": 300,
    "duplicate_envelope_policy": "warn",
    "replay_policy": "same-subject-sequence-conflict-reject"
  },
  "objects": [
    {
      "role": "organization_identity",
      "object_type": "dgd.identity",
      "path": "fixtures/demo/org.identity.json",
      "required": true,
      "stable_across_lineage": true
    },
    {
      "role": "agent_identity",
      "object_type": "dgd.identity",
      "path": "fixtures/demo/agent.identity.json",
      "required": true,
      "stable_across_lineage": true
    },
    {
      "role": "agent_attestation",
      "object_type": "dgd.attestation",
      "path": "fixtures/demo/agent.attestation.json",
      "required": true,
      "stable_across_lineage": true
    },
    {
      "role": "agent_delegation",
      "object_type": "dgd.delegation",
      "path": "fixtures/demo/agent.delegation.json",
      "required": true,
      "stable_across_lineage": true
    },
    {
      "role": "communication_anchor",
      "object_type": "dgd.communication",
      "path": "fixtures/demo/voice.communication.json",
      "required": true,
      "stable_across_lineage": true
    },
    {
      "role": "session_started_event",
      "object_type": "dgd.event",
      "path": "fixtures/demo/events/voice.session.started.json",
      "required": true,
      "stable_across_lineage": true
    },
    {
      "role": "session_announcement_message",
      "object_type": "dgd.message",
      "path": "fixtures/demo/messages/voice.session.announcement.json",
      "required": true,
      "stable_across_lineage": true
    }
  ],
  "optional_objects": [
    {
      "role": "verification_result",
      "object_type": "dgd.verification_result",
      "path": "fixtures/demo/results/verification.happy-path.json"
    }
  ],
  "allowed_variations": {
    "revoked-delegation": [
      "revocations",
      "verification_defaults.revocation_max_age_seconds",
      "expected_outcome"
    ]
  },
  "expected_outcome": {
    "compact_label": "Verified agent for Acme Support",
    "decision": "allow-with-trust-indicator",
    "resolved_trust_state": "delegated-agent"
  }
}
```

## Required top-level fields

| Field | Required | Notes |
| --- | --- | --- |
| `manifest_type` | yes | Must be `dgd.fixture_manifest` |
| `schema_version` | yes | Current profile: `0.3` |
| `manifest_id` | yes | Stable unique manifest id |
| `scenario_id` | yes | Human-readable scenario key |
| `scenario_class` | yes | For the first slice, usually `delegated-agent-voice` |
| `lineage_group` | yes | Shared group id for comparison scenarios |
| `objects` | yes | Ordered required objects and envelopes |
| `expected_outcome` | yes | Baseline verifier expectation |

## Ordered dependency rules

The `objects` array is authoritative.
The verifier should load and resolve entries in array order.
For the first delegated voice profile, the required order is:
1. organization identity
2. agent identity
3. agent attestation
4. agent delegation
5. communication anchor
6. ordered events and messages
7. optional revocations
8. optional expected verification result

A verifier MUST NOT infer dependency order from filenames alone.

## Lineage stability rules

Comparison scenarios are persuasive only if most of the trust graph stays fixed.

For any manifests sharing the same `lineage_group`:
- `organization_identity`, `agent_identity`, `agent_attestation`, `agent_delegation`, and `communication_anchor` SHOULD keep the same `object_id` unless the scenario explicitly tests object replacement
- `voice.session.started` and `voice.session.announcement` SHOULD keep the same `subject_id`, `conversation_id`, `sender_id`, `operator_id`, and `delegation_id`
- if a scenario changes a stable id, the manifest MUST list that change in `allowed_variations` with a reason
- a verifier test harness SHOULD fail comparison fixtures that drift outside declared variations

## Stable-vs-variable field profile

For the first voice demo lineage, these fields should remain stable across happy-path, stale, and revoked comparison cases:
- organization `object_id`
- agent `object_id`
- attestation `object_id`
- delegation `object_id`
- communication `object_id`
- envelope `subject_id`
- envelope `sender_id` or `actor_id`
- envelope `operator_id`
- envelope `delegation_id`
- communication `purpose`
- communication `channel`

These fields are allowed to vary per scenario when explicitly declared:
- revocation objects and revocation timestamps
- verification-time policy defaults
- envelope timestamps when testing freshness windows
- verification result outputs
- warning and error lists

## Replay-sensitive event profile

For live-session scenarios, the manifest should let the verifier assert ordered event behavior.

Recommended fields for each event entry:
- `sequence_scope`, usually the `conversation_id` or `session_id`
- `expected_sequence`
- `allow_duplicate`, default `false`

If omitted, the first verifier profile should assume:
- event sequence is scoped to `subject_id`
- duplicate `envelope_id` values are invalid
- duplicate `sequence` values within the same scope are replay-suspicious and should be rejected or downgraded by policy

## Path rules

- manifest paths should be repo-relative
- each `path` must resolve to exactly one JSON document
- paths should not be overloaded to imply trust role; use the explicit `role` field instead

## Recommended first fixture layout

```text
fixtures/
  demo/
    manifests/
      voice.happy-path.manifest.json
      voice.delegation-revoked.manifest.json
      voice.revocation-stale.manifest.json
    org.identity.json
    agent.identity.json
    agent.attestation.json
    agent.delegation.json
    voice.communication.json
    events/
      voice.session.started.json
      voice.session.ended.json
      verification.performed.json
    messages/
      voice.session.announcement.json
      voice.recording.manifest.json
    revocations/
      delegation.revoked.json
    results/
      verification.happy-path.json
```

## Verifier contract

The first verifier should support either:
- one manifest file as input, or
- one directory plus an explicitly named manifest file inside it

If a manifest is present, the verifier MUST prefer the manifest contract over directory conventions.

## Failure cases the verifier should detect

A manifest-driven verifier should reject or downgrade when:
- a required role is missing
- the declared `object_type` does not match the loaded JSON
- a role marked `stable_across_lineage` silently changes ids within the same `lineage_group`
- an envelope references ids not present in the manifest object graph
- the expected event ordering conflicts with actual event sequence
- undeclared extra objects alter trust resolution in a way the manifest does not describe

## Relationship to other docs

This profile refines and operationalizes:
- `docs/protocol/object-schemas.md`
- `docs/protocol/message-formats.md`
- `docs/mvp/first-demo-flow.md`
- `docs/architecture/reference-verifier.md`

It should be treated as the implementation contract for the first fixture-driven verifier slice.
