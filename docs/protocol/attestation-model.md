# DigiD attestation model v0.3

## Purpose

An identity object plus a valid signature is not enough for high trust.
Attestation is the signed statement that says why a receiver should treat that identity as meaningful.

For DigiD, the critical question is not just "was this signed?"
It is:
- who stands behind this identity
- what class of issuer said that
- whether the receiver trusts that issuer class for this use case

## Core rule

Attestation strength is not self-declared by the sender.

A verifier should derive attestation strength from:
- the attestation type
- the issuer identity
- the issuer's relationship to the subject
- receiver trust-anchor policy
- current validity and revocation posture

That means DigiD should not treat a sender-provided field like `trust_level: high` as authoritative.

## Issuer classes

For the first public framework posture, DigiD should distinguish these issuer classes:
- `self`
- `owner`
- `platform`
- `independent-issuer`
- `receiver-pinned-root`

### `self`
- the subject attests to itself
- useful for continuity, not for strong verification

### `owner`
- the controlling human or organization attests to its own agent or subordinate identity
- strong for owner-backed agent identity and delegation
- not equivalent to independent third-party proof of a human or organization

### `platform`
- the platform that hosts, mediates, or administers the account or runtime attests to the subject
- can be meaningful, but trust depends on receiver policy and platform scope

### `independent-issuer`
- a separate trusted party attests to the subject
- this is the strongest path for durable `verified-human` and broader `verified-organization` claims

### `receiver-pinned-root`
- the receiver treats a specific identity as an explicit trust root for its environment
- this is the current v0.3 reference-verifier posture for fixture-driven organization trust

## Trust-tier posture

The first DigiD framework should talk about trust as tiers, not a binary.

Recommended interpretation tiers:
- `self-asserted`
- `owner-asserted`
- `platform-verified`
- `issuer-verified`
- `receiver-anchored`

These are interpretation tiers, not necessarily wire fields.
They tell the verifier and UI how much confidence is being transferred.

### `self-asserted`
- subject controls the key and signs consistently
- no meaningful external backing

### `owner-asserted`
- the controlling human or organization stands behind the subject
- this is the key DigiD posture for org-issued and delegated agents

### `platform-verified`
- a platform says the subject is real or controlled within that platform
- useful, but narrower than a general internet trust claim

### `issuer-verified`
- an independent trusted issuer attests to the subject
- strongest general-purpose verification tier in the framework

### `receiver-anchored`
- the receiver explicitly trusts the root or issuer for its own environment
- powerful and valid, but scope is local to that receiver policy

## Subject classes and appropriate issuer expectations

### Human
- `verified-human` should normally require `independent-issuer` or an explicitly trusted equivalent
- owner-asserted human claims are not enough for strong cross-context verification

### Organization
- `verified-organization` can be satisfied in v0.3 by receiver anchoring
- broader future profiles may allow an independent issuer path for organizations

### Agent
- agents should usually rely on `owner` attestation plus active delegation
- DigiD's core wedge is not "this agent exists"
- it is "this agent is attributable to a real human or organization and is acting under current authority"

## Receiver trust inputs

The verifier must have a receiver-side trust input.

For v0.3 reference posture:
- trusted issuer ids are verifier policy input
- receiver-pinned organization roots are allowed
- sender-supplied trust roots must not be treated as authoritative

For the broader public framework posture:
- receiver trust inputs should be packaged as one of three classes: `local`, `partner`, or `public`
- `local` trust inputs justify receiver-anchored trust only for that receiver's environment
- `partner` trust bundles justify scope-limited shared trust for a named ecosystem, not universal public verification
- `public` trust bundles are the intended path for broadly reusable independent-issuer trust without pretending DigiD already has one global registry

The trust-input distribution profile lives in `docs/architecture/trust-distribution-profile.md`.

Without a receiver trust input, a self-consistent fake ecosystem can still look cryptographically valid.

## Minimal attestation semantics

An attestation should answer:
- who is the issuer
- who is the subject
- what is being asserted
- how long that assertion is valid
- what revocation posture applies
- whether the receiver trusts the issuer class for this claim

In the v0.3 schema, those semantics are primarily carried by:
- `issuer_id`
- `subject_id`
- `attestation_type`
- `verification_state`
- `valid_from`
- `valid_until`
- `status`
- `proof`

## Example interpretations

### Organization attests to its own agent
- useful for `org-issued-agent`
- not enough by itself for `verified-human`
- should transfer owner accountability, not universal reputation

### Receiver pins an organization root
- sufficient in the v0.3 reference verifier to render `verified-organization`
- should be described as receiver-anchored trust, not universal objective truth

### Independent issuer attests to a human
- strongest path for `verified-human`
- should normally be listed in a receiver-adopted public trust bundle before DigiD implies broad public verification

## UX posture

Compact UI should not imply that all attestation paths are equivalent.

Good examples:
- `Org-issued agent for Acme`
- `Receiver-verified organization`
- `Signature valid, issuer not trusted`

Bad examples:
- `Verified` with no indication of who verified what
- `Trusted agent` when only self-asserted continuity exists

## v0.3 release posture

For the current DigiD reference framework:
- owner-backed agent trust is in scope
- receiver-anchored organization trust is in scope
- trust distribution posture is now partially resolved through receiver-managed `local`, `partner`, and `public` bundle classes
- strong general-purpose human verification is still not fully resolved end to end

That means DigiD is strongest today when it says:
- who signed
- under whose authority
- with what current validity

and weaker when it tries to claim universal human verification semantics.
