# DigiD MVP definition

## Recommended first wedge

The first DigiD version should focus on verifiable communications identity, especially for AI-mediated communications.

## MVP problem statement

Receivers need a simple way to tell whether a communication came from:
- a verified human
- a verified agent
- an agent authorized by an organization
- an unverified sender

## MVP scope

The MVP should likely include:
- identity record format
- key and signature model
- attestation model
- trust-state taxonomy
- verification API or service concept
- basic adapter spec for a few channels
- trust-indicator UI spec

## Suggested first channels

Pick 2 to 3 first instead of trying to solve all at once.

Recommended early channels:
- voice calls
- video artifacts
- messaging or email

Note on repo direction:
- keep live communication as the primary MVP wedge
- keep recorded and published media, including social-media-style artifacts, as a separate profile-family track inside the same repo for a later build loop rather than a separate repo

## First user stories

### Receiver story
As a receiver, I want to know whether a communication came from a verified human, verified agent, or unverified source.

### Sender story
As a sender, I want to sign communications with my DigiD identity and let the receiver verify my status.

### Organization story
As an organization, I want to authorize agents and humans to communicate under my trust umbrella with explicit delegation.

## MVP non-goals

Not in first version:
- global government-level identity rollout
- every channel integration at once
- fully decentralized governance from day one
- universal mandatory real-name identity

## Success criteria

The MVP is successful if it can clearly demonstrate:
- signed sender identity
- human vs agent vs org distinction
- delegation support
- trust-state rendering in a concrete communications flow
