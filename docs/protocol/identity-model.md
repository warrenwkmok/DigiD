# DigiD identity model v0.3

## Purpose

DigiD identities exist so a verifier can answer:
- who signed this
- what kind of actor they are
- who controls them
- what trust path, if any, supports the claim

Identity is therefore not just a profile record.
It is the root of signer resolution, key resolution, owner binding, and trust-state interpretation.

## Identity classes

The first DigiD framework recognizes these subject classes:
- `human`
- `agent`
- `organization`
- `service`
- `pseudonymous`
- `unverified`

These classes affect:
- what attestations are meaningful
- whether delegation is expected
- what trust states a verifier may render

## Core identity record

The normative v0.3 shape is defined in `docs/protocol/object-schemas.md`.

Conceptually, every DigiD identity should provide:
- stable `object_id`
- `identity_class`
- visible `display_name` when disclosure policy allows it
- one or more signing keys
- lifecycle state
- optional controller binding
- optional disclosure policy

## Key posture

Identity keys are not just login material.
They are the cryptographic roots used to sign DigiD objects and envelopes.

For v0.3, a useful identity record should support:
- stable `kid`
- disclosed `algorithm`
- disclosed `public_key_encoding`
- `status`
- `purposes`
- `not_before`
- optional `expires_at`

The first reference verifier assumes:
- `Ed25519`
- `spki-der-base64`
- explicit `assertion` purpose for trust-bearing signatures

## Controller model

The most important identity question for DigiD is often not the subject alone.
It is control.

`controller.controller_id` answers who stands behind the identity when it is not self-controlled.

Typical controller relationships:
- `self-controlled`
- `organization-issued`
- `delegated-service`
- `custodial`

## Identity classes by trust meaning

### Human
- represents a real individual
- strong public `verified-human` semantics likely require an independent issuer path

### Organization
- represents a company or institution that can sign directly and delegate authority
- v0.3 can treat organizations as trusted when the receiver explicitly anchors them

### Agent
- represents an autonomous or semi-autonomous software actor
- agent trust should not float free from owner binding when high-trust claims are rendered

### Service
- represents a system actor or workload identity
- may be organization-backed without being person-like

### Pseudonymous
- stable identity with intentionally constrained disclosure
- should not be collapsed into "fake" or "unverified by default"

### Unverified
- continuity may exist, but strong trust transfer does not

## Agent identity posture

Agent identity is where DigiD is most differentiated.

For high-trust agent states, an agent should usually be:
- controller-bound to a human or organization
- attested by an acceptable issuer class
- covered by active delegation when acting for another party
- signed with an authorized signing key

That means a fake "authenticated agent" is not enough.
A verifier should care whether the agent is attributable.

## Delegation relationships

The identity model must support questions like:
- is this agent acting for this organization
- is this human acting for this organization
- is this service delegated for this session, channel, and purpose

Delegation itself lives in `dgd.delegation`, but the identity model has to make those relationships resolvable.

## Verification state posture

`verification_state` on an identity is descriptive metadata, not self-proving truth.

A verifier should derive high-trust labels from:
- signed identity and key material
- signed attestations
- signed delegations
- receiver trust-anchor policy

not from a sender-declared string alone.

## Receiver interpretation

The receiver should be able to distinguish:
- stable but self-asserted identity
- owner-backed identity
- receiver-anchored organization identity
- independently issuer-verified identity

If DigiD fails to preserve those differences, "verified" becomes too vague to trust.
