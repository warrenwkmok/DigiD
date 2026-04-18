# DigiD trust states

## Why trust states matter

Most users will not inspect certificates, signatures, or attestation chains.
They will rely on visible trust states.

## Proposed initial trust states

### Verified human
A real person with a strong attestation chain.

### Verified agent
A software agent with a valid identity and attestation chain, but not necessarily acting under a verified operator at the moment of communication.

### Verified organization
A company or institution with a trusted organizational identity.

### Org-issued agent
An agent that is issued by (and acting under authority of) a verified organization.
This is the “support bot” trust state: the receiver sees the organization as the accountable authority.

### Delegated agent
An agent that is explicitly acting on behalf of a verified human (or other non-organization operator).

### Pseudonymous persistent identity
A stable identity that does not reveal full real-world information by default.

### Unverified
No meaningful trust attestation beyond self-assertion.

### Revoked or disputed
Previously valid identity or delegation that should no longer be trusted.

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
