# DigiD design principles

## 1. Communications-first, not account-first
DigiD should optimize for proving the origin and trust state of communications, not merely creating another identity account.

## 2. Human, agent, and organization must all be first-class entities
The system should not bolt on agents later. Agent identity is a core use case, not an edge case.

## 3. Verification must be legible to ordinary users
A strong cryptographic system is not enough if users cannot tell what they are looking at.

## 4. Privacy must be configurable
Not every interaction should require full real-world identity disclosure. Pseudonymous and limited-disclosure modes matter.

## 5. Trust should be tiered, not binary
The system should support different levels of trust instead of pretending identity is simply verified or not.

## 6. Delegation must be explicit
If an agent acts on behalf of a human or organization, that relationship should be represented clearly.

## 7. Revocation and recovery are mandatory
Keys will be lost, identities will be disputed, and credentials will need rotation. Recovery and revocation are core system behavior.

## 8. The protocol should outlast any one interface
The long-term value is in the protocol and trust model, not only in a single app UI.

## 9. Channel adapters should be practical
Voice, video, email, messaging, and social all have different technical constraints. The protocol should adapt rather than demand unrealistic purity.

## 10. Start with a wedge that can get adoption
The first version should solve a painful modern problem well enough that organizations and users are motivated to adopt it.
