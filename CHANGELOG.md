# DigiD changelog

This changelog tracks meaningful DigiD repo iterations so Master Warren can quickly see what changed, why it changed, and what the next likely move was.

Format notes:
- newest entries first
- each entry maps to one meaningful repo slice
- critique-only observations should be reflected through follow-up design changes, not listed as standalone noise unless they materially changed repo direction

---

## 2026-04-16 — Tighten live delegated envelope lineage and warning portability
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

## 2026-04-16 — Expand review loop and implementation planning
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

## 2026-04-16 — Specify session and artifact lineage as first-class protocol objects
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

## 2026-04-16 — Add fixture manifest and verifier policy profiles
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

## 2026-04-16 — Tighten fixture and envelope profile toward machine-readable validation
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

## 2026-04-16 — Tighten protocol schemas and demo bindings
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

## 2026-04-15 — Tighten protocol resolution and freshness rules
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

## 2026-04-16 — Add critique assimilation loop
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

## 2026-04-16 — Add critique roles and review workflow
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

## 2026-04-15 — Tighten protocol and demo flow from first critique
- commit: `cfd54d8`
- summary:
  - incorporated the first critique into stronger protocol and demo-flow direction
  - reinforced the verifier-first wedge and narrowed the initial product story around verified communications
- changed files:
  - `docs/mvp/first-demo-flow.md`
  - `docs/architecture/reference-verifier.md`
  - related protocol docs
- why it mattered:
  - kept the wedge focused and prevented the repo from drifting into broad identity-infrastructure claims too early
- next likely step at the time:
  - introduce explicit schemas and a clearer first demo contract

## 2026-04-15 — Add protocol schemas and first demo flow
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

## 2026-04-15 — Scaffold product and protocol foundation
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
