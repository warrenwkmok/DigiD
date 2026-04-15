# DigiD system architecture

## High-level layers

DigiD should be thought of as a stack.

### 1. Identity layer
Stores identity records, public keys, trust class, and lifecycle state.

### 2. Attestation layer
Represents who verified or authorized whom, with signatures and expiry rules.

### 3. Signing layer
Signs communications, media manifests, and session objects.

### 4. Verification layer
Resolves identity records, checks signatures, checks attestations, and evaluates trust state.

### 5. Adapter layer
Connects DigiD concepts to actual channels:
- voice
- video
- email
- messaging
- social
- enterprise systems

### 6. UX layer
Displays trust state in a way ordinary people can interpret quickly.

## Core architectural objects

- identity registry
- public key directory
- attestation store
- revocation list or revocation service
- verification service
- channel adapters
- verifier UI kit / trust indicator spec

## Possible deployment shape

The first implementation does not need to solve everything in a decentralized way.
A practical first system may include:
- central verification services
- signed identity objects
- revocation endpoints
- channel SDKs
- verifier APIs

Later versions can decide how decentralized the identity directory should become.

## Architectural principle

Make the trust model portable.
Do not hard-code the system to one app or one communication surface.
