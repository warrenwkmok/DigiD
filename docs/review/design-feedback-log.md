# DigiD design feedback log

This file captures how critique results are fed back into the design.

The point is to prevent critique from becoming dead commentary.
Every meaningful critique should end up in one of these states:
- applied
- planned
- deferred
- rejected with reason
- needs decision

## Entry template

```markdown
## DF-XXX — [short title]
- source: [review file or critique pass]
- date:
- area: protocol | architecture | trust-state UX | privacy | adoption | security
- severity: critical | high | medium | low
- status: applied | planned | deferred | rejected | needs-decision
- summary:
- action taken:
- linked docs:
- notes:
```

## Active entries

## DF-001 — Add normative protocol draft and object resolution order
- source: `review/first-critique.md`
- date: 2026-04-15
- area: protocol
- severity: high
- status: applied
- summary: The object model needs a more normative structure so verifiers know how objects relate and in what order they should be resolved.
- action taken: Added a normative protocol draft with conformance language, required field posture, extension handling, rejection rules, and verifier resolution order. Updated object schemas to align with the resolution model.
- linked docs: `docs/protocol/normative-protocol-draft.md`, `docs/protocol/object-schemas.md`, `docs/architecture/reference-verifier.md`
- notes: The next critique should test whether the current mandatory rules are sufficient for fixture-driven implementation.

## DF-002 — Add key lifecycle and revocation freshness model
- source: `review/first-critique.md`
- date: 2026-04-15
- area: security
- severity: high
- status: applied
- summary: Key compromise, rotation, and revocation freshness are underdefined.
- action taken: Added explicit key lifecycle posture, freshness states, revocation-check metadata, and verifier guidance distinguishing event-time validity from current-time trust.
- linked docs: `docs/protocol/normative-protocol-draft.md`, `docs/protocol/object-schemas.md`, `docs/protocol/message-formats.md`, `docs/protocol/signing-and-provenance.md`, `docs/architecture/reference-verifier.md`
- notes: Threat-model follow-through is still worth doing, but the protocol layer is now concrete enough to build fixtures against.

## DF-005 — Make the first demo prove historical vs current authority cleanly
- source: `review/first-critique.md`
- date: 2026-04-15
- area: protocol
- severity: medium
- status: applied
- summary: A verifier can mislead users if it collapses old valid signatures and live current authority into one trust claim.
- action taken: Updated the first demo flow and verifier concept to require dual evaluation mode and at least one stale-or-revoked comparison case.
- linked docs: `docs/mvp/first-demo-flow.md`, `docs/architecture/reference-verifier.md`, `docs/protocol/message-formats.md`
- notes: This reduces trust overstatement risk before any UI gets built.

## DF-003 — Add verifier UX guidance to prevent trust overstatement
- source: `review/first-critique.md`
- date: 2026-04-15
- area: trust-state UX
- severity: medium
- status: planned
- summary: Trust indicators could imply more certainty than DigiD can really prove.
- action taken: Marked for a dedicated verifier UX guidance document.
- linked docs: `docs/architecture/trust-states.md`, `docs/architecture/reference-verifier.md`
- notes: This should state what the badges do and do not mean.

## DF-004 — Keep first wedge narrow enough for adoption
- source: `review/first-critique.md`
- date: 2026-04-15
- area: adoption
- severity: medium
- status: applied
- summary: Cross-channel ambition is strategically exciting but risky if it dilutes the wedge.
- action taken: The working build loop remains anchored around verifier-first design and the first demo flow around verified agent voice communication.
- linked docs: `docs/mvp/first-demo-flow.md`, `docs/mvp/mvp-definition.md`
- notes: Re-check this after each expansion of scope.

## DF-006 — Tighten schema binding between objects, envelopes, and the demo fixture set
- source: `2026-04-15 DigiD focused build loop`
- date: 2026-04-15
- area: protocol
- severity: high
- status: applied
- summary: The draft had the right shapes, but not enough binding rules to make fixture-driven implementation unambiguous. Schema version examples were also inconsistent.
- action taken: Normalized examples to `schema_version: 0.3`, added concrete channel and action enums, added signer-binding and delegation-purpose constraints, required verification context in envelopes, and mapped the first demo to a specific communication object plus required fixture set.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/message-formats.md`, `docs/mvp/first-demo-flow.md`
- notes: The next best move is to turn these docs into actual JSON fixtures and a tiny verifier pipeline.

## DF-007 — Make the delegated voice demo fixture-driven and lineage-stable
- source: `docs/review/second-critique.md`
- date: 2026-04-16
- area: protocol
- severity: high
- status: applied
- summary: The delegated voice flow needed stronger lineage rules so comparison scenarios prove trust-state changes instead of quietly swapping the whole object graph.
- action taken: Added common object invariants, a minimal fixture profile, stronger envelope binding rules, explicit event payload requirements, fixture filename conventions, and a demo lineage rule centered on a shared `dgd.communication` anchor.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/message-formats.md`, `docs/mvp/first-demo-flow.md`, `docs/architecture/system-architecture.md`
- notes: This slice still needs actual JSON fixtures, but the repo now has a clearer contract for what those fixtures must preserve.

## DF-008 — Centralize verifier policy and replay posture
- source: `docs/review/second-critique.md`
- date: 2026-04-16
- area: security
- severity: high
- status: planned
- summary: Freshness defaults exist, but replay handling, duplicate-envelope behavior, and policy profiles by interaction class are still scattered.
- action taken: Logged for the next design slice.
- linked docs: `docs/protocol/normative-protocol-draft.md`, `docs/protocol/message-formats.md`, `docs/architecture/reference-verifier.md`
- notes: This likely wants a dedicated verifier-policy profile document before code scaffolding starts.

## DF-009 — Add verifier UX guidance that limits trust overstatement
- source: `docs/review/second-critique.md`
- date: 2026-04-16
- area: trust-state UX
- severity: medium
- status: planned
- summary: The protocol is tightening faster than the user-facing trust language, which risks badges saying more than DigiD can truly prove.
- action taken: Logged for a dedicated UX guidance doc covering compact labels, expanded details, warnings, and forbidden claims.
- linked docs: `docs/architecture/trust-states.md`, `docs/architecture/reference-verifier.md`, `docs/mvp/first-demo-flow.md`
- notes: This overlaps with DF-003 and should probably be resolved in the same document.

## DF-010 — Add fixture manifest and verifier policy profiles before code scaffolding
- source: `docs/review/second-critique.md`
- date: 2026-04-16
- area: architecture
- severity: high
- status: applied
- summary: The repo needed one explicit contract for fixture intake and one explicit contract for verifier replay and freshness policy before a first CLI or API could be built cleanly.
- action taken: Added a fixture manifest profile defining dependency order, scenario metadata, lineage stability, and expected outcomes. Added a verifier policy profile centralizing interaction-class defaults, replay checks, duplicate-envelope handling, freshness posture, and downgrade rules. Updated the demo, protocol, and architecture docs to point at both contracts.
- linked docs: `docs/protocol/fixture-manifest-profile.md`, `docs/architecture/verifier-policy-profile.md`, `docs/protocol/message-formats.md`, `docs/mvp/first-demo-flow.md`, `docs/architecture/system-architecture.md`, `docs/architecture/reference-verifier.md`
- notes: This closes two high-value critique gaps and makes the next meaningful slice actual JSON fixtures plus a minimal verifier runner.
