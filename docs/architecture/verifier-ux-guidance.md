# DigiD verifier UX guidance v0.1

## Purpose

DigiD trust UX should help a receiver understand authenticity and authority quickly without implying more than DigiD can truly prove.

This document defines the first guardrails for compact trust banners, expanded trust detail views, warnings, and forbidden claims.

## Core UX principles

### 1. Prove authenticity, not truth
DigiD can help answer:
- who signed this
- what type of sender they are
- whether delegation or attestation is valid
- whether current or historical authority is supported

DigiD does **not** prove:
- that message content is true
- that the sender is benevolent
- that the sender is legally authorized beyond the delegation scope shown
- that the surrounding platform account is trustworthy unless explicitly bound and verified

### 2. Compact state first, nuance second
The first thing a user sees should be short and legible.
Detailed trust reasoning should expand below or behind the compact banner.

### 3. Warning language must be plain
Do not hide degraded trust in technical detail panels.
If authority is stale, revoked, mismatched, or incomplete, the compact surface should already communicate caution.

### 4. Never let unsigned context become trust text
Compact trust banners and primary trust chips should be derived only from:
- signed identity display fields
- signed delegation and operator lineage
- signed or digest-bound payload fields allowed by profile rules
- verifier-derived conclusions computed from signed inputs

Unsigned adapter metadata may appear as operational context only.

## Compact trust banner rules

The compact banner should answer:
- who or what is this?
- who stands behind it?
- is there an immediate caution state?

### Allowed compact examples
- `Verified human`
- `Verified organization`
- `Verified agent`
- `Org-issued agent for Acme Support`
- `Delegation no longer active`
- `Verification stale, re-check recommended`
- `Unverified sender`
- `Revoked or disputed identity`

### Compact banner constraints
- keep to one short line where possible
- avoid more than one trust claim in the compact label
- prefer authority clarity over marketing phrasing
- do not mention cryptographic details in compact form unless needed for a warning

## Expanded detail view rules

Expanded views may include:
- display name
- sender class
- organization or operator
- delegation scope
- allowed channel or purpose
- signature validity
- event-time result
- current-time result
- freshness posture
- warning list
- verifier mode
- cryptography details only in advanced/debug views (for example a single "crypto suite" line), or when explaining an explicit rejection such as an unsupported algorithm

Expanded views should distinguish clearly between:
- signed facts
- verifier conclusions
- unsigned operational context

### Suggested expanded sections

#### Identity
- sender: Acme Support Agent 01
- sender class: agent
- operator: Acme Support

#### Authority
- delegation: active
- channel scope: voice
- purpose: support follow-up

#### Verification
- signature: valid
- event-time validity: valid
- current-time validity: valid
- freshness: fresh

#### Warnings
- none

## Warning language guidance

### Preferred warning styles
- `Delegation no longer active`
- `Verification stale, re-check recommended`
- `Signature valid, authority not proven`
- `Signature valid, purpose not delegated`
- `Signature valid, issuer not trusted`
- `Platform identity does not match verified DigiD identity`
- `Artifact copied outside verified context`

When one specific authority-scope dimension fails on its own, compact copy SHOULD preserve that dimension instead of collapsing everything into a generic out-of-scope warning.

### Scope-conflict note

If the verifier knows the authority failure is specifically about purpose, channel, or action, the product surface should say so.

Example:
- compact: `Signature valid, purpose not delegated`
- expanded:
  - authority scope: out-of-scope
  - authority scope reasons: purpose-out-of-scope

Keep the machine-readable warning code stable as `delegation-scope-conflict`, but preserve the primary failure dimension in rendered copy and diagnostics.

### Issuer trust warning note

If the UI says `Signature valid, issuer not trusted`, it should be understood as:
- the signature verified against the claimed key, but
- the receiver has not anchored the issuer (trust-root/policy gap), so the verifier will not upgrade into a high-trust state.

This is not a cryptographic failure message.

### Avoid weak or misleading warning language
Avoid euphemisms like:
- `minor issue`
- `possible inconsistency`
- `mostly verified`

If the trust posture is degraded, say so plainly.

## Forbidden trust claims

The first DigiD UX should not say:
- `Trusted sender`
- `Safe sender`
- `This message is true`
- `Authentic and trustworthy`
- `Verified by DigiD` without clarifying what was verified
- `Official` unless the protocol explicitly proves organizational authority and the profile allows that wording

These phrases overstate what DigiD proves.

## Platform mismatch guidance

If DigiD identity and platform-native identity diverge, the UI should not smooth it over.
It should say so directly.

### Example mismatch outputs
- compact: `Verified agent, platform identity mismatch`
- expanded: `Slack display identity differs from signed DigiD identity`

This matters especially for Slack, messaging apps, email clients, copied artifacts, and exported transcripts.

## Historical versus current authority guidance

When event-time and current-time differ, the UI should not collapse them.

### Example
- compact: `Delegation no longer active`
- expanded:
  - event-time validity: valid when signed
  - current-time validity: delegation revoked

The first-line label should bias toward present caution on live surfaces.

## Pseudonymous identity guidance

Pseudonymous persistent identities should be shown as legitimate but limited.

### Preferred wording
- `Persistent pseudonymous identity`
- `Signed pseudonymous sender`

Avoid wording that implies either full distrust or full institutional verification.

## Recorded artifact guidance

If a message, clip, screenshot, transcript, or media artifact has left its original verified surface, the UX should communicate provenance degradation where applicable.

### Example warnings
- `Artifact copied outside verified context`
- `Original signature chain intact, display context changed`
- `Transcript verified, attached media not re-verified`

## Adapter/result contract guidance

If a verifier exports machine-readable results for adapters, those exports SHOULD preserve:
- warning codes
- signing-key lifecycle diagnostics (purpose + current-time status)
- owner-binding and authority-scope diagnostics
- rendering guardrails saying whether warning visibility is mandatory
- context-binding rules for live surfaces

Adapters SHOULD synthesize a mismatch or context-loss warning rather than silently reusing a positive compact label when:
- platform-native identity cannot be bound to the DigiD trust path
- a live result is copied outside its verified context

For the current public DigiD repo, those warnings should be exercised through local contract-guardrail evaluation and fixture-backed `dgd.adapter_evidence` inputs only.
Hosted adapter decision services or tenant-aware presentation layers remain private-boundary candidates.

## First implementation contract

The first verifier UI or CLI should:
1. render one compact trust banner
2. render one expanded detail view
3. render warnings separately from positive trust statements
4. distinguish event-time and current-time results when they differ
5. treat mismatch, stale, revoked, and missing-authority states as first-class outcomes
6. preserve the specific out-of-scope dimension when authority fails for one clear reason

## Relationship to other docs

Use this document together with:
- `docs/architecture/trust-states.md`
- `docs/architecture/reference-verifier.md`
- `docs/architecture/verifier-policy-profile.md`
- `docs/mvp/first-demo-flow.md`

The purpose is not to freeze every wording choice forever.
The purpose is to prevent the first DigiD verifier from sounding more certain than the protocol really is.
