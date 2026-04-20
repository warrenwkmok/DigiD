# DigiD system architecture v0.3

## High-level layers

DigiD should be designed as a portable trust stack.

### 1. Identity layer
Stores identity records, keys, controller relationships, and lifecycle state.

### 2. Attestation and delegation layer
Stores signed attestations and delegations that explain why a verifier should trust a signer and what authority they hold.

### 3. Signing layer
Creates signed DigiD objects, message envelopes, and event envelopes using canonicalized payloads.

### 4. Verification layer
Resolves identity records, checks signatures, checks authority chains, resolves revocation state, and produces a final trust decision.

### 5. Adapter layer
Maps DigiD objects into real communication channels:
- voice
- video
- email
- messaging
- social
- enterprise systems

### 6. UX layer
Displays trust state in a form normal people can interpret quickly and safely.

## Core architectural services

- identity registry
- public key directory
- attestation store
- delegation store
- revocation service
- verification service
- channel adapters
- verifier UI kit / trust indicator spec

## First implementation deployment shape

The first implementation does not need decentralized purity.
A practical v0 can use:
- local fixture and object resolution for the reference verifier
- a local verifier CLI or library export that returns `dgd.verification_result` plus a portable result contract
- thin demo adapters that emit signed events and messages without hosted control planes
- a simple UI surface or CLI that renders trust state

Hosted verifier services, registry operations, tenant-aware policy control, and other operational platform layers should remain outside the current reference implementation scope.

## Minimum reference-verifier responsibilities

A reference verifier should be able to:
1. ingest DigiD objects, messages, and events
2. validate schema by type
3. verify object proofs using resolved keys
4. resolve signer identity and status
5. resolve attestation and delegation chains
6. check revocations and validity windows
7. return a stable verification result object for UIs and logs
8. return a portable result contract that preserves warning visibility and context-binding guardrails for adapters

## Demo-oriented architecture slice

For the first verified agent-human flow, the architecture can stay very small.

### Inputs
- organization identity
- agent identity
- attestation
- delegation
- `dgd.communication`
- `dgd.session`
- `voice.session.started` event
- `voice.session.announcement` message
- optional `dgd.artifact`

### Processing
- verifier loads all referenced objects
- verifier validates signatures and authority chain
- verifier resolves the communication anchor before evaluating envelopes
- verifier resolves the signed session object before sequence and replay checks
- verifier computes trust state and warnings

### Outputs
- `dgd.verification_result`
- compact trust banner text
- expanded trust details payload for UI

## Reference package split for the first code slice

The first implementation should keep these responsibilities separate:

### `packages/protocol`
- object and envelope discriminated unions
- required-field validation
- canonicalization helpers
- event payload digest helpers
- session and artifact lineage validation helpers

### `packages/verifier`
- id graph resolution
- attestation and delegation lookup
- revocation freshness policy
- replay and duplicate-envelope policy
- trust-state derivation

### `fixtures/demo`
- happy-path artifacts
- revoked and stale comparison artifacts
- manifest files describing dependency order, lineage stability, and expected outcomes

### `apps/demo-cli` or equivalent
- compact trust banner rendering
- expanded trust detail rendering
- scenario selection for comparison fixtures

This keeps the protocol reusable even if the first UI is only a CLI.

## Architectural principle

Keep the trust model portable.
Do not hard-code DigiD to one app, one vendor, or one transport.
The core should work the same whether the envelope arrives by API, attachment, QR code, header, or sidecar URL.

## Architecture notes now made explicit

The first reference implementation should treat two docs as hard companions to the core protocol:
- `docs/protocol/fixture-manifest-profile.md` for fixture intake, dependency order, and lineage stability
- `docs/architecture/verifier-policy-profile.md` for freshness, replay, and duplicate-envelope decisions

That keeps protocol meaning separate from verifier policy while still making the first demo reproducible.

## Implementation note

The cleanest next code scaffold is probably:
- `packages/protocol` for types and validation
- `packages/verifier` for trust resolution
- `fixtures/demo/` for the first voice flow artifacts
- `apps/demo-cli/` for renderer experiments

But that code should only begin after the object and envelope definitions are stable enough to stop thrashing.
