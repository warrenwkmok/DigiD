# DigiD review workflow

## Purpose

DigiD should not evolve only through enthusiastic design. It should also evolve through structured criticism.

This workflow defines how the project is reviewed after meaningful design or implementation slices.

## When to run the critique pass

Run a critique pass:
- after a meaningful protocol change
- after a new schema draft
- after a new architecture concept
- after a new demo flow is defined
- after a code prototype changes what the protocol appears to guarantee
- at least once per hourly or every-2-hours DigiD build-loop cycle when the project is active

## Reviewer roles

DigiD should use three complementary reviewer roles in the loop:
- a critique agent, focused on product, protocol, trust semantics, privacy, and adoption coherence
- a red-team agent, focused on adversarial abuse, replay, downgrade, delegation abuse, platform mismatch, and trust-overstatement failure modes
- an adoption-loop reviewer, focused on real-world deployment surfaces, platform constraints, adapter strategy, and domain wedge realism

All three roles should run after meaningful design or implementation slices.
When DigiD is in active build mode, use an hourly or every-2-hours loop so review stays current without forcing artificial micro-slices.
The critique pass asks whether the design is coherent and strong.
The red-team pass asks how it breaks in practice.
The adoption-loop pass asks how it lands in real products, platforms, and rollout paths.

## What the reviewer evaluates

### Layer 1: product coherence
- is the project still focused on communications trust?
- is the wedge still sharp?
- is the scope still disciplined?

### Layer 2: protocol integrity
- are objects cleanly separated?
- are semantics precise?
- are signing boundaries clear?
- are attestation and delegation rules coherent?

### Layer 3: security architecture
- are key lifecycle issues handled?
- are revocation and expiry represented clearly?
- are we exposing unsafe trust assumptions?

### Layer 4: privacy and governance
- is the disclosure model sane?
- are there overreach risks?
- is the system forcing unnecessary identity exposure?

### Layer 5: adoption and implementation realism
- is this implementable in stages?
- does the current direction help or hurt adoption?
- is the first demo still the right one?

## Review output template

```markdown
# DigiD critique review

## Reviewed slice
- [what changed]

## Strengths
- ...

## Concerns
- ...

## Security concerns
- ...

## Protocol concerns
- ...

## Privacy and governance concerns
- ...

## Adoption concerns
- ...

## Recommended changes
1. ...
2. ...
3. ...

## Severity summary
- critical:
- high:
- medium:
- low:
```

## Critique assimilation step

A critique pass is not complete until it feeds back into the repo.
A red-team pass is not complete until it feeds back into the repo either.
An adoption-loop pass is not complete until it feeds back into the repo as well.

After each meaningful critique, red-team, or adoption-loop pass:
1. log the resulting items in `design-feedback-log.md` when needed
2. add unresolved strategic questions to `open-questions.md`
3. apply immediate doc changes where the findings clearly improve the design
4. record whether recommendations were applied, planned, deferred, rejected, or escalated for decision
5. if the finding changes what DigiD appears to guarantee on real platforms, revisit the relevant product, protocol, architecture, threat-model, UX, and MVP docs together

## Operating principle

The project should not blindly accept every critique, should not blindly accept every red-team recommendation, and should not blindly chase every adoption idea either, but every meaningful finding should be taken seriously enough to either:
- incorporate the change
- explicitly reject it with reasoning
- defer it with a known tradeoff
- or mark it as needing Master Warren's decision
