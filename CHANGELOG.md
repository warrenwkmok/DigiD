# DigiD changelog

This changelog tracks meaningful DigiD repo iterations so Master Warren can quickly see what changed, why it changed, and what the next likely move was.

Format notes:
- newest entries first
- each entry maps to one meaningful repo slice
- headings use iteration labels instead of dates
- critique-only observations should be reflected through follow-up design changes, not listed as standalone noise unless they materially changed repo direction

---

## Iteration 15 - Externalize verifier policy and enforce owner binding
- date: 2026-04-17
- timestamp: 2026-04-17 00:00 America/Vancouver
- commit: `uncommitted`
- summary:
  - added a dedicated verifier policy module so interaction class, replay posture, freshness defaults, owner-binding checks, and delegation-scope checks are no longer buried in one manifest verifier file
  - made delegated-agent trust require an explicit owner-binding chain in verifier output before the public demo will render high-trust agent posture
  - surfaced owner-binding and authority-scope diagnostics in the demo CLI so degraded trust is explained directly instead of implied by a generic warning badge
  - kept the slice on the public-safe side of the boundary by strengthening reference verifier logic only, while leaving hosted verifier services and operational policy surfaces out of the repo
- changed files:
  - `packages/verifier/src/policy.js`
  - `packages/verifier/src/verify-manifest.js`
  - `packages/verifier/src/display.js`
  - `packages/verifier/src/index.js`
  - `apps/demo-cli/src/index.js`
  - `docs/review/critique-log.md`
  - `docs/review/red-team-log.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
  - `CHANGELOG.md`
- why it mattered:
  - this closes part of the gap between the v0.3 trust model and the runnable verifier by making owner-backed delegated-agent trust explicit instead of mostly documentary
- next likely step at the time:
  - decide the last public-safe verifier surface before any API or adapter work crosses into private hosted-service territory

## Iteration 13 - Ship the verifier-first MVP implementation
- date: 2026-04-16
- timestamp: 2026-04-16 20:05 America/Vancouver
- commit: `uncommitted`
- summary:
  - added a runnable protocol package for canonicalization, shape validation, lineage checks, and Ed25519 signature verification
  - added a verifier package that loads fixture manifests, resolves trust graphs, derives event-time and current-time outcomes, and emits compact trust banners
  - added a demo CLI with `verify` and `compare` commands
  - generated signed demo fixtures for delegated-agent, revoked, stale, missing-delegation, verified-human, and unverified sender flows
  - added dedicated critique and red-team logs so each build iteration leaves review artifacts behind
- changed files:
  - `package.json`
  - `packages/protocol/src/*`
  - `packages/verifier/src/*`
  - `apps/demo-cli/src/index.js`
  - `scripts/generate-demo-fixtures.mjs`
  - `fixtures/demo/*`
  - `README.md`
  - `docs/review/critique-log.md`
  - `docs/review/red-team-log.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
  - `docs/review/review-workflow.md`
- why it mattered:
  - DigiD now has a working local product prototype instead of only a protocol and architecture design corpus
- next likely step at the time:
  - expose the verifier pipeline through a small local API and choose the first concrete adapter surface to bind to it

## Iteration 14 - Tighten delegated agent ownership binding
- date: 2026-04-16
- timestamp: 2026-04-16 20:20 America/Vancouver
- commit: `uncommitted`
- summary:
  - tightened the protocol so delegated agent trust cannot rest on an agent key alone
  - required a verifier-checkable ownership chain from the agent signing key back to the controlling human or organization
  - logged the follow-up design question about whether DigiD should later add a first-class signed key-binding object
- changed files:
  - `docs/protocol/signing-and-provenance.md`
  - `docs/protocol/object-schemas.md`
  - `docs/protocol/normative-protocol-draft.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
  - `CHANGELOG.md`
- why it mattered:
  - this closes a real spoofing gap where a fake standalone agent identity could otherwise look more owner-backed than DigiD had actually proven
- next likely step at the time:
  - enforce owner-binding more explicitly in the verifier implementation and decide whether to model dedicated signed key-binding artifacts

---

## Iteration 12 — Tighten signer resolution and ordered live-event rules
- date: 2026-04-16
- timestamp: 2026-04-16 18:00 America/Vancouver
- commit: `d251f3f`
- summary:
  - added an explicit signer-resolution matrix across DigiD object families so verifiers do not infer different signing identities from the same payload
  - tightened delegated signer alignment and live artifact derivation constraints
  - made ordered live-session events contiguous from sequence `1` in the first fixture-driven profile
  - clarified that `voice.session.announcement` is lineage-bound but intentionally non-sequenced
  - updated the first demo build order to validate ordered event scope before verifier rendering
- changed files:
  - `docs/protocol/object-schemas.md`
  - `docs/protocol/message-formats.md`
  - `docs/protocol/normative-protocol-draft.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/review/design-feedback-log.md`
- why it mattered:
  - removed two major sources of implementation drift right before fixture generation, signer ambiguity and inconsistent event ordering expectations
- next likely step at the time:
  - generate the first happy-path and degraded fixture manifests using the stricter signer and sequence rules

## Iteration 11 — Tighten live delegated envelope lineage and warning portability
- date: 2026-04-16
- timestamp: 2026-04-16 16:51 America/Vancouver
- commit: `422c942`
- summary:
  - tightened delegated live-envelope rules so `purpose` becomes a first-class trust-bearing field
  - introduced shared lineage blocks for delegated authority, session scope, and artifact scope
  - normalized portable warning and reason codes for verifier outputs
  - aligned the normative draft with `dgd.session` and `dgd.artifact`
  - updated the first demo flow so lineage validation is an explicit build step before renderer work
- changed files:
  - `docs/protocol/object-schemas.md`
  - `docs/protocol/message-formats.md`
  - `docs/protocol/normative-protocol-draft.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
- why it mattered:
  - reduced drift risk between communication objects, sessions, envelopes, and verifier warnings before fixture creation begins
- next likely step at the time:
  - create actual happy-path and degraded JSON fixtures plus lineage validators

## Iteration 10 — Expand review loop and implementation planning
- date: 2026-04-16
- timestamp: 2026-04-16 16:20 America/Vancouver
- commit: `20ff198`
- summary:
  - added verifier UX guidance to reduce trust overstatement
  - added a first concrete Slack adapter concept as an adoption test surface
  - added an implementation scaffold plan so the first code slice has explicit package and fixture boundaries
  - added a third critique pass and tightened loop cadence toward lighter hourly progress
- changed files:
  - `docs/architecture/verifier-ux-guidance.md`
  - `docs/architecture/slack-adapter-concept.md`
  - `docs/mvp/implementation-scaffold-plan.md`
  - `docs/mvp/repo-roadmap.md`
  - `docs/review/third-critique.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
  - `docs/review/review-workflow.md`
- why it mattered:
  - turned the repo from protocol-only tightening toward a more executable verifier-first implementation path without yet starting code prematurely
- next likely step at the time:
  - stop adding prose dependencies and produce the first honest fixture family

## Iteration 09 — Specify session and artifact lineage as first-class protocol objects
- date: 2026-04-16
- timestamp: 2026-04-16 15:55 America/Vancouver
- commit: `a2d9c02`
- summary:
  - added explicit `dgd.session` and `dgd.artifact` object schemas
  - tightened message and event rules so signed session lineage resolves replay scope and artifact binding
  - updated the first demo and architecture docs so live-session ordering and post-call provenance are no longer implicit
- changed files:
  - `docs/protocol/object-schemas.md`
  - `docs/protocol/message-formats.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/architecture/system-architecture.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
- why it mattered:
  - made replay boundaries and post-call recording/transcript provenance honest parts of the signed object model instead of hidden assumptions
- next likely step at the time:
  - align the normative draft and fixture plans around the new lineage objects

## Iteration 08 — Add fixture manifest and verifier policy profiles
- date: 2026-04-16
- timestamp: 2026-04-16 15:35 America/Vancouver
- commit: `edc350c`
- summary:
  - created an explicit fixture manifest profile for dependency order, scenario metadata, and lineage stability
  - created a verifier policy profile for freshness defaults, replay posture, duplicate handling, and downgrade rules
  - wired both profiles back into the protocol, architecture, and first demo docs
- changed files:
  - `docs/protocol/fixture-manifest-profile.md`
  - `docs/architecture/verifier-policy-profile.md`
  - `docs/protocol/message-formats.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/architecture/system-architecture.md`
  - `docs/architecture/reference-verifier.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
- why it mattered:
  - gave the repo one intake contract for fixtures and one policy contract for verifier behavior before code scaffolding
- next likely step at the time:
  - normalize event payloads and live-session lineage more tightly so fixtures can be validated machine-readably

## Iteration 07 — Tighten fixture and envelope profile toward machine-readable validation
- date: 2026-04-16
- timestamp: 2026-04-16 14:55 America/Vancouver
- commit: `2e76088`
- summary:
  - normalized event payload requirements into a clearer schema-like profile
  - made `conversation_id` mandatory for live-session envelopes
  - tightened lineage conflict rules and aligned session scope with conversation scope
  - updated the first demo build order to include typed event-payload validation
- changed files:
  - `docs/protocol/message-formats.md`
  - `docs/protocol/object-schemas.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/review/design-feedback-log.md`
- why it mattered:
  - reduced ambiguity before fixture generation and early verifier implementation
- next likely step at the time:
  - add standing review loops and keep feeding critique back into concrete repo changes

## Iteration 06 — Tighten protocol schemas and demo bindings
- date: 2026-04-16
- timestamp: 2026-04-16 14:25 America/Vancouver
- commit: `434765e`
- summary:
  - normalized schema examples around v0.3
  - tightened object constraints, signer binding, and delegation-purpose checks
  - required verification context in envelopes
  - mapped the first demo to a more concrete communication-anchor fixture set
- changed files:
  - `docs/protocol/object-schemas.md`
  - `docs/protocol/message-formats.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/review/design-feedback-log.md`
- why it mattered:
  - made the docs feel more like a buildable verifier contract and less like loose concept notes
- next likely step at the time:
  - add manifest and policy profile contracts, then create real fixtures

## Iteration 05 — Tighten protocol resolution and freshness rules
- date: 2026-04-15
- timestamp: 2026-04-15 22:10 America/Vancouver
- commit: `053c1ef`
- summary:
  - added a normative protocol draft with conformance language and resolution order
  - modeled key lifecycle, revocation posture, freshness states, and dual event-time vs current-time evaluation
  - sharpened signing/provenance rules and verifier expectations
- changed files:
  - `docs/protocol/normative-protocol-draft.md`
  - `docs/protocol/object-schemas.md`
  - `docs/protocol/message-formats.md`
  - `docs/protocol/signing-and-provenance.md`
  - `docs/architecture/reference-verifier.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/review/design-feedback-log.md`
- why it mattered:
  - converted the earliest protocol layer from conceptual structure into something much closer to a real verification pipeline
- next likely step at the time:
  - tighten object, envelope, and demo bindings so fixture-driven implementation becomes unambiguous

## Iteration 04 — Add critique assimilation loop
- date: 2026-04-16
- timestamp: 2026-04-16 11:10 America/Vancouver
- commit: `86f390c`
- summary:
  - added explicit assimilation rules so review findings are not lost as passive commentary
  - established a design feedback log and open-questions loop for controlled protocol evolution
- changed files:
  - `docs/review/assimilation-rules.md`
  - `docs/review/design-feedback-log.md`
  - `docs/review/open-questions.md`
- why it mattered:
  - created a mechanism for making critique cumulative and auditable instead of conversational only
- next likely step at the time:
  - add standing reviewer roles and workflow structure around the loop

## Iteration 03 — Add critique roles and review workflow
- date: 2026-04-16
- timestamp: 2026-04-16 10:40 America/Vancouver
- commit: `84c698b`
- summary:
  - added standing red-team and adoption-loop reviewer roles
  - defined how critique, adversarial review, and adoption review should feed into meaningful DigiD slices
- changed files:
  - `docs/review/red-team-brief.md`
  - `docs/review/adoption-loop-brief.md`
  - `docs/review/review-workflow.md`
  - `docs/mvp/repo-roadmap.md`
  - `docs/review/design-feedback-log.md`
- why it mattered:
  - made the DigiD build loop more deliberate about security pressure-testing and real-world adoption pressure
- next likely step at the time:
  - continue protocol tightening while avoiding process bloat

## Iteration 02 — Add protocol schemas and first demo flow
- date: 2026-04-15
- timestamp: 2026-04-15 20:45 America/Vancouver
- commit: `cc0212e`
- summary:
  - added the first substantial object-schema draft
  - added signed message and event format drafts
  - defined the first demo around verified delegated voice communication
- changed files:
  - `docs/protocol/object-schemas.md`
  - `docs/protocol/message-formats.md`
  - `docs/mvp/first-demo-flow.md`
  - `docs/protocol/signing-and-provenance.md`
- why it mattered:
  - established the first real protocol shape and a concrete product demo wedge
- next likely step at the time:
  - make the protocol normative, define trust resolution order, and model revocation more concretely

## Iteration 01 — Scaffold product and protocol foundation
- date: 2026-04-15
- timestamp: 2026-04-15 18:30 America/Vancouver
- commit: `bc78508`
- summary:
  - created the initial DigiD repo structure and core concept docs
  - defined product thesis, design principles, MVP direction, trust-state framing, and threat/privacy posture
- changed files:
  - `README.md`
  - `docs/vision/*`
  - `docs/mvp/*`
  - `docs/architecture/*`
  - `docs/threat-model/*`
- why it mattered:
  - gave DigiD an initial strategic frame and a place for protocol and product work to accumulate coherently
- next likely step at the time:
  - add actual signable object models and a concrete demo flow
