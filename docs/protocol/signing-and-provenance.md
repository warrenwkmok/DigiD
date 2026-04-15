# DigiD signing and provenance model

## Goal

DigiD should allow communications and media to carry verifiable provenance.

That means a receiver should be able to tell:
- who signed the communication
- what kind of identity signed it
- whether the signer was delegated
- whether the payload has been modified since signing

## Signing model

At a high level:
- each DigiD identity owns one or more private signing keys
- the corresponding public keys are published in the identity record
- messages, sessions, or media manifests are signed with the private key
- receivers verify the signature using the published public key

## What gets signed

Potential signed objects include:
- email metadata and body digest
- messaging payloads
- call session manifests
- voice recording manifests
- video recording manifests
- document manifests
- event logs for communication flows

## Call/session signing concept

For real-time channels like voice and video, DigiD may sign:
- session start metadata
- participant identity claims
- delegation chain
- media stream fingerprints or periodic chunks
- call-end summary manifest

This gives a basis for later verification without requiring every channel to natively understand DigiD from day one.

## Media provenance concept

For voice or video, DigiD should be able to represent:
- who created the original asset
- whether it was AI-generated, human-recorded, or hybrid
- whether it was edited after initial creation
- what software or trusted pipeline signed it

## Human vs agent provenance

This is a core DigiD distinction.

Example interpretation:
- signed by verified human
- signed by verified agent
- signed by agent delegated by verified organization
- unsigned or unverifiable

## Verification output

A verifier should ideally produce a result like:
- signature valid: yes
- signer class: verified agent
- delegation: authorized by Company X
- payload integrity: intact
- revocation status: active
- trust summary: trusted for sender authenticity

## Important principle

DigiD should separate:
- proof that a message came from a claimed sender
from:
- proof that the content is true

A verified liar is still possible.
DigiD proves origin and trust status, not universal truth.
