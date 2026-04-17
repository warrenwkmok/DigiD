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
- timestamp: 2026-04-15 22:10 America/Vancouver
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
- timestamp: 2026-04-15 22:10 America/Vancouver
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
- timestamp: 2026-04-15 22:10 America/Vancouver
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
- timestamp: 2026-04-15 20:45 America/Vancouver
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
- timestamp: 2026-04-15 20:45 America/Vancouver
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
- timestamp: 2026-04-15 22:10 America/Vancouver
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
- timestamp: 2026-04-16 15:35 America/Vancouver
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
- timestamp: 2026-04-16 15:35 America/Vancouver
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
- timestamp: 2026-04-16 15:35 America/Vancouver
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
- timestamp: 2026-04-16 15:35 America/Vancouver
- area: architecture
- severity: high
- status: applied
- summary: The repo needed one explicit contract for fixture intake and one explicit contract for verifier replay and freshness policy before a first CLI or API could be built cleanly.
- action taken: Added a fixture manifest profile defining dependency order, scenario metadata, lineage stability, and expected outcomes. Added a verifier policy profile centralizing interaction-class defaults, replay checks, duplicate-envelope handling, freshness posture, and downgrade rules. Updated the demo, protocol, and architecture docs to point at both contracts.
- linked docs: `docs/protocol/fixture-manifest-profile.md`, `docs/architecture/verifier-policy-profile.md`, `docs/protocol/message-formats.md`, `docs/mvp/first-demo-flow.md`, `docs/architecture/system-architecture.md`, `docs/architecture/reference-verifier.md`
- notes: This closes two high-value critique gaps and makes the next meaningful slice actual JSON fixtures plus a minimal verifier runner.

## DF-011 — Normalize event payload schemas and live-session lineage fields
- source: `2026-04-16 DigiD focused build loop`
- date: 2026-04-16
- timestamp: 2026-04-16 14:55 America/Vancouver
- area: protocol
- severity: medium
- status: applied
- summary: Event payload requirements were still prose-heavy, and live-session lineage rules were split across docs, which would make fixture validation and early verifier code drift-prone.
- action taken: Added a machine-readable event payload schema profile, made `conversation_id` mandatory for live-session envelopes, tightened lineage-conflict rules, clarified that `session_id` should align with `conversation_id`, and updated the first demo build order to include typed event-payload validation.
- linked docs: `docs/protocol/message-formats.md`, `docs/protocol/object-schemas.md`, `docs/mvp/first-demo-flow.md`
- notes: This makes the next slice more obviously about actual fixtures and validators instead of more prose tightening.

## DF-012 — Add a standing adversarial red-team reviewer into the DigiD build loop
- source: `2026-04-16 strategy discussion`
- date: 2026-04-16
- timestamp: 2026-04-16 10:40 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: Normal critique alone is not enough for DigiD. The project needs a recurring red-team role that tries to break trust claims, platform assumptions, delegation boundaries, and verifier UX on every meaningful iteration.
- action taken: Added a dedicated red-team brief and updated the review workflow and roadmap so each meaningful design/build slice now expects both a critique pass and an adversarial red-team pass.
- linked docs: `docs/review/red-team-brief.md`, `docs/review/review-workflow.md`, `docs/mvp/repo-roadmap.md`
- notes: Early on, this can remain a doc-defined role. Once the first verifier exists, this should likely become a dedicated agent or workflow with concrete attack-scenario fixtures.

## DF-013 — Add a standing adoption loop into the DigiD build loop
- source: `2026-04-16 strategy discussion`
- date: 2026-04-16
- timestamp: 2026-04-16 10:40 America/Vancouver
- area: adoption
- severity: high
- status: applied
- summary: DigiD needs a recurring adoption loop that tests every meaningful slice against real-world platforms, domain wedges, adapter strategies, and rollout constraints so the design does not drift into demo-only thinking.
- action taken: Added a dedicated adoption-loop brief and updated the review workflow, assimilation rules, and roadmap so each meaningful design/build slice now expects critique, red-team review, and adoption-loop review.
- linked docs: `docs/review/adoption-loop-brief.md`, `docs/review/review-workflow.md`, `docs/review/assimilation-rules.md`, `docs/mvp/repo-roadmap.md`
- notes: This should keep surfaces like Slack, email, voice systems, messaging apps, and media platforms in the active design loop instead of treating them as later speculation.

## DF-014 — Make signable versus digest-bound trust fields explicit
- source: `2026-04-16 DigiD focused build loop`
- date: 2026-04-16
- timestamp: 2026-04-16 15:55 America/Vancouver
- area: protocol
- severity: high
- status: applied
- summary: The v0.3 draft still left too much room for adapters or UIs to blur signed trust-bearing fields with unsigned operational metadata.
- action taken: Added a signed-versus-referenced field contract for envelopes, a communication signing-boundary profile, stronger lineage inheritance rules from `dgd.communication`, and demo guidance that limits the trust banner to signed or verifier-derived fields.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/message-formats.md`, `docs/mvp/first-demo-flow.md`
- notes: This closes a real ambiguity before fixtures and validators get built, and it sharpens what the first protocol package must enforce.

## DF-015 — Make live-session scope and artifact lineage first-class objects
- source: `2026-04-16 DigiD focused build loop`
- date: 2026-04-16
- timestamp: 2026-04-16 15:55 America/Vancouver
- area: protocol
- severity: high
- status: applied
- summary: The draft used session ids and artifact ids across envelopes and demo docs, but did not yet define signed `dgd.session` and `dgd.artifact` objects, which left replay scope and post-call provenance too implicit.
- action taken: Added first-class session and artifact object schemas, tightened envelope rules to resolve signed session lineage for live flows, updated the first demo to require an explicit session object, and extended the architecture notes so protocol and verifier packages treat session and artifact lineage as part of the core contract.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/message-formats.md`, `docs/mvp/first-demo-flow.md`, `docs/architecture/system-architecture.md`
- notes: This makes the next fixture slice more honest because replay scope and recording provenance are now modeled objects instead of hidden assumptions.

## DF-016 — Add verifier UX guardrails and a first concrete Slack adapter concept
- source: `2026-04-16 DigiD resumed build`
- date: 2026-04-16
- timestamp: 2026-04-16 16:20 America/Vancouver
- area: adoption
- severity: high
- status: applied
- summary: DigiD still needed explicit UX guardrails to prevent trust overstatement and a real adapter concept to keep adoption work grounded instead of abstract.
- action taken: Added a verifier UX guidance doc covering compact banners, expanded trust details, warning language, mismatch states, historical-versus-current posture, and forbidden trust claims. Added a Slack adapter concept document that treats Slack as a sidecar verifier surface for org-authorized agent communications rather than a native trust root.
- linked docs: `docs/architecture/verifier-ux-guidance.md`, `docs/architecture/slack-adapter-concept.md`, `docs/mvp/repo-roadmap.md`
- notes: This closes one planned UX gap and gives the adoption loop a concrete platform surface to keep testing against in future DigiD slices.

## DF-017 — Turn the first code path into an explicit scaffold plan
- source: `2026-04-16 DigiD resumed build`
- date: 2026-04-16
- timestamp: 2026-04-16 16:20 America/Vancouver
- area: architecture
- severity: high
- status: applied
- summary: The repo had enough protocol detail to start talking vaguely about code, but still needed one concrete scaffold plan so the first implementation does not blur protocol, verifier, fixtures, and rendering responsibilities.
- action taken: Added an implementation scaffold plan that defines the first repo/package layout, package responsibilities, fixture layout, CLI responsibilities, build order, and initial non-goals for the first honest verifier slice.
- linked docs: `docs/mvp/implementation-scaffold-plan.md`, `docs/mvp/repo-roadmap.md`, `docs/architecture/system-architecture.md`
- notes: This gives the next build loop a cleaner handoff into actual code creation instead of more abstract implementation talk.

## DF-018 — Add an explicit critique pass for the latest DigiD slice and tighten loop cadence
- source: `docs/review/third-critique.md`
- date: 2026-04-16
- timestamp: 2026-04-16 16:20 America/Vancouver
- area: architecture
- severity: medium
- status: applied
- summary: The latest DigiD slice needed an explicit critique artifact, and the current loop cadence was too loose for a fast-moving design/build project.
- action taken: Added a third critique pass covering the latest UX, Slack, and scaffold work. Updated the roadmap and review workflow so active DigiD work now prefers a lightweight hourly build loop with critique coverage instead of waiting for larger, slower cycles.
- linked docs: `docs/review/third-critique.md`, `docs/review/review-workflow.md`, `docs/mvp/repo-roadmap.md`
- notes: The next risk is process bloat, so the hourly loop should stay lightweight and biased toward real build progress.

## DF-019 — Normalize delegated live-envelope purpose and portable warning codes
- source: `2026-04-16 DigiD focused build loop`
- date: 2026-04-16
- timestamp: 2026-04-16 16:51 America/Vancouver
- area: protocol
- severity: high
- status: applied
- summary: Delegated live flows still allowed purpose to drift between payloads and lineage docs, and verifier warnings were not yet normalized enough for adapter portability.
- action taken: Added a top-level `purpose` contract for delegated live envelopes, introduced shared lineage blocks, added a portable warning and reason-code profile, aligned the normative draft with `dgd.session` and `dgd.artifact`, and updated the first demo flow to validate lineage before verifier rendering.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/message-formats.md`, `docs/protocol/normative-protocol-draft.md`, `docs/mvp/first-demo-flow.md`
- notes: This makes the next honest slice more clearly about producing fixtures and validators instead of revisiting envelope semantics again.

## DF-020 — Make signer resolution and ordered live-event scope implementation-safe
- source: `2026-04-16 DigiD focused build loop`
- date: 2026-04-16
- timestamp: 2026-04-16 18:00 America/Vancouver
- area: protocol
- severity: high
- status: applied
- summary: The v0.3 docs still left two implementation hazards: signer identity could be inferred differently by different verifiers, and live-session message/event ordering could drift because sequence expectations were not explicit enough.
- action taken: Added a family-by-family signer-resolution matrix, tightened delegated-signer and artifact-derivation constraints, made ordered live-session events contiguous from sequence `1` in the first fixture profile, clarified that trust-banner messages are non-sequenced but lineage-bound, and updated the first demo build order to validate ordered-event scope explicitly.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/message-formats.md`, `docs/protocol/normative-protocol-draft.md`, `docs/mvp/first-demo-flow.md`
- notes: This should reduce drift before fixture generation and make replay tests more deterministic in the first verifier slice.
