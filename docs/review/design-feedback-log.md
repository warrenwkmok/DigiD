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

## DF-035 - Bind delegated signing key in attestation + delegation
- source: `2026-04-20 DigiD 3h loop`
- date: 2026-04-20
- timestamp: 2026-04-20 14:34 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: Delegated communication needs a receiver-checkable, issuer-signed statement of which delegate signing key the attestation and delegation apply to. Without that, "valid signature" can be misinterpreted as sufficient authority even when the issuer intended a different key or when key rotation makes the authority path ambiguous.
- action taken: Added `dgd.attestation.subject_key` and `dgd.delegation.delegate_key` bindings (kid + public-key digest) to the protocol schema docs and demo fixtures, enforced them in the reference verifier for delegated agent flows, exposed `key_binding_status` + `key_binding_reasons` in verifier outputs and portable result contracts, and added an audited negative manifest (`voice.key-binding-mismatch`) proving the downgrade path.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/signing-and-provenance.md`, `packages/verifier/src/policy.js`, `packages/verifier/src/verify-manifest.js`, `packages/verifier/src/contract.js`, `packages/verifier/src/display.js`, `scripts/generate-demo-fixtures.mjs`, `fixtures/demo/manifests/voice.key-binding-mismatch.manifest.json`, `docs/review/open-questions.md`
- notes: This stays in reference scope (protocol semantics + verifier enforcement + fixtures). Issuer key-management workflows, hosted trust services, and enterprise policy engines remain a later implementation phase.

## DF-034 - Require proof cryptosuite disclosure + deterministic demo fixture keys
- source: `2026-04-20 DigiD 3h loop`
- date: 2026-04-20
- timestamp: 2026-04-20 11:35 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: DigiD v0.3 locked the cryptosuite, but proofs did not carry a strict cryptosuite allowlist identifier and fixture regeneration rotated key material each run. That combination makes algorithm-policy enforcement harder to standardize across implementations and makes it awkward to author small signed negative fixtures without unintentionally rewriting the whole fixture corpus.
- action taken: Required `proof.cryptosuite` and enforced a strict v0.3 cryptosuite allowlist in signature verification, surfaced the claimed cryptosuite in verifier crypto diagnostics and portable result contracts, introduced deterministic demo-only Ed25519 fixture keys so fixture regeneration stays stable, and added an audited negative manifest (`voice.cryptosuite-unsupported`) that proves cryptosuite mismatch rejection.
- linked docs: `packages/protocol/src/cryptosuite.js`, `packages/protocol/src/signatures.js`, `packages/verifier/src/verify-manifest.js`, `packages/verifier/src/contract.js`, `packages/verifier/src/display.js`, `scripts/demo-fixture-keys.mjs`, `scripts/generate-demo-fixtures.mjs`, `docs/protocol/signing-and-provenance.md`, `docs/protocol/object-schemas.md`, `docs/protocol/normative-protocol-draft.md`, `docs/review/open-questions.md`
- notes: The demo-only fixture keys are intentionally scoped to local reference fixtures and are not a production key-management pattern.

## DF-033 - Require key encoding disclosure + digest allowlist enforcement
- source: `2026-04-20 DigiD 3h loop`
- date: 2026-04-20
- timestamp: 2026-04-20 08:33 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: DigiD v0.3 already locked the cryptosuite, but implementations could still guess key parsing rules or treat digest prefixes as "best effort". That creates room for encoding confusion, inconsistent verifier behavior across languages, and UI/adapter laundering of crypto mismatches as generic "signature failed".
- action taken: Required `keys[].public_key_encoding = "spki-der-base64"` on identity key records, enforced it in `verifyProof`, centralized v0.3 cryptosuite constants in `packages/protocol`, and added verifier validation for digest-prefix shape and digest algorithm allowlisting.
- linked docs: `packages/protocol/src/cryptosuite.js`, `packages/protocol/src/signatures.js`, `packages/verifier/src/verify-manifest.js`, `docs/protocol/signing-and-provenance.md`, `docs/protocol/object-schemas.md`, `docs/protocol/normative-protocol-draft.md`
- notes: This is still reference-scoped: it is protocol disclosure + verifier enforcement, not issuer key-management tooling or hosted trust policy infrastructure.

## DF-032 - Enforce cryptosuite disclosure and algorithm mismatch rejection
- source: `2026-04-19 DigiD 3h loop`
- date: 2026-04-19
- timestamp: 2026-04-19 23:28 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: DigiD needs explicit, verifier-checkable algorithm disclosure and a strict stance on cryptographic agility. Without that, attackers can exploit algorithm ambiguity, mismatched key metadata, or UI confusion to overstate trust even when signatures are mathematically valid.
- action taken: Tightened `verifyProof` to require key algorithm disclosure and reject any non-`Ed25519` signing keys in the v0.3 profile, exposed a stable cryptosuite identifier plus proof/digest details in verifier checks and portable result contracts, and updated protocol + UX docs to clarify where algorithms are disclosed and how products should treat crypto details in UI.
- linked docs: `packages/protocol/src/signatures.js`, `packages/verifier/src/verify-manifest.js`, `packages/verifier/src/contract.js`, `docs/protocol/signing-and-provenance.md`, `docs/protocol/normative-protocol-draft.md`, `docs/protocol/object-schemas.md`, `docs/architecture/verifier-ux-guidance.md`
- notes: This stays within reference scope as protocol posture + transparent verifier enforcement. Issuer operational key management, trust registry operations, and enterprise policy/assurance tooling remain outside the current implementation scope.

## DF-031 - Preserve scope-conflict specificity in delegated trust output
- source: `2026-04-18 DigiD 3h loop`
- date: 2026-04-18
- timestamp: 2026-04-18 14:20 America/Vancouver
- area: trust-state UX
- severity: high
- status: applied
- summary: DigiD already detected delegation scope conflicts, but the public demo still collapsed purpose, channel, and action failures into one generic "authority out of scope" message and lacked a signed negative fixture proving the most product-relevant case.
- action taken: Added verifier helpers that preserve the primary out-of-scope dimension in warning copy and compact banners, plus a signed `voice.delegation-purpose-conflict` fixture family that exercises a purpose-out-of-scope delegated voice call in the manifest-audited loop.
- linked docs: `packages/verifier/src/policy.js`, `packages/verifier/src/display.js`, `packages/verifier/src/verify-manifest.js`, `fixtures/demo/manifests/voice.delegation-purpose-conflict.manifest.json`, `docs/architecture/verifier-ux-guidance.md`, `docs/protocol/message-formats.md`
- notes: This remains reference-scoped because it is still transparent verifier logic, protocol wording, and local fixture coverage. Enterprise policy authoring, customer-specific restriction taxonomies, and delegated workflow administration remain outside the current implementation scope.

## DF-030 - Add verified organization trust state via pinned trust anchors
- source: `2026-04-18 DigiD 3h loop`
- date: 2026-04-18
- timestamp: 2026-04-18 12:54 America/Vancouver
- area: trust-state UX
- severity: high
- status: applied
- summary: The repo claimed a `verified-organization` trust state, but the reference verifier could not render it and had no fixture coverage for org-signed communications. That risked collapsing org identity into generic "authenticated agent" thinking and leaving receiver-facing org trust ambiguous.
- action taken: Added `verified-organization` resolution to the reference verifier, gated on receiver-side trust anchoring (pinned org id in `trusted_issuer_ids`). Added a manifest-audited async message fixture (`message.verified-organization`) so org-signed communications are exercised in the same regression loop as delegated voice cases.
- linked docs: `packages/verifier/src/verify-manifest.js`, `fixtures/demo/manifests/message.verified-organization.manifest.json`, `docs/architecture/trust-states.md`, `docs/architecture/verifier-ux-guidance.md`
- notes: This stays reference-scoped by treating trust roots as local verifier policy input only. Issuer discovery, trust-root administration workflows, and any hosted trust registry operations remain outside the current implementation scope.

## DF-029 - Require trusted issuer anchors for high-trust states
- source: `2026-04-18 DigiD 3h loop`
- date: 2026-04-18
- timestamp: 2026-04-18 00:55 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: A self-consistent signature chain can still be a fake authenticated ecosystem unless verifiers have an explicit notion of which issuers they trust. The public demo needed a minimal, fixture-safe way to model issuer trust without building a trust registry.
- action taken: Added `verification_defaults.trusted_issuer_ids` to the fixture manifest profile and enforced it in the reference verifier. Introduced the `issuer-untrusted` warning and a new `voice.issuer-untrusted` fixture manifest to keep this failure mode regression-tested. Also split the product-facing trust chip into an explicit `org-issued-agent` state instead of collapsing it into generic “verified agent”.
- linked docs: `packages/verifier/src/verify-manifest.js`, `packages/verifier/src/display.js`, `fixtures/demo/manifests/voice.issuer-untrusted.manifest.json`, `docs/protocol/fixture-manifest-profile.md`, `docs/protocol/normative-protocol-draft.md`, `docs/architecture/trust-states.md`
- notes: This stays reference-scoped because it is a local policy input and fixture harness contract, not a hosted trust registry, tenant policy console, or enterprise integration layer.

## DF-028 - Standardize a local adapter evidence contract before any channel profile grows
- source: `2026-04-18 DigiD 3h loop`
- date: 2026-04-18
- timestamp: 2026-04-18 00:10 America/Vancouver
- area: architecture
- severity: high
- status: applied
- summary: DigiD could already synthesize `platform-identity-mismatch` and `artifact-context-missing`, but the trigger path still depended on manual CLI flags instead of a bounded fixture-backed adapter evidence shape.
- action taken: Added a local `dgd.adapter_evidence` contract, fixture-backed presentation evidence files, a `present-evidence` flow, a `present-audit` regression pass, and architecture updates that keep adapter evidence explicitly local-only and separate from signed protocol objects.
- linked docs: `packages/verifier/src/presentation.js`, `packages/verifier/src/contract.js`, `apps/demo-cli/src/index.js`, `fixtures/demo/presentation/*.json`, `docs/architecture/adapter-evidence-contract.md`, `docs/architecture/verifier-result-contract.md`, `README.md`
- notes: This remains reference-scoped because the contract is still transparent local evidence over exported verifier output, not a hosted adapter decision service, tenant policy engine, or new production trust object.

## DF-027 - Make adapter-facing mismatch and context-loss guardrails executable locally before any public adapter code appears
- source: `2026-04-17 DigiD 3h loop`
- date: 2026-04-17
- timestamp: 2026-04-17 13:35 America/Vancouver
- area: architecture
- severity: high
- status: applied
- summary: DigiD already documented `platform-identity-mismatch` and `artifact-context-missing`, but they were still advisory prose in the portable contract instead of an executable reference demo surface.
- action taken: Added a local presentation guardrail evaluator over exported verifier contracts, exposed it through a narrow demo CLI `present` mode, and tightened docs so mismatch/context-loss simulation stays local-first rather than drifting into a hosted adapter decision API.
- linked docs: `packages/verifier/src/presentation.js`, `packages/verifier/src/contract.js`, `packages/verifier/src/index.js`, `apps/demo-cli/src/index.js`, `docs/architecture/verifier-result-contract.md`, `docs/architecture/verifier-ux-guidance.md`, `README.md`
- notes: This remains reference-scoped because it is transparent library and CLI logic over already-exported verifier contracts. Hosted adapter runtimes, tenant policy controls, registry operations, and enterprise workflow layers still belong outside the current reference scope.

## DF-026 - Make fixture manifests assert runtime verifier behavior instead of loosely describing it
- source: `2026-04-17 DigiD 3h loop`
- date: 2026-04-17
- timestamp: 2026-04-17 12:43 America/Vancouver
- area: architecture
- severity: high
- status: applied
- summary: The verifier still let fixture metadata stand in for part of its own displayed answer, and the existing owner-binding mismatch scenario was not yet enforced as part of an audited runtime contract.
- action taken: Derived compact banners from runtime state, added manifest expectation matching, added a local manifest audit command, expanded manifests with warning and check assertions, and pulled the owner-binding mismatch fixture into the audited suite.
- linked docs: `packages/verifier/src/display.js`, `packages/verifier/src/expectations.js`, `packages/verifier/src/verify-manifest.js`, `apps/demo-cli/src/index.js`, `fixtures/demo/manifests/*.json`, `fixtures/demo/manifests/voice.owner-binding-mismatch.manifest.json`
- notes: This stays reference-scoped because it is still verifier and local demo tooling only. Hosted verification APIs, tenant policy management, trust-registry operations, and regression orchestration services remain outside the current implementation scope.

## DF-025 - Add a portable verifier result contract before any adapter or API surface grows
- source: `2026-04-17 DigiD 3h loop`
- date: 2026-04-17
- timestamp: 2026-04-17 10:05 America/Vancouver
- area: architecture
- severity: high
- status: applied
- summary: DigiD needed one bounded, machine-readable verifier result contract so future adapters preserve warning visibility, owner binding, scope diagnostics, and context-binding rules without the reference repo drifting into a hosted verifier product.
- action taken: Added a local-first verifier result contract export, preserved owner-binding and authority-scope reason fields in verifier output, added an isolated owner-binding mismatch fixture family, and documented result-contract guardrails plus current reference-scope limits around hosted verifier and policy surfaces.
- linked docs: `packages/verifier/src/contract.js`, `packages/verifier/src/verify-manifest.js`, `apps/demo-cli/src/index.js`, `docs/architecture/verifier-result-contract.md`, `fixtures/demo/manifests/voice.owner-binding-mismatch.manifest.json`
- notes: This remains reference-scoped because the repo still ships transparent verifier logic and local exports only. Hosted verifier services, registry operations, tenant-aware policy control, and enterprise workflow layers remain outside the current implementation scope.

## DF-024 - Externalize verifier policy and make delegated owner binding executable
- source: `2026-04-17 DigiD 3h loop`
- date: 2026-04-17
- timestamp: 2026-04-17 00:00 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: The runnable verifier still carried too much policy inline, and delegated-agent trust was not yet explicitly gated on a full owner-binding chain in executable logic.
- action taken: Added a dedicated verifier policy module, made owner-binding and delegation-scope checks first-class result diagnostics, and updated the CLI to surface those states directly.
- linked docs: `packages/verifier/src/policy.js`, `packages/verifier/src/verify-manifest.js`, `packages/verifier/src/display.js`, `apps/demo-cli/src/index.js`
- notes: This remains reference verifier work. Hosted verifier APIs, trust-registry operations, enterprise policy surfaces, and similar operational layers should stay outside the current implementation scope.

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
- action taken: Added explicit key lifecycle posture, freshness states, revocation-check metadata, and verifier guidance distinguishing event-time validity from current-time trust. Followed up by enforcing signing-key purpose and lifecycle posture in the reference verifier and portable verifier result contract.
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

## DF-021 - Build the runnable verifier-first MVP instead of extending design prose again
- source: `2026-04-16 DigiD implementation loop`
- date: 2026-04-16
- timestamp: 2026-04-16 20:05 America/Vancouver
- area: architecture
- severity: high
- status: applied
- summary: The repo had enough protocol and review structure. The next honest move was to ship a runnable verifier-first MVP instead of adding more non-executable design documents.
- action taken: Added a protocol package, verifier package, demo CLI, signed fixture generator, and fixture manifests covering delegated-agent, revoked, stale, missing-delegation, verified-human, and unverified flows.
- linked docs: `README.md`, `packages/protocol/src/*`, `packages/verifier/src/*`, `apps/demo-cli/src/index.js`, `scripts/generate-demo-fixtures.mjs`, `fixtures/demo/manifests/*`
- notes: This is the first slice where DigiD becomes a working product prototype rather than only a design repo.

## DF-022 - Make per-iteration critique and red-team artifacts first-class repo outputs
- source: `2026-04-16 DigiD implementation loop`
- date: 2026-04-16
- timestamp: 2026-04-16 20:05 America/Vancouver
- area: security
- severity: medium
- status: applied
- summary: The review workflow defined critic and red-team roles, but the repo still lacked dedicated per-iteration logs for those passes.
- action taken: Added `docs/review/critique-log.md` and `docs/review/red-team-log.md`, and updated the review workflow so critique and adversarial passes are logged every meaningful implementation slice.
- linked docs: `docs/review/critique-log.md`, `docs/review/red-team-log.md`, `docs/review/review-workflow.md`
- notes: This creates the critique-log and red-team-log structure requested for the active build loop.

## DF-023 - Require delegated agent signatures to bind back to a controlling human or organization
- source: `2026-04-16 DigiD implementation loop`
- date: 2026-04-16
- timestamp: 2026-04-16 20:20 America/Vancouver
- area: security
- severity: high
- status: applied
- summary: An agent key alone should not be enough to imply owner-backed trust. Delegated agent signatures need an explicit, signed ownership chain back to the controlling human or organization so fake standalone agent keys cannot inherit trust by presentation.
- action taken: Tightened the signing, object-schema, and normative protocol docs so delegated-agent trust now requires controller binding, owner-signed attestation, active delegation, and key-to-identity resolution as one coherent chain.
- linked docs: `docs/protocol/signing-and-provenance.md`, `docs/protocol/object-schemas.md`, `docs/protocol/normative-protocol-draft.md`
- notes: The implementation should enforce this more explicitly in verifier output and future key-binding artifacts, not only in docs.

## DF-024 - Add signed key revocation timing posture (non-retroactive by default)
- source: `2026-04-20 DigiD 3h loop`
- date: 2026-04-20
- timestamp: 2026-04-20 05:33 America/Vancouver
- area: protocol
- severity: high
- status: applied
- summary: DigiD needed a verifier-grade way to represent key revocation timing without implying that `keys[].status: revoked` is historical proof or drifting into private key-management tooling.
- action taken: Required `created_at` on `dgd.revocation`, clarified key revocation targeting (`target_object_type: dgd.signing_key`, `target_object_id: <kid>`), and adopted a v0.3 reference verifier posture that treats effective revocation time as `max(revoked_at, created_at)` with an explicit `revocation-backdated` warning when a revocation claims an earlier effective time.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/signing-and-provenance.md`, `docs/protocol/normative-protocol-draft.md`, `docs/review/open-questions.md`
- notes: This stays within reference scope by focusing on signed protocol semantics and verifier behavior, not issuer consoles, compromise workflows, or revocation distribution services.

## DF-025 - Normalize public docs to reference-scope language
- source: `2026-04-20 manual repo cleanup`
- date: 2026-04-20
- timestamp: 2026-04-20 10:20 America/Vancouver
- area: architecture
- severity: medium
- status: applied
- summary: Public-facing docs and review logs had accumulated explicit repo-boundary and monetization-adjacent phrasing that distracted from DigiD's actual protocol/framework content.
- action taken: Reworded architecture docs, changelog entries, open questions, and review logs to use neutral reference-scope language rather than open/closed or repo-separation strategy framing.
- linked docs: `CHANGELOG.md`, `docs/architecture/*`, `docs/review/open-questions.md`, `docs/review/design-feedback-log.md`, `docs/review/critique-log.md`, `docs/review/red-team-log.md`
- notes: Boundary handling remains part of the operating workflow, not the public repo narrative.

## DF-026 - Add issuer-signed key authorization for delegated key rotation overlap
- source: `2026-04-20 DigiD 3h loop`
- date: 2026-04-20
- timestamp: 2026-04-20 17:36 America/Vancouver
- area: protocol
- severity: high
- status: applied
- summary: Delegated key binding makes downgrade behavior deterministic, but it also forces issuers to reissue every attestation/delegation immediately when an agent rotates signing keys. DigiD needs a narrowly-scoped way to bridge key rotation overlap without widening authority.
- action taken: Added optional `dgd.key_authorization` (issuer-signed, delegation-referenced, key-digest bound) and updated the reference verifier to treat it as an alternative binding method for delegated signing keys when `subject_key` / `delegate_key` bindings no longer match due to rotation.
- linked docs: `docs/protocol/object-schemas.md`, `docs/protocol/signing-and-provenance.md`, `docs/protocol/normative-protocol-draft.md`, `docs/review/open-questions.md`
- notes: This stays in reference scope by shipping protocol semantics, verifier logic, and fixtures, while leaving issuer/admin rotation workflows and any registry/policy platform outside this repo.
