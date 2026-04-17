# DigiD critique log

This file records one critique pass per meaningful DigiD design or build iteration.
It is the per-iteration critique ledger, separate from `design-feedback-log.md`, which tracks assimilated findings and their disposition.

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
