# DigiD critique log

This file records one critique pass per meaningful DigiD design or build iteration.
It is the per-iteration critique ledger, separate from `design-feedback-log.md`, which tracks assimilated findings and their disposition.

## CL-011 - Signing key lifecycle enforcement critique
- date: 2026-04-20
- timestamp: 2026-04-20 02:36 America/Vancouver
- reviewed slice:
  - reference verifier enforcement of signing-key purpose and lifecycle posture
  - portable verifier result contract updates for key lifecycle preservation
- strengths:
  - makes a common real-world failure mode explicit: a signature can verify while a key is no longer usable for live trust decisions
  - reduces adapter badge-laundering risk by requiring key lifecycle fields to remain visible in exported results
  - tightens semantics around `keys[].status` vs `not_before`/`expires_at` so event-time validity and current-time trust are not silently collapsed
- concerns:
  - without a signed `revoked_at` timestamp, `status: revoked` remains an operational signal rather than historical proof; the protocol should avoid implying otherwise until a key event model exists
  - too many lifecycle sub-states could clutter UX; compact badges must keep lifecycle detail in warnings/debug views
- recommended changes:
  1. keep key lifecycle outputs stable and machine-readable (status + reasons) so adapters cannot "reinterpret" them
  2. add a signed key revocation timing model (object or event) only when the public/private boundary is clear and fixture-driven validation exists
  3. keep issuer consoles, key recovery workflows, and operational revocation distribution private-boundary candidates outside this repo

## CL-010 - Cryptosuite disclosure and verifier enforcement critique
- date: 2026-04-19
- timestamp: 2026-04-19 23:28 America/Vancouver
- reviewed slice:
  - v0.3 cryptographic suite disclosure policy across protocol docs
  - reference verifier enforcement of key algorithm disclosure and mismatch rejection
  - verifier UX guidance for keeping cryptographic details out of compact trust labels
- strengths:
  - reduces algorithm-confusion risk by making the reference verifier reject mismatched or undisclosed key algorithms instead of silently "trying" to verify
  - clarifies where algorithm disclosure lives (signed key records + signed digest prefixes + enforced proof fields) so verifiers do not need to guess
  - keeps UX honest by explicitly separating trust-state rendering from cryptographic implementation details
- concerns:
  - the repo still uses a simplified canonicalization implementation; protocol wording should stay honest about the exact v0.3 canonicalization profile before multi-language implementations diverge
  - future crypto agility work can quickly become standards and compatibility churn; it should stay receiver-controlled and policy-driven
- recommended changes:
  1. decide whether to publish a stricter JCS compliance profile (or restricted JSON constraints) before encouraging other language implementations
  2. keep multi-suite support out of v0.3 until downgrade resistance and suite policy UX are explicit
  3. continue treating hosted key management, issuer consoles, and assurance tooling as private-boundary work before implementation

## CL-009 - Delegation purpose-conflict critique
- date: 2026-04-18
- timestamp: 2026-04-18 14:20 America/Vancouver
- reviewed slice:
  - reason-specific authority-scope warning copy in the reference verifier
  - signed `voice.delegation-purpose-conflict` fixture family and audited manifest coverage
  - protocol and UX wording that keeps `delegation-scope-conflict` machine-readable while preserving purpose/channel/action specificity in rendered copy
- strengths:
  - sharpens DigiD's core communications-trust claim by showing not only that authority failed, but how it failed
  - adds the missing audited negative fixture that earlier critique and red-team passes were already pointing at
  - improves product expression without exploding the warning-code vocabulary or drifting into private policy tooling
- concerns:
  - the verifier now has a public-safe way to distinguish purpose, channel, and action conflicts, but richer restriction taxonomies could still spiral into customer-specific policy logic if expanded carelessly
  - compact copy should stay constrained to clearly derivable cases; ambiguous multi-reason conflicts should remain generic
- protocol concerns:
  - the machine-readable warning code should stay `delegation-scope-conflict`; protocol portability would get worse if every scope subtype became a new top-level warning slug
  - signed inputs should remain the only source for reason-specific downgrade wording
- adoption concerns:
  - this makes the voice wedge more legible for real receivers because `purpose not delegated` is much easier to reason about than a generic scope failure
  - future enterprise delegation policy consoles or workflow authoring remain private-boundary work and should not be inferred from this public-safe improvement
- recommended changes:
  1. keep scope-conflict subtyping limited to diagnostics and copy derived from signed inputs
  2. add a second audited scope-conflict variant only if it proves a materially different trust decision, not just a new string
  3. keep delegation authoring, customer-specific restriction catalogs, and operational policy workflows private before implementation

## CL-008 - Verified organization trust-state critique (pinned trust roots)
- date: 2026-04-18
- timestamp: 2026-04-18 12:54 America/Vancouver
- reviewed slice:
  - `verified-organization` trust state resolution in the reference verifier
  - `message.verified-organization` fixture manifest for org-signed async communications
  - receiver-facing UX guidance clarifying `issuer not trusted` as a policy/trust-root gap
- strengths:
  - makes "verified organization" executable and regression-tested instead of staying as aspirational prose
  - keeps the trust model honest by requiring an explicit receiver-side anchor (pinned org id), rather than trusting self-asserted identity metadata
  - broadens the demo wedge from voice-only to a second channel class without adding hosted services or policy surfaces
- concerns:
  - pinning an org identity is a powerful receiver policy act; any future UI/workflow around acquiring or managing pinned roots is boundary-sensitive and should not drift into the public repo as a hosted trust registry
  - the verifier should remain explicit that `issuer not trusted` is not "signature failed" and should avoid UI language that implies the issuer is objectively untrustworthy (it is unanchored)
- protocol concerns:
  - do not let `verification_state` fields become an input to verifier trust-state rendering; the trust-state must remain derived from signed lineage + explicit trust-root policy
  - org-signed communications should remain compatible with delegated-agent flows and should not weaken the "under whose authority" question for org-issued agents
- recommended changes:
  1. keep pinned trust roots as local verifier policy input; never accept them from sender-provided manifests in real deployments
  2. keep issuer discovery, trust-root administration, and trust registry operations private before implementation
  3. ensure compact UX wording clearly distinguishes "unanchored" from "invalid"

## CL-007 - Trusted issuer anchors and org-issued agent trust-state critique
- date: 2026-04-18
- timestamp: 2026-04-18 00:55 America/Vancouver
- reviewed slice:
  - `verification_defaults.trusted_issuer_ids` allowlist for fixture manifests
  - `issuer-untrusted` warning and the `voice.issuer-untrusted` regression scenario
  - explicit `org-issued-agent` trust state for organization-backed agents
- strengths:
  - directly addresses the fake authenticated agent ecosystem failure mode: signature consistency is no longer treated as equivalent to issuer-backed trust
  - keeps the public demo honest by forcing trust-root decisions to be explicit in the manifest instead of implicitly trusting self-asserted `verification_state`
  - improves product expression by separating org-issued agent from generic authenticated/verified agent language
- concerns:
  - `trusted_issuer_ids` is a demo harness input; it must not drift into a public hosted trust registry or policy-admin surface
  - the warning vocabulary should remain small; issuer trust should not turn into a sprawling reason-code taxonomy in the public repo
  - the "who is trusted?" question is now front-and-center and must be treated as a boundary-sensitive product decision
- protocol concerns:
  - issuer trust is a policy input, not something the signature chain can self-assert; the verifier must keep rejecting self-contained ecosystems even if they look internally coherent
  - `org-issued-agent` should remain a trust-state classification derived from authority + issuer trust, not a field agents can "declare"
- adoption concerns:
  - this makes the voice demo more believable in a real receiver environment: if the receiver has not anchored the issuer, the UI degrades instead of showing a strong badge
  - future enterprise issuance/trust-root workflows likely belong in private commercial tooling before implementation
- recommended changes:
  1. keep `trusted_issuer_ids` as the only public trust-anchor input for fixtures; do not add registry operations to the public repo
  2. treat future issuer discovery, revocation distribution, and trust-root administration as private-boundary candidates
  3. add a short UX note that "issuer not trusted" is about receiver policy, not signature failure

## Status
- applied in this iteration:
  - trusted issuer anchors in fixture manifests
  - issuer trust enforcement in the reference verifier
  - explicit org-issued agent trust state
- deferred to next loops:
  - any trust registry operations or issuer administration workflows

## CL-006 - Adapter evidence contract critique
- date: 2026-04-18
- timestamp: 2026-04-18 00:10 America/Vancouver
- reviewed slice:
  - local `dgd.adapter_evidence` contract
  - fixture-backed voice presentation evidence
  - demo CLI `present-evidence` and `present-audit` flows
- strengths:
  - DigiD now turns presentation mismatch and context-loss states into reproducible local fixtures instead of leaving them as demo-only flags
  - the new slice keeps the core verifier result separate from adapter-local evidence, which is the right line for public-safe adapter experimentation
  - presentation expectations are now auditable, so adapter honesty can regress visibly without any hosted conformance service
- concerns:
  - the evidence shape must stay minimal or it will drift into a channel-specific policy matrix
  - one voice-sidecar profile is enough for now; the public repo should resist growing multiple adapter contracts before the current one proves stable
  - later commercial profiles may still need a stronger signed or countersigned platform-binding primitive, but that should not be smuggled into this local evidence contract by drift
- protocol concerns:
  - keeping adapter evidence outside the signed DigiD object model avoids overstating what the protocol itself currently proves
  - future signed platform-binding work, if any, should be introduced deliberately as a separate protocol decision rather than leaking in through presentation fixtures
- adoption concerns:
  - the new fixture-backed evidence loop makes voice, Slack, email, and transcript adapter experiments more reproducible without crossing into real adapter runtime code
  - the next public-safe step should stay focused on one bounded adapter profile and local conformance, not hosted adapter APIs
- recommended changes:
  1. keep adapter evidence v0.1 limited to context and binding status, not richer business rules
  2. use fixture-backed presentation audit before adding any second adapter family
  3. move any hosted adapter conformance or tenant-aware rendering workflow private before implementation

## Status
- applied in this iteration:
  - local adapter evidence contract
  - fixture-backed presentation audit loop
- deferred to next loops:
  - any signed platform-binding primitive
  - any hosted adapter conformance surface

## CL-005 - Local presentation guardrail critique
- date: 2026-04-17
- timestamp: 2026-04-17 13:35 America/Vancouver
- reviewed slice:
  - local presentation guardrail evaluator over portable verifier contracts
  - demo CLI `present` mode for platform mismatch and context-loss simulation
  - public/private boundary restatement for adapter-facing warning synthesis
- strengths:
  - DigiD now makes adapter-facing honesty checks executable without polluting core signature verification with unsigned presentation metadata
  - `platform-identity-mismatch` and `artifact-context-missing` are now demoable behaviors instead of only aspirational warning codes in docs
  - the slice preserves the public moat by staying inside local library and CLI ergonomics rather than adding a hosted adapter decision API
- concerns:
  - presentation guardrails still depend on manually supplied mismatch/context inputs rather than a standardized per-adapter evidence contract
  - compact-label degradation logic is intentionally small and may need profile-specific wording rules later
  - the public repo should stop before adding multi-tenant presentation services, hosted adapter conformance pipelines, or policy-admin consoles
- protocol concerns:
  - the core verifier result remains cleanly separated from unsigned presentation evidence, which is the right architectural split for now
  - future adapter profiles still need one bounded evidence schema so mismatch states are reproducible across channels
- adoption concerns:
  - local presentation simulation makes Slack-, voice-, email-, and transcript-surface experiments more honest before any real adapter code lands
  - the next public-safe step should be evidence-shape design or a narrow fixture-backed adapter profile, not hosted runtime surfaces
- recommended changes:
  1. define a minimal adapter evidence contract before channel-specific simulation gets more complex
  2. keep presentation guardrail execution local-only in the public repo
  3. move any hosted adapter decision APIs or enterprise presentation workflows to a private repo before implementation

## Status
- applied in this iteration:
  - local presentation guardrail evaluation
  - executable platform-mismatch and context-loss simulation
- deferred to next loops:
  - adapter evidence contract shape
  - any real hosted adapter runtime

## CL-003 - Portable verifier contract and isolated owner-binding mismatch critique
- date: 2026-04-17
- timestamp: 2026-04-17 10:05 America/Vancouver
- reviewed slice:
  - portable verifier result contract
  - local CLI export mode
  - isolated owner-binding mismatch fixture family
  - public/private boundary restatement in architecture docs
- strengths:
  - the reference verifier now exports a machine-readable contract that future adapters can consume without losing owner-binding, scope, replay, or freshness posture
  - the new owner-binding mismatch scenario isolates a real trust failure without depending on missing-object errors or broad fixture breakage
  - the slice adds adoption-facing implementation value while staying local-first and public-safe rather than drifting into a hosted verifier service
- concerns:
  - the contract currently tells adapters to synthesize context-loss and platform-mismatch warnings, but it does not yet prove those flows through dedicated adapter-profile fixtures
  - the public repo still has to stop short of tenant-aware policy administration or hosted decision APIs even if the contract becomes richer
  - the generator now knows about the new fixture family, but the current dirty worktree prevented a full regeneration pass this iteration
- protocol concerns:
  - warning-code vocabulary is now more complete, but channel-specific mismatch evidence binding is still profile work rather than a resolved core rule
  - result-contract guardrails should remain thin and portable instead of becoming a policy-engine substitute
- adoption concerns:
  - the export contract makes adapter experimentation more realistic, especially for Slack- or voice-sidecar surfaces
  - the next slice should either prove mismatch/context-loss rendering through fixtures or stop before the public repo grows service-shaped interfaces
- recommended changes:
  1. add one explicit platform-mismatch or context-loss fixture path before any real adapter code appears in this repo
  2. keep result-contract evolution local-first and transparent, not tenant-aware or hosted
  3. re-evaluate the commercial boundary before any adapter profile starts looking like deployable enterprise workflow code

## Status
- applied in this iteration:
  - portable verifier result contract
  - isolated owner-binding mismatch scenario
- deferred to next loops:
  - platform-mismatch fixtures
  - any hosted or tenant-aware verifier surface

## CL-004 - Audited manifest expectations and runtime-banner critique
- date: 2026-04-17
- timestamp: 2026-04-17 12:43 America/Vancouver
- reviewed slice:
  - runtime compact-banner derivation
  - manifest expectation matching
  - local audit command across the demo manifest suite
  - owner-binding mismatch expectation coverage
- strengths:
  - the verifier now derives its own compact banner from runtime warnings and trust state instead of inheriting the answer from fixture metadata
  - the checked-in manifests became a real regression suite that asserts warning codes and key verifier checks, not just human-readable scenario intent
  - the owner-binding mismatch path is now continuously audited as part of the public-safe suite
- concerns:
  - delegation-scope conflict still lacks equivalent audited negative-fixture coverage
  - adding new signed negative fixtures still depends on settling a cleaner demo-key authoring strategy
  - the audit command should stay local tooling rather than drift toward a hosted regression or verification service in the public repo
- protocol concerns:
  - manifest expectations are now strong enough to catch verifier drift, but they should stay tied to reference-verifier behavior rather than balloon into adapter- or tenant-specific policy matrices
  - result-contract and manifest expectations now overlap more deliberately, so both contracts need to stay aligned
- adoption concerns:
  - local audit output makes future adapter experiments safer because trust-label drift becomes visible immediately
  - this still does not prove platform-mismatch or context-loss rendering in any real channel surface
- recommended changes:
  1. add a scope-conflict negative fixture once the public-safe signed-fixture authoring path is chosen
  2. keep portable result contracts and manifest expectations aligned before any adapter-side rendering work
  3. stop before this audit surface turns into a hosted regression or trust-decision platform

## Status
- applied in this iteration:
  - audited manifest suite
  - runtime-derived compact banner validation
- deferred to next loops:
  - scope-conflict fixture coverage
  - deterministic demo-key strategy for new signed negative variants

## CL-001 - Verifier-first MVP implementation critique
- date: 2026-04-16
- timestamp: 2026-04-16 20:05 America/Vancouver
- reviewed slice:
  - runnable protocol package
  - verifier package
  - signed demo fixtures
  - demo CLI
- strengths:
  - the repo now proves the core DigiD wedge with working delegated-agent, verified-human, stale, revoked, and unverified comparisons
  - event-time versus current-time trust differences are visible in a concrete flow instead of only being described in prose
  - the first implementation stays disciplined around the verifier-first architecture instead of prematurely branching into adapters
- concerns:
  - the verifier is still fixture-local and does not yet model a real registry, issuance path, or revocation distribution channel
  - result derivation is intentionally narrow and should be refactored once more object families and adapters appear
  - review roles are documented and logged, but not yet automated as standalone runtime agents
- protocol concerns:
  - the current implementation validates a practical subset of the v0.3 draft, not the full draft surface
  - future adapter profiles will likely force stricter schema modularization and richer mismatch handling
- adoption concerns:
  - the product is now believable as a verifier demo, but not yet as an enterprise integration surface
  - the next slice needs either a minimal verifier API or one concrete adapter sidecar so the project keeps moving toward commercial deployment
- recommended changes:
  1. add a small local verifier API over the same manifest and graph pipeline
  2. externalize the trust-derivation rules into clearer policy/profile modules before adapter work starts
  3. decide when critique and red-team roles become actual automated agents instead of log-maintained reviewer roles

## Status
- applied in this iteration:
  - working verifier MVP
  - critique log artifact
- deferred to next loops:
  - verifier API
  - runtime review agents

## CL-002 - Verifier policy extraction and owner-binding enforcement critique
- date: 2026-04-17
- timestamp: 2026-04-17 00:00 America/Vancouver
- reviewed slice:
  - verifier policy extraction
  - delegated owner-binding enforcement
  - CLI diagnostics for owner binding and authority scope
- strengths:
  - the public reference verifier now matches the protocol's delegated-agent trust claim more honestly by requiring an executable owner-binding chain
  - policy logic is less entangled with manifest loading, which makes the next public-safe verifier work easier to reason about
  - CLI output now shows why a result is degraded without inventing stronger trust language than the verifier actually proved
- concerns:
  - the repo still lacks a signed negative fixture that isolates owner-binding failure without collapsing into broader missing-object errors
  - policy is extracted, but it is not yet configurable as a profile matrix across future surfaces or adapters
  - the next API step is now a boundary-sensitive product choice because a hosted verifier surface would begin overlapping private commercial territory
- protocol concerns:
  - action and scope evaluation remains intentionally small and tied to the current live voice wedge
  - richer restriction and mismatch handling should wait for concrete adapter profiles rather than expanding the public demo into pseudo-production policy code
- adoption concerns:
  - this slice improves trust honesty, but it still does not prove how platform mismatch states should render on Slack, voice gateways, or enterprise messaging surfaces
  - if the next iteration builds an API, it should stay local/demo-only unless the work intentionally moves to a private repo
- recommended changes:
  1. add one deterministic negative fixture path for owner-binding or scope-conflict cases without regenerating the full demo corpus blindly
  2. keep the next public slice limited to local verifier ergonomics or adapter-facing result contracts
  3. stop before implementing any hosted verifier service, registry operations, billing, tenancy, or enterprise policy orchestration in this public repo

## Status
- applied in this iteration:
  - explicit owner-binding and delegation-scope diagnostics
- deferred to next loops:
  - deterministic negative fixtures
  - boundary decision on any future verifier API
