# DigiD critique log

This file records one critique pass per meaningful DigiD design or build iteration.
It is the per-iteration critique ledger, separate from `design-feedback-log.md`, which tracks assimilated findings and their disposition.

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
