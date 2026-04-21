# DigiD trust states

## Why trust states matter

Most users will not inspect certificates, signatures, or attestation chains.
They will rely on visible trust states.

## Proposed initial trust states

### Verified human
A real person with a strong attestation chain.
In DigiD terms, this should normally mean an independent trusted issuer path, not just owner assertion.

### Verified agent
A software agent with a valid identity and attestation chain, but not necessarily acting under a verified operator at the moment of communication.
This should be treated carefully because a "verified agent" without active owner-backed authority is weaker than an org-issued or delegated agent.

### Verified organization
A receiver-meaningful organization identity that is anchored in receiver policy (for example, pinned as a trusted issuer root, or proven via an attestation from a trusted issuer).
A verifier MUST NOT render this state solely because the organization self-asserts `verification_state`.

### Org-issued agent
An agent that is issued by (and acting under authority of) a verified organization.
This is the "support bot" trust state: the receiver sees the organization as the accountable authority.

### Delegated agent
An agent that is explicitly acting on behalf of a verified human (or other non-organization operator).

### Pseudonymous persistent identity
A stable identity that does not reveal full real-world information by default.

### Unverified
No meaningful trust attestation beyond self-assertion.

### Revoked or disputed
Previously valid identity or delegation that should no longer be trusted.

## Trust-tier interpretation

These visible trust states should be interpreted through trust tiers, not as one flat green badge.

Recommended tiers:
- `self-asserted`
- `owner-asserted`
- `platform-verified`
- `issuer-verified`
- `receiver-anchored`

Important examples:
- `org-issued-agent` is usually `owner-asserted` plus active delegation and owner accountability
- `verified-organization` in the current reference verifier is usually `receiver-anchored`
- `verified-human` should aim toward `issuer-verified`

## Why this matters

If DigiD does not preserve the difference between these tiers, a fake but internally consistent ecosystem can look too similar to a truly trusted one.

The verifier therefore should not collapse these questions:
- did a key sign this
- who controls that key
- who attested the subject
- why does the receiver trust that issuer

## Release-readiness posture

For the current public framework draft:
- organization trust is clearest when receiver-anchored
- agent trust is clearest when owner-bound and actively delegated
- human trust is still the least settled category

That means DigiD is currently strongest when it renders attributable authority, not when it implies a universal human-verification network already exists.

## UX examples

Possible visible signals:
- green: verified human
- blue: verified organization
- purple: verified or delegated agent
- gray: unverified or pseudonymous
- red: revoked, mismatched, or suspicious

## Channel examples

### Voice call
- verified human caller
- delegated agent for Company X
- unverified caller

### Video
- signed by verified human
- signed by organization-issued agent
- unverifiable media origin

### Email
- verified human sender
- verified org-issued support agent
- unsigned sender identity

### Messaging or social
- verified human account
- verified agent account
- persistent pseudonymous identity
- unverified account
