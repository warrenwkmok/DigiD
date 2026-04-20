# DigiD signing and provenance model v0.3

## Goal

DigiD should let a receiver verify three different things cleanly:
- **origin**: who signed the object
- **authority**: whether that signer was allowed to act in that role
- **integrity**: whether the signed payload changed after signing

It should not pretend to prove content truth.

## Trust assertions DigiD can support

A verifier should be able to render statements like:
- signed by verified human
- signed by verified agent
- signed by agent delegated by verified organization
- signed by service acting under delegated authority
- signature valid but delegation expired
- unsigned or unverifiable

## Signing model

At a high level:
1. each DigiD identity holds one or more signing keys
2. public keys are published in the identity object
3. protocol objects are canonicalized before signing
4. a `proof` block is attached to the object or envelope
5. verifiers resolve the key, then validate signature, status, authority, and time

Issuers should preserve historical key records so past events remain independently verifiable after later rotations.

## Canonicalization requirement

To keep cross-platform verification stable, DigiD v0.3 should assume:
- JSON wire format
- JSON Canonicalization Scheme (`JCS`) for signing input
- detached payloads represented by digests when the payload is large or binary

Signing target:
- remove the `proof` field from the object
- canonicalize the remaining JSON
- sign the canonical bytes with the signer private key
- place the resulting proof in `proof`

## Cryptographic algorithm policy (disclosure + agility)

DigiD v0.3 intentionally supports **one** cryptographic suite so verifiers cannot be tricked into accepting weak or ambiguous algorithms.

### Required suite for v0.3
- signature algorithm: `Ed25519`
- cryptosuite identifier: `proof.cryptosuite = "urn:dgd:cryptosuite:ed25519-jcs-sha256:0.3"`
- proof suite identifier: `proof.type = "ed25519-2020"`
- canonicalization identifier: `proof.canonicalization = "JCS"`
- detached digest prefix: `sha256:<hex>`

### Algorithm disclosure rules
- signature algorithm MUST be disclosed by the signer identity key record (`keys[].algorithm`) and verifiers MUST reject proofs whose `proof.type` is incompatible with the resolved key algorithm.
- digest algorithm MUST be disclosed in signed digest fields via the digest prefix (example: `payload_digest = "sha256:..."`).
- `proof.cryptosuite`, `proof.type`, and `proof.canonicalization` are required verification parameters; verifiers MUST treat them as untrusted inputs and enforce them strictly (an attacker can tamper with proof metadata, but they cannot make verification pass unless the verifier accepts the claimed suite).

### Public key encoding disclosure

For the reference v0.3 profile:
- `keys[].public_key_encoding` MUST be `spki-der-base64`
- `keys[].public_key` MUST be a base64-encoded DER `SubjectPublicKeyInfo` (`spki`) public key
- verifiers MUST reject missing or unsupported `public_key_encoding` to prevent encoding confusion across implementations

### Verifier UX posture for cryptography
- compact trust labels MUST NOT mention cryptographic algorithms.
- products MAY expose a single "crypto suite" line in an advanced/debug view, primarily to explain interoperability failures or explicit "unsupported algorithm" rejections.

## Key requirements

For the first implementation, keys should support:
- algorithm: `Ed25519`
- explicit `kid`
- status: `active`, `suspended`, `revoked`, `expired`
- purpose list such as `assertion`, `authentication`
- creation time and optional expiry time

### Key status vs key window semantics (v0.3 posture)

For v0.3, treat key lifecycle as two different questions:
- **event-time validity**: was the key within its declared `not_before`/`expires_at` window when the artifact was signed?
- **current-time operational status**: is the key currently usable for making a live trust claim (`status: active` and within the window at verification time)?

Because v0.3 key records do not carry a signed `revoked_at` field inside `keys[]`, verifiers SHOULD NOT treat a present-tense `status: revoked` as cryptographic proof that the key was revoked at some specific past time.
Use a signed `dgd.revocation` object targeting the signing key (`target_object_type: dgd.signing_key`, `target_object_id: <kid>`) when a verifier needs a signed revocation-effective time.

Recommended verifier posture:
- reject current-time trust when the resolved signing key is `status: revoked` or `status: suspended`
- downgrade or reject current-time trust when the key is outside its declared validity window, even if the signature math verifies
- require proof `kid` to resolve to the signer identity unless the protocol explicitly allows delegated custodianship
- distinguish event-time validity from current-time operational validity

## Agent ownership-binding requirement

Agent signatures should not be treated as free-floating proof that "a real DigiD agent signed this."

For DigiD, an agent key should only become high-trust when the verifier can bind that key and identity back to a controlling human or organization.
That binding should be explicit, signed, and verifier-checkable.

For the first delegated-agent profile, the verifier should require all of these:
- the agent identity declares a non-self controller through `controller.controller_id`
- the controlling human or organization signs the agent identity issuance or current controlling identity record
- the controlling human or organization signs the attestation that classifies the subject as a verified agent
- the controlling human or organization signs the delegation that authorizes the agent for the claimed channel, action, and purpose
- `proof.kid` on delegated agent artifacts resolves to a key published on that same agent identity

### Key-binding objects (attestation + delegation)

To prevent "valid signature, wrong key" ambiguity in delegated flows, issuer-signed artifacts SHOULD bind to the specific delegate signing key used for the communication.

For v0.3, this is expressed as:
- `dgd.attestation.subject_key = { kid, public_key_digest }`
- `dgd.delegation.delegate_key = { kid, public_key_digest }`

Digest disclosure rules apply:
- `public_key_digest` MUST use an algorithm prefix (example: `sha256:<hex>`) so verifiers do not guess digest semantics.
- verifier profiles MAY require both bindings for high-trust delegated communication; a mismatch SHOULD downgrade the result to degraded trust even if the signature math verifies.

That means a valid delegated-agent trust path is not just:
- agent key signs message

It is:
- owner-controlled identity binds the agent identity
- owner attests the agent class and standing
- owner delegates current authority
- agent key signs the live artifact

If that ownership-binding chain is missing, the verifier should not render `delegated-agent` or any equivalent high-trust agent label.
At most it should render a degraded posture such as:
- `Signature valid, authority not proven`
- `Agent signature not bound to verified owner`

This matters because otherwise an attacker can generate a technically valid agent keypair, mint a plausible agent-shaped identity object, and rely on UI shortcuts to imply owner backing that was never actually proven.

## Key lifecycle and recovery posture

For the first implementation, DigiD should explicitly model:
- key activation (`not_before`)
- scheduled expiry (`expires_at`)
- emergency revocation (`revoked_at` via `dgd.revocation` or `key.revoked` event)
- rotation overlap, where old and new keys may both verify during a bounded transition window

Verifier guidance:
- revoked keys MUST fail current-time trust resolution
- expired keys SHOULD fail current-time trust resolution and MAY remain historically valid for event-time review
- suspended keys SHOULD produce degraded trust unless the verifier profile requires hard reject
- recovery after key compromise MUST use a new key identifier, not silent key replacement

Revocation timing posture:
- a `dgd.revocation` MUST carry signed `created_at` (issuance time) and `revoked_at` (claimed effective time)
- the v0.3 reference verifier SHOULD treat effective revocation time as `max(revoked_at, created_at)` (with small clock-skew allowance) and surface `revocation-backdated` when a revocation claims an earlier effective time

## What gets signed

### Primary signed objects
- identity objects when issued or rotated
- attestation objects
- delegation objects
- message envelopes
- event envelopes
- verification result objects when a verifier service wants portable signed output
- revocation objects

### Optional later signed objects
- chunk manifests for long media streams
- transcript manifests
- structured document bundles
- redaction manifests and derived artifact chains

## Provenance model

Provenance should be explicit, not inferred from vibes.

A provenance-capable object should be able to state:
- who created the original asset or message
- whether the content was human-created, agent-generated, service-generated, human-recorded, AI-generated, or hybrid
- whether it was edited after initial creation
- what pipeline or software emitted the signed object
- which upstream subject or session the artifact came from

Suggested provenance fields:

```json
{
  "source_type": "agent-generated",
  "capture_method": "live-session",
  "edited": false,
  "generator": {
    "software": "DigiD Voice Adapter",
    "version": "0.1.0"
  },
  "derived_from": [
    "dgd:session:voice_01JSESSION..."
  ]
}
```

## Human vs agent provenance

This distinction is the product, not a side note.

DigiD should explicitly model whether the signer is:
- a human identity
- an agent identity
- an organization identity
- a service identity

And separately whether the signer is:
- self-controlled
- organization-issued
- delegated
- pseudonymous

That lets the UI say things like:
- Verified human
- Verified agent
- Org-issued agent for Acme Support
- Verified service for Acme Support
- Signature valid, authority no longer active

## Verification pipeline

A reference verifier should perform checks in this order:

1. **shape validation**
   - correct object type
   - required fields present
   - timestamps parse

2. **proof validation**
   - canonicalization method supported
   - signature algorithm supported
   - signature bytes verify against resolved public key

3. **signer resolution**
   - signing key exists on signer identity
   - key status is acceptable
   - signer identity status is acceptable

4. **authority resolution**
   - attestation path exists if required
   - delegation exists if the signer is acting for another party
   - channel and action are in scope

5. **time and revocation checks**
   - object is within validity window
   - key, attestation, delegation, and target are not revoked

5a. **freshness evaluation**
   - determine whether revocation data is fresh enough for the verifier profile
   - downgrade to `stale` or `unknown` when freshness cannot be shown

6. **trust-state resolution**
   - derive the display trust state
   - generate warnings if mathematically valid but operationally unsafe

## Degraded trust examples

These should not all collapse into one red X.

### Valid signature, no authority
- signer key valid
- signer identity active
- delegation missing or out of scope
- result: `degraded-trust`

### Valid signature, revoked delegation
- signer key valid
- delegation revoked after issuance
- result: warning or reject depending on the use case and event time

### Valid signature, stale revocation view
- signer key valid
- delegation appears active in cache
- verifier freshness window exceeded
- result: `allow-with-warning` or `degraded-trust` depending on the product surface

### Unsignable host platform wrapper
- host transport strips some metadata
- DigiD verifier still works if it can access the envelope via URL, QR, attachment, or sidecar object

## Event and message provenance interplay

Messages provide the user-facing communication object.
Events provide the reconstruction trail.

Example for the first demo:
- a `voice.session.started` event proves the session began
- a `voice.session.announcement` message is what the UI displays
- a `verification.performed` event explains how the trust state was determined
- a `voice.recording.manifest` message preserves post-call provenance

## Product principle

DigiD proves sender authenticity and authority state.
It does not prove that the sender is honest, competent, or factually correct.
A verified liar is still possible, and the protocol should say that plainly.
