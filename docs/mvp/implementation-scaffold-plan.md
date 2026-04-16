# DigiD implementation scaffold plan v0.1

## Purpose

This document turns the current DigiD protocol and demo design into a practical first code scaffold.

The goal is not to overbuild.
The goal is to create the smallest honest implementation shape that can:
- validate fixture objects and envelopes
- resolve trust from a signed object graph
- render compact and expanded verification output
- keep protocol, verifier, fixtures, and demo rendering cleanly separated

## Recommended first scaffold

```text
DigiD/
  packages/
    protocol/
    verifier/
  fixtures/
    demo/
  apps/
    demo-cli/
```

## Why this split

### `packages/protocol`
Owns shape, validation, and canonicalization.
It should not make trust decisions.

### `packages/verifier`
Owns graph resolution, replay checks, freshness checks, delegation checks, and trust-state decisions.
It should not own UI wording beyond machine-readable result output.

### `fixtures/demo`
Owns canonical example objects and contrast scenarios.
It should be treated as the source of truth for the first demo lineage.

### `apps/demo-cli`
Owns rendering experiments.
It should consume verifier output rather than reinvent verification logic.

## Package responsibilities

## `packages/protocol`

### Responsibilities
- discriminated unions for DigiD object families
- discriminated unions for `dgd.message` and `dgd.event`
- required-field validation by type
- object-type and envelope-type parsing
- canonicalization helpers
- `proof` stripping and signable-byte preparation
- payload digest helpers
- session and artifact lineage validation helpers
- event payload registry keyed by `event_type`

### First modules
- `src/types/common.ts`
- `src/types/objects.ts`
- `src/types/envelopes.ts`
- `src/types/events.ts`
- `src/parse/parse-object.ts`
- `src/parse/parse-envelope.ts`
- `src/validate/validate-object-shape.ts`
- `src/validate/validate-envelope-shape.ts`
- `src/validate/validate-lineage.ts`
- `src/crypto/canonicalize.ts`
- `src/crypto/digest.ts`
- `src/index.ts`

### First exported functions
- `parseDigiDObject(input)`
- `parseDigiDEnvelope(input)`
- `validateObjectShape(obj)`
- `validateEnvelopeShape(env)`
- `validateCommunicationLineage(graph)`
- `canonicalizeForProof(value)`
- `digestCanonicalPayload(payload)`

## `packages/verifier`

### Responsibilities
- fixture manifest loading
- graph resolution from ids
- signer/key resolution
- attestation and delegation lookup
- revocation lookup and freshness checks
- session-scope replay and duplicate-envelope checks
- event-time and current-time trust derivation
- machine-readable verification result output

### First modules
- `src/manifest/load-manifest.ts`
- `src/manifest/validate-manifest.ts`
- `src/graph/build-graph.ts`
- `src/graph/resolve-lineage.ts`
- `src/checks/check-signatures.ts`
- `src/checks/check-attestation.ts`
- `src/checks/check-delegation.ts`
- `src/checks/check-replay.ts`
- `src/checks/check-freshness.ts`
- `src/derive/derive-trust-state.ts`
- `src/derive/derive-display-state.ts`
- `src/run/verify-manifest.ts`
- `src/index.ts`

### First exported functions
- `loadFixtureManifest(path)`
- `verifyFixtureManifest(manifestPath, options?)`
- `verifyGraph(graph, options?)`
- `deriveTrustState(result)`
- `deriveCompactBanner(result)`

### First verifier outputs
The verifier should output one stable object containing at least:
- decision
- resolved trust state
- compact label
- warnings
- errors
- signer identity
- operator identity
- delegation status
- event-time result
- current-time result
- freshness status
- replay status
- mismatch flags

## `fixtures/demo`

### Responsibilities
- happy-path delegated voice lineage
- revoked delegation comparison case
- stale revocation comparison case
- missing delegation comparison case
- verified human comparison case
- unverified sender comparison case

### First layout
```text
fixtures/
  demo/
    manifests/
      voice.happy-path.manifest.json
      voice.delegation-revoked.manifest.json
      voice.revocation-stale.manifest.json
      voice.missing-delegation.manifest.json
      voice.verified-human.manifest.json
      voice.unverified-sender.manifest.json
    org.identity.json
    agent.identity.json
    agent.attestation.json
    agent.delegation.json
    voice.communication.json
    voice.session.json
    events/
      voice.session.started.json
      voice.session.ended.json
      verification.performed.json
    messages/
      voice.session.announcement.json
      voice.recording.manifest.json
    artifacts/
      voice.recording.json
    revocations/
      delegation.revoked.json
    results/
      verification.happy-path.json
```

### Fixture rules
- keep one lineage group stable
- vary one important trust condition at a time
- do not silently replace ids across comparison scenarios
- use manifests as the authoritative loader contract

## `apps/demo-cli`

### Responsibilities
- accept manifest path as input
- call verifier package
- print compact trust banner
- print expanded trust detail panel
- show warnings and errors
- compare scenarios side-by-side later if useful

### First commands
- `demo-cli verify fixtures/demo/manifests/voice.happy-path.manifest.json`
- `demo-cli verify fixtures/demo/manifests/voice.delegation-revoked.manifest.json`
- `demo-cli compare fixtures/demo/manifests/voice.happy-path.manifest.json fixtures/demo/manifests/voice.delegation-revoked.manifest.json`

### First CLI output sections
- compact banner
- decision
- sender
- operator
- authority scope
- event-time validity
- current-time validity
- freshness
- warnings
- errors

## Recommended build order

### Slice 1
- initialize repo folders
- add protocol types and shape validators
- add manifest loader and validator

### Slice 2
- add happy-path fixture JSON files
- add graph builder and lineage resolver
- add basic trust derivation for happy path

### Slice 3
- add revoked and stale comparison fixtures
- add replay and freshness checks
- add compact and expanded renderer in CLI

### Slice 4
- add artifact and transcript lineage checks
- add mismatch and degraded-trust outputs
- add side-by-side comparison mode

## First non-goals

Do not do these in the first scaffold:
- live Slack integration
- live voice transport integration
- key issuance service
- decentralized registry network
- full browser UI
- broad media provenance system

The first scaffold only needs to prove the core trust model honestly.

## Testing posture

The first tests should focus on:
- shape validation rejects invalid object families
- manifest resolution order is deterministic
- signer and delegation lineage mismatches are rejected
- replay-sensitive duplicate sequence cases are downgraded or rejected correctly
- event-time versus current-time differences are surfaced correctly
- compact labels follow verifier UX guidance

## Relationship to current docs

This scaffold plan is downstream of:
- `docs/protocol/object-schemas.md`
- `docs/protocol/message-formats.md`
- `docs/protocol/fixture-manifest-profile.md`
- `docs/architecture/system-architecture.md`
- `docs/architecture/reference-verifier.md`
- `docs/architecture/verifier-ux-guidance.md`
- `docs/mvp/first-demo-flow.md`

It should be treated as the handoff layer between protocol design and actual code creation.
