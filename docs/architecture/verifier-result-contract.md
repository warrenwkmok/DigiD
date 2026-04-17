# DigiD verifier result contract v0.1

## Purpose

The public DigiD repo should expose one portable, local-first verifier result contract for demos and adapter experiments without turning the repo into a hosted trust-decision platform.

This contract exists to keep future adapters from:
- hiding warning states while keeping a positive compact badge
- discarding owner-binding or authority-scope diagnostics
- copying trust banners outside their verified context without degrading the result

## Public-safe boundary

Public-safe in this repo:
- protocol objects and warning-code vocabulary
- reference verifier logic
- fixture manifests and demo scenarios
- local CLI or library exports of verifier result contracts
- local-only presentation guardrail evaluation over exported contracts for adapter experiments and UX honesty checks

Private-boundary candidates outside this repo:
- hosted verifier APIs
- tenant-aware policy administration
- trust-registry operations
- enterprise workflow orchestration
- billing, abuse intelligence, audit operations, and production platform controls

The contract in this doc is intentionally local and transparent. It is not a hosted policy surface.

## Minimum contract shape

A portable verifier result contract SHOULD include:
- `contract_version`
- `verified_at`
- `decision`
- `resolved_trust_state`
- `compact_label`
- `verification_mode`
- `interaction_class`
- `warning_codes`
- preserved check fields for owner binding, authority scope, revocation, freshness, and replay posture
- rendering guardrails that tell adapters what must remain visible

## Required rendering guardrails

Adapters or local demos consuming this contract SHOULD preserve:
- machine-readable warning codes
- owner-binding status and reasons
- authority-scope status and reasons
- revocation, freshness, and replay status

Adapters SHOULD also obey these guardrails:
- expanded verification context is required, not optional
- warning visibility is mandatory whenever warning codes are present
- positive compact labels MUST NOT survive if the warning channel is removed
- live trust surfaces SHOULD treat the result as bound to a verified context, not as a screenshot-safe badge

## Context-loss handling

If a live result is copied, screenshotted, exported, or rendered without its required verification context, the consuming surface SHOULD synthesize:
- `artifact-context-missing`

That warning means the original signature chain may still exist, but the current presentation is no longer the verified live surface DigiD evaluated.

## Platform mismatch handling

If a platform-native identity cannot be bound to the DigiD trust path the adapter is showing, the consuming surface SHOULD synthesize:
- `platform-identity-mismatch`

This keeps adapters honest about Slack handles, messaging accounts, caller ids, and similar platform-native identifiers that DigiD did not itself verify.

## Relationship to the reference verifier

The public reference verifier may export this contract through a local CLI or library API.
The public reference verifier may also apply local presentation guardrails over the exported contract to simulate context loss or platform mismatch in demos.
That remains public-safe because it exposes transparent diagnostics and warning synthesis rules, not tenant-specific hosted policy, adapter orchestration, or operational infrastructure.
