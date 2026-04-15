# DigiD first demo flow

## Recommended first demo

The first strong DigiD demo should be:

**A verified organization-issued agent initiates a voice communication, and the receiver can clearly see that the caller is a verified agent acting under a verified organization rather than an unknown human or spoofed bot.**

This captures the heart of the product.

## Why this demo first

It demonstrates:
- human vs agent distinction
- organization-backed delegation
- real communications trust problem
- visible trust UX
- a timely AI-era use case

## Demo actors

### Organization
- Acme Support
- DigiD class: organization
- trust state: verified organization

### Agent
- Acme Support Agent 01
- DigiD class: agent
- trust state: verified agent
- delegated by Acme Support

### Receiver
- ordinary user receiving a call or viewing a call detail screen

## Demo sequence

### Step 1: Organization creates agent identity
The organization issues an agent identity and signs an attestation and delegation object.

### Step 2: Agent initiates communication
The agent starts an outbound voice session.
A DigiD voice session start envelope is created and signed.

### Step 3: Receiver sees trust indicator
Before or during the call, the receiver sees something like:
- Verified agent
- Acting for Acme Support
- Identity verified
- Delegation active

### Step 4: Receiver inspects details
If expanded, the receiver can inspect:
- sender class: agent
- operator: Acme Support
- verification state: verified organization-backed agent
- signature status: valid
- authority status: active

### Step 5: Optional post-call recording manifest
If the system stores a recording or transcript, it also carries DigiD provenance.

## Demo UX concept

### Compact state
- purple or blue indicator
- label: Verified agent for Acme Support

### Expanded details
- sender: Acme Support Agent 01
- sender class: agent
- organization: Acme Support
- signed by: active DigiD key
- delegation: valid until Oct 15, 2026
- trust note: verifies sender authenticity, not truth of message content

## Contrast cases the demo should also show

### Case A: Verified human
A verified human sender appears differently from the verified agent.

### Case B: Unverified caller
An unverified sender appears gray and warns the receiver that no verified DigiD trust chain exists.

### Case C: Revoked agent
A previously valid agent shows a red or warning state because delegation is no longer active.

## Demo output artifacts

The first demo could be represented with:
- identity object JSON
- attestation object JSON
- delegation object JSON
- voice session envelope JSON
- verification result JSON
- a simple UI mock or verifier output page

## Why this is the right first proof

If DigiD can make this one experience obvious and compelling, it proves the product can solve a modern trust problem that people increasingly care about.
