# DigiD identity model

## Identity classes

DigiD should support multiple identity classes from the start:
- human
- agent
- organization
- pseudonymous identity
- unverified identity

These are not just labels. They influence trust interpretation, display rules, and attestation requirements.

## Core identity record

A DigiD identity record should include:
- stable identity id
- public keys
- key history
- identity class
- display name
- optional legal name or verified human name
- verification status
- attestations
- delegation relationships
- revocation status
- metadata disclosure policy

## Example conceptual schema

```json
{
  "id": "dgd:human:7F3A...",
  "class": "human",
  "display_name": "Warren Mok",
  "verification_state": "verified-human",
  "public_keys": [
    {
      "kid": "key-2026-01",
      "algorithm": "ed25519",
      "public_key": "...",
      "status": "active"
    }
  ],
  "attestations": [
    {
      "type": "government-id-verified",
      "issuer": "trusted-verifier-x",
      "issued_at": "2026-04-15T00:00:00Z"
    }
  ],
  "delegations": [],
  "revocation": null
}
```

## Human identity

A human identity represents a real individual.
Possible verification methods later may include:
- government ID verification
- bank or KYC verification
- employer verification
- device-bound verification
- web-of-trust or delegated attestation

## Agent identity

An agent identity represents an autonomous or semi-autonomous software actor.
An agent may be:
- self-issued
- user-issued
- organization-issued

The system should preserve who stands behind the agent when applicable.

Agent identities should be able to declare:
- owning organization or operator
- scope of authority
- expiration
- communication permissions
- model/provider metadata if disclosure is desired

## Organization identity

An organization identity represents a company, institution, or collective entity that can:
- sign communications directly
- delegate authority to humans
- delegate authority to agents
- revoke credentials and agents

## Pseudonymous identity

A pseudonymous identity is persistent but intentionally does not disclose a real-world name by default.
This matters for privacy, speech, and safety.

Pseudonymous should not mean untrusted by default. It should mean:
- stable identity
- constrained disclosure
- possibly lower or different attestation type

## Unverified identity

An unverified identity may still have a key and may still sign data, but the receiver should see clearly that:
- no strong external attestation exists
- trust should be interpreted cautiously

## Delegation model

The identity model should support relationships like:
- this agent is authorized by this human
- this agent is authorized by this organization
- this human is acting under this organization

Delegation should carry:
- issuer
- scope
- validity window
- revocation status
- optional policy conditions
