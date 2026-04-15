# DigiD reference verifier concept

## Purpose

The first implementation may be easiest to prove through a reference verifier rather than trying to integrate every channel natively.

The verifier's job is to take DigiD objects and answer:
- is the signature valid?
- what kind of identity is this?
- who, if anyone, stands behind it?
- is delegation active?
- is revocation clear?
- what trust state should the receiver see?

## Inputs

The verifier should be able to consume:
- identity object
- attestation objects
- delegation object
- signed communication envelope
- revocation objects if any

## Outputs

The verifier should produce:
- machine-readable verification result
- user-facing trust summary
- warning list
- error list
- recommended display state

## Minimal verification pipeline

1. parse object structure
2. verify sender signature
3. resolve sender identity
4. verify issuer and attestation signatures
5. verify delegation if present
6. check revocation status
7. calculate trust state
8. render final summary

## Example user-facing output

- trust state: delegated-agent
- display summary: Verified agent acting for Acme Support
- signature valid: yes
- organization verified: yes
- delegation active: yes
- warnings: none

## Why this matters

The verifier is the shortest path to making DigiD real.
It turns protocol theory into a testable product experience.

## Likely first implementation shape

A small service or CLI that accepts JSON objects and returns a verification result would be enough for the first technical proof of concept.
