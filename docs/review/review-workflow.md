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

## Operating principle

The project should not blindly accept every critique, but every critique should be taken seriously enough to either:
- incorporate the change
- explicitly reject it with reasoning
- or defer it with a known tradeoff
