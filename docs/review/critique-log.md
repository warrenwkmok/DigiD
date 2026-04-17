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
