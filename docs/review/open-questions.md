# DigiD open questions

This file holds questions that should not be silently resolved by drift.
These are the design questions most likely to shape the protocol and product boundary.

## OQ-001 — Who can issue strong human attestations?
Should DigiD define a narrow trusted-attestor model early, or stay abstract until later?

## OQ-002 — What counts as enough proof for a verified human?
Should the first product even expose this deeply, or stay more focused on verified agent and organization relationships first?

## OQ-003 — How fresh must verification be?
How should verifiers interpret revocation checks, stale status, offline checks, and cached results?

## OQ-004 — What is the exact first implementation wedge?
Should the first technical proof be:
- verifier API
- verifier CLI
- trust-state UI demo
- voice-session proof of concept

## OQ-005 — How should pseudonymous identities be treated in UX?
How do we keep pseudonymous identities legitimate without misleading receivers into over-trusting or under-trusting them?

## OQ-006 — How should DigiD relate to existing standards?
Should it wrap, extend, or bridge into things like verifiable credentials and media provenance standards later, or stay fully independent at first?
