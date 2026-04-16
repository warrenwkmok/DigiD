# DigiD design feedback log

This file captures how critique results are fed back into the design.

The point is to prevent critique from becoming dead commentary.
Every meaningful critique should end up in one of these states:
- applied
- planned
- deferred
- rejected with reason
- needs decision

## Entry template

```markdown
## DF-XXX — [short title]
- source: [review file or critique pass]
- date:
- area: protocol | architecture | trust-state UX | privacy | adoption | security
- severity: critical | high | medium | low
- status: applied | planned | deferred | rejected | needs-decision
- summary:
- action taken:
- linked docs:
- notes:
```

## Active entries

## DF-001 — Add normative protocol draft and object resolution order
- source: `review/first-critique.md`
- date: 2026-04-15
- area: protocol
- severity: high
- status: planned
- summary: The object model needs a more normative structure so verifiers know how objects relate and in what order they should be resolved.
- action taken: Marked as a next-step protocol refinement item for the next design slice.
- linked docs: `docs/protocol/object-schemas.md`
- notes: This should likely produce a new protocol draft doc rather than only editing conceptual docs.

## DF-002 — Add key lifecycle and revocation freshness model
- source: `review/first-critique.md`
- date: 2026-04-15
- area: security
- severity: high
- status: planned
- summary: Key compromise, rotation, and revocation freshness are underdefined.
- action taken: Marked as a priority follow-on design item.
- linked docs: `docs/protocol/object-schemas.md`, `docs/threat-model/threat-model.md`
- notes: This should define both object fields and verification-time behavior.

## DF-003 — Add verifier UX guidance to prevent trust overstatement
- source: `review/first-critique.md`
- date: 2026-04-15
- area: trust-state UX
- severity: medium
- status: planned
- summary: Trust indicators could imply more certainty than DigiD can really prove.
- action taken: Marked for a dedicated verifier UX guidance document.
- linked docs: `docs/architecture/trust-states.md`, `docs/architecture/reference-verifier.md`
- notes: This should state what the badges do and do not mean.

## DF-004 — Keep first wedge narrow enough for adoption
- source: `review/first-critique.md`
- date: 2026-04-15
- area: adoption
- severity: medium
- status: applied
- summary: Cross-channel ambition is strategically exciting but risky if it dilutes the wedge.
- action taken: The working build loop remains anchored around verifier-first design and the first demo flow around verified agent voice communication.
- linked docs: `docs/mvp/first-demo-flow.md`, `docs/mvp/mvp-definition.md`
- notes: Re-check this after each expansion of scope.
