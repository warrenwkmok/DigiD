# DigiD

DigiD is a verifiable communications identity protocol and product concept for a world where humans, agents, and organizations all communicate across voice, video, messaging, email, and social surfaces.

The core problem is no longer just account login. The real problem is trust in communications:
- Who is speaking?
- Is this a verified human, a verified agent, an organization-issued agent, or an unverified actor?
- Was this message, call, recording, or video actually created by the claimed sender?
- Has it been altered?
- What level of disclosure should the receiver see?

DigiD starts from the idea that communications need a portable identity and provenance layer, not just another siloed app account.

## Product thesis

DigiD should begin as a communications authenticity and trust layer, not as a universal mandatory identity system.

The first wedge is:
- verifiable sender identity
- human vs agent vs organization classification
- signed communications provenance
- clear trust-state UX across channels

## Why now

AI makes spoofing cheap.
Voice can be cloned.
Video can be manipulated.
Agents can act on behalf of people and companies.
Receivers increasingly need to know whether a communication is:
- verified human
- verified agent
- verified organization
- pseudonymous but persistent
- unverified

## Initial repo structure

- `docs/vision/`
  - product framing, principles, market wedge
- `docs/protocol/`
  - protocol concepts, identity model, attestation model, signing model
- `docs/architecture/`
  - system architecture, trust states, adapters, verifier UX
- `docs/mvp/`
  - first product wedge, milestones, delivery plan
- `docs/threat-model/`
  - abuse cases, failure modes, privacy and trust risks

## First-position statement

DigiD is not trying to solve all identity on day one.
DigiD is trying to make communications verifiable.

That means building a protocol and product layer that can show, in a way ordinary people can understand:
- who sent this
- what kind of sender they are
- how strongly they are verified
- whether the communication was signed
- whether it was delegated
- whether it should be trusted

## Near-term design stance

The first version should prioritize:
1. verified communications identity over universal identity
2. human, agent, organization, pseudonymous, and unverified trust states
3. public/private key signing and verification
4. channel adapters for voice, video, email, and messaging
5. simple visible trust indicators
6. privacy-preserving disclosure rather than maximum identity exposure

## Next build direction

The repo is being scaffolded first as a product and protocol design repository.
That means the first phase is:
- clear concept definition
- protocol shape
- trust model
- MVP design
- future technical implementation plan

Implementation can begin after the protocol and product surface are coherent enough to build against.
