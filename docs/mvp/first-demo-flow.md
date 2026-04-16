# DigiD first demo flow v0.3

## Recommended first demo

The first strong DigiD demo should be:

**A verified organization-issued agent initiates a voice communication, and the receiver can clearly see that the caller is a verified delegated agent acting for a verified organization.**

That is the smallest compelling proof that DigiD solves a real AI-era trust problem.

## Demo goal

Show, in one coherent flow:
- identity issuance
- organization-backed attestation
- delegation issuance
- signed voice-session announcement
- receiver-side verification
- dual evaluation of event-time validity and current-time validity
- trust-state rendering that distinguishes delegated agent from verified human and unverified caller

## Demo actors

### Organization
- display name: Acme Support
- identity class: organization
- verification state: verified organization
- role: issuer and delegator

### Agent
- display name: Acme Support Agent 01
- identity class: agent
- verification state: verified agent
- controller relationship: organization-issued

### Receiver
- ordinary person receiving a support call
- no DigiD expertise required

## Demo objects

The first demo should include these canonical artifacts:
1. organization identity object
2. agent identity object
3. agent attestation object
4. delegation object
5. communication object for the live call
6. `voice.session.started` event envelope
7. `voice.session.announcement` message envelope
8. verification result object
9. optional recording manifest and session-ended event

## End-to-end sequence

### 1. Organization identity exists
Acme Support publishes an active organization identity with an active signing key.

### 2. Agent identity is issued
Acme Support issues `Acme Support Agent 01` as an agent identity controlled by the organization.

### 3. Attestation is issued
Acme Support signs an attestation confirming the agent identity is a verified organization-issued agent.

### 4. Delegation is issued
Acme Support signs a delegation authorizing the agent for:
- channel: voice
- actions: `communicate`, `sign-session`
- purpose: `support-follow-up`

### 5. Communication object is created
The voice adapter creates a `dgd.communication` object that binds:
- sender identity
- operator identity
- delegation id
- session id
- purpose
- initial payload digest for the session manifest

### 6. Agent starts the call
The voice adapter emits:
- `voice.session.started` event
- `voice.session.announcement` message

Both are signed with the agent key and reference the same communication object plus the active delegation.

### 7. Receiver-side verifier resolves trust
The verifier checks:
- signature validity
- agent identity status
- organization identity status
- attestation status
- delegation status and scope
- purpose match
- time validity
- revocation state
- freshness posture for revocation data
- whether event-time and current-time conclusions differ

### 8. UI renders trust state
Compact state:
- **Verified agent for Acme Support**

Expanded state:
- sender: Acme Support Agent 01
- sender class: agent
- operator: Acme Support
- authority: delegated by verified organization
- channel authorization: voice
- purpose: support follow-up
- signature status: valid
- verification mode: dual
- trust note: verifies sender authenticity, not truth of message content

### 9. Optional post-call artifacts
If the demo includes persistence, emit:
- `voice.session.ended` event
- `voice.recording.manifest` message
- optional transcript artifact with provenance

## Example event chain

| Seq | Artifact | Who signs it | Why it matters |
| --- | --- | --- | --- |
| 1 | organization identity | org key | anchor trust root for demo |
| 2 | agent identity | org key or identity service key | establishes agent subject |
| 3 | attestation | org key | marks agent as organization-backed |
| 4 | delegation | org key | grants voice authority |
| 5 | communication object | agent key | binds signer, operator, purpose, and session ids |
| 6 | `voice.session.started` event | agent key | proves session initiation |
| 7 | `voice.session.announcement` message | agent key | powers UI trust banner |
| 8 | verification result | verifier key or unsigned local result | shows resolved trust state |
| 9 | optional recording manifest | agent key or service key | preserves provenance after call |

## Fixture set for the first demo

The fixture family should be small but opinionated.

### Required happy-path fixtures
- `fixtures/demo/org.identity.json`
- `fixtures/demo/agent.identity.json`
- `fixtures/demo/agent.attestation.json`
- `fixtures/demo/agent.delegation.json`
- `fixtures/demo/voice.communication.json`
- `fixtures/demo/events/voice.session.started.json`
- `fixtures/demo/messages/voice.session.announcement.json`
- `fixtures/demo/results/verification.happy-path.json`

### Required contrast fixtures
- same artifacts, but delegation later revoked
- same artifacts, but revocation freshness stale
- same artifacts, but delegation removed
- verified human direct message flow with no operator
- unverified sender flow with no DigiD trust chain

### Fixture lineage rule
Every delegated-agent voice fixture in the first slice should share:
- the same organization identity lineage
- the same agent identity lineage
- the same `dgd.communication` anchor object
- one clearly documented change per contrast scenario

That keeps the demo honest by proving that verifier output changes because trust state changed, not because the scenario quietly swapped half the graph.

## Demo verifier decision matrix

The first demo should render at least these four outcomes from the same fixture family:

| Scenario | Event-time result | Current-time result | Expected UI posture |
| --- | --- | --- | --- |
| happy path | valid | valid | Verified agent for Acme Support |
| delegation revoked after call | valid | degraded or reject | Delegation no longer active |
| stale revocation data | valid | warning | Verification stale, re-check recommended |
| missing delegation | degraded | degraded | Signature valid, authority not proven |

## Contrast cases the demo should also render

### A. Verified human
- no operator
- no delegation
- trust chip: `Verified human`

### B. Unverified caller
- no valid DigiD trust chain
- trust chip: `Unverified sender`
- warning copy: `No verifiable DigiD signature or delegation found`

### C. Revoked agent delegation
- signature may still verify mathematically
- trust chip: `Delegation revoked`
- details explain that sender authority is no longer active

## Demo implementation slice

For the first implementation, one repo slice is enough:
- static JSON fixtures for demo objects and envelopes
- small verifier library that resolves trust state from fixture inputs
- tiny UI or CLI output that renders compact and expanded trust views
- at least one fixture showing the difference between historical validity and present authority state

## Verifier input contract for the demo

The first verifier slice should accept either:
- one manifest listing fixture paths in dependency order, or
- one directory containing the full fixture family with conventional filenames

Recommended dependency order:
1. organization identity
2. agent identity
3. attestation
4. delegation
5. communication object
6. ordered events and messages
7. optional revocations

The verifier should not infer missing trust links from filenames alone. It should resolve every id from the signed object graph.

## Trust rendering contract for the demo

The first UI or CLI renderer should output both:
- compact: one trust banner line
- expanded: signer, operator, authority scope, purpose, verification mode, freshness, warnings

Suggested compact outputs:
- `Verified agent for Acme Support`
- `Delegation no longer active`
- `Verification stale, re-check recommended`
- `Unverified sender`

## Demo build order

1. fixture schema validation for the object and envelope family
2. verifier pipeline over the happy-path fixture set
3. trust-state renderer for compact and expanded views
4. degraded comparison fixtures for revoked and stale outcomes
5. optional recording and transcript provenance fixtures

## Architecture note carried forward

The first demo is now opinionated enough that the implementation slice should preserve three boundaries:
- `packages/protocol` owns type guards, schema validation, canonicalization helpers, and digest helpers
- `packages/verifier` owns graph resolution and trust decisions
- `fixtures/demo/` owns canonical examples and comparison scenarios

If code scaffolding starts before those boundaries are respected, the first prototype will likely blur protocol rules with demo-specific shortcuts.

## Product decision already implied by this flow

The first demo should optimize for **verified agent/human communications**, not generic media provenance alone.
That is the sharper wedge and the clearest immediate trust problem.
