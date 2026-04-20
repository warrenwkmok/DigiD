# DigiD reference verifier concept

## Purpose

The first implementation may be easiest to prove through a reference verifier rather than trying to integrate every channel natively.

The verifier's job is to take DigiD objects and answer:
- is the signature valid?
- is the signing key usable (purpose + lifecycle window + operational status)?
- what kind of identity is this?
- who, if anyone, stands behind it?
- is delegation active?
- is revocation clear?
- is revocation data fresh enough for this use case?
- what trust state should the receiver see?

## Inputs

The verifier should be able to consume:
- a `dgd.fixture_manifest` plus referenced files, or an equivalent explicit manifest-like input contract
- identity objects
- attestation objects
- delegation objects
- a signed communication object
- signed message and event envelopes
- revocation objects if any

## Outputs

The verifier should produce:
- machine-readable verification result
- portable adapter/result contract with rendering guardrails
- user-facing trust summary
- warning list
- error list
- recommended display state
- both event-time and current-time conclusions when they differ

## Minimal verification pipeline

1. load fixture manifest or equivalent dependency contract
2. parse object structure
3. verify sender signature
4. resolve sender identity
5. verify issuer and attestation signatures
6. verify delegation if present
7. check revocation status, freshness posture, and replay policy
8. calculate both historical and current trust state when needed
9. render final summary

## Example user-facing output

- trust state: delegated-agent
- display summary: Verified agent acting for Acme Support
- signature valid: yes
- organization verified: yes
- delegation active: yes
- freshness status: fresh
- warnings: none

## Why this matters

The verifier is the shortest path to making DigiD real.
It turns protocol theory into a testable product experience.

## Likely first implementation shape

A local CLI or library export that accepts a fixture manifest plus JSON objects and returns a verification result plus a portable result contract is enough for the first technical proof of concept.
Hosted verifier services stay outside the current reference implementation scope.

## Reference verifier modes

The first verifier should support:
- `event_time` mode for proving whether an artifact was valid when signed
- `current_time` mode for live trust decisions
- `dual` mode for UX surfaces that need both

That matters for DigiD because a mathematically valid old signature should not silently imply present authority.

## Policy companion

The reference verifier should externalize policy rather than bury it inside ad hoc code paths.
For the first slice, the operative policy contract is `docs/architecture/verifier-policy-profile.md`, and the operative fixture intake contract is `docs/protocol/fixture-manifest-profile.md`.
The operative adapter/result export contract is `docs/architecture/verifier-result-contract.md`.
