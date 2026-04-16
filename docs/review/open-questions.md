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
Current leaning after the v0.3 schema tightening:
- start with verifier CLI or minimal local API over static fixtures
- make the first rendered proof a voice-session trust-state demo
- postpone broader adapter work until the fixture and verifier story is coherent

## OQ-005 — How should pseudonymous identities be treated in UX?
How do we keep pseudonymous identities legitimate without misleading receivers into over-trusting or under-trusting them?

## OQ-006 — How should DigiD relate to existing standards?
Should it wrap, extend, or bridge into things like verifiable credentials and media provenance standards later, or stay fully independent at first?

## OQ-007 — What should the first verifier do when event-time and current-time disagree?
Should the default UX be warning-first, hard-fail for live surfaces, or context-dependent by channel and risk level?

## OQ-008 — How opinionated should revocation freshness policy be in v1?
Should DigiD standardize concrete freshness windows by interaction class, or leave them to verifier policy profiles?

## OQ-009 — Should `dgd.communication` be mandatory in every live demo flow?
The current docs now lean yes because it cleanly binds signer, operator, delegation, session, and purpose. If that stays true, the first code slice should model it as a required fixture, not an optional abstraction.

## OQ-010 — Which payload fields must be signable versus merely referenced by digest?
The current v0.3 draft prefers detached content with digests, but the implementation wedge still needs a crisp rule for when summary fields, purpose strings, and UI-rendered trust text are inside or outside the signed payload.

## OQ-011 — Is `dgd.communication` a universal live-flow requirement or only a demo-profile requirement?
The current repo increasingly treats it as the anchor object for live delegated communication. That seems good, but the protocol should decide whether this is a permanent rule for live profiles or just the first implementation choice.

## OQ-012 — What is the fixture manifest contract?
Resolved for the first implementation slice: the verifier should consume a manifest file with dependency order, scenario metadata, and stable-id assertions. Directory conventions may still help humans browse fixtures, but they are not the trust contract.

## OQ-013 — What replay protections are mandatory in the first live-session profile?
Resolved for the first implementation slice: the live-session verifier policy should treat duplicate envelope ids, duplicate sequence numbers within the same scope, sequence regression, and conflicting signer or delegation lineage as replay-sensitive. The exact transport-layer mitigation can evolve later, but verifier behavior is now opinionated enough to implement.
