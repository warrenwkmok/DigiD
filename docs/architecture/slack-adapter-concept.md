# DigiD Slack adapter concept v0.1

## Purpose

This document explains how DigiD could land in Slack as a real-world adapter surface without pretending Slack itself is the root of trust.

Slack should be treated as:
- a transport and rendering surface
- a source of platform identity and workspace context
- a constrained UI environment

DigiD should be treated as:
- the authenticity and delegation trust layer
- the source of signer, operator, delegation, and verification claims

## Recommended first positioning

The first Slack wedge should **not** be universal signing for all human Slack messages.
The stronger early wedge is:
- org-authorized agents
- support or operations agents
- enterprise bots
- sensitive workflow messages
- approval or notification surfaces where provenance matters

That is easier to explain, easier to deploy, and more valuable than trying to verify all chat activity.

## Adapter model

The Slack adapter should begin as a sidecar integration, not a native platform rewrite.

### Recommended early deployment shapes
- Slack app with message action + modal verification view
- Slack bot that can post or verify DigiD-backed messages
- verifier sidecar link opened from Slack message actions
- enterprise gateway that signs outbound bot or agent messages before posting to Slack

## Trust model split

### Slack-native facts
Slack can tell DigiD things like:
- workspace id
- channel id
- message ts
- Slack user id or app id
- bot identity
- thread context
- limited metadata about edits and posting mode

### DigiD trust facts
DigiD should determine:
- signer identity
- operator identity
- sender class
- delegation scope
- verification result
- current versus historical authority posture
- warnings about mismatch, replay, stale checks, or degraded provenance

Slack account identity and DigiD identity should be presented as related but distinct facts.

## First adapter flow

### 1. DigiD-backed agent posts to Slack
A bot, service, or gateway posts a Slack message that includes a DigiD envelope reference or embedded signed metadata.

### 2. Slack adapter captures verification context
The adapter resolves:
- Slack workspace context
- Slack app or user posting context
- referenced DigiD communication or message objects
- relevant delegation and attestation lineage

### 3. Verifier evaluates DigiD trust state
The verifier checks:
- signature validity
- signer and operator lineage
- delegation scope
- current freshness and revocation posture
- platform mismatch between Slack actor and DigiD identity if applicable

### 4. Slack UI renders trust result
The adapter should expose:
- compact trust label in the message accessory surface if possible
- message action like `View DigiD verification`
- modal or side panel with expanded trust details
- warnings when Slack identity and DigiD identity diverge

## Recommended Slack UI posture

### Compact posture
Prefer short labels such as:
- `Verified agent for Acme Support`
- `Verification stale`
- `Delegation no longer active`
- `Unverified sender`

### Expanded posture
Show:
- sender identity
- sender class
- operator / organization
- delegation scope
- Slack posting identity
- Slack workspace context
- verification mode
- warnings

## Platform mismatch handling

Slack introduces a serious mismatch risk.
A Slack display name, app name, or bot icon may imply more than DigiD proves.

The adapter should explicitly model:
- Slack actor id
- Slack app/user display identity
- optional signed platform-binding claim
- mismatch state if Slack identity and DigiD identity differ or cannot be bound

### Example mismatch outputs
- `Verified agent, platform identity mismatch`
- `Slack app identity not bound to signed DigiD identity`

This should be a first-class warning, not buried.

## Message edits and thread behavior

Slack edits complicate trust.
The adapter should distinguish:
- original signed content
- edited Slack display content
- unsigned thread commentary around a verified message

### Early rule
If Slack message text changes after signing and the edited text is what the user sees, the adapter should degrade trust posture unless the edit itself is re-signed and re-verified.

## Forwarding, quoting, export, and screenshot risks

Slack content often leaves Slack through:
- quotes
- exports
- copied text
- screenshots
- incident tickets
- email forwarding

The Slack adapter should not pretend trust remains unchanged when content leaves the verified surface.

### Recommended first rule
Treat Slack verification as strongest inside the live verified Slack surface.
Once copied or exported, the trust posture should degrade unless a DigiD artifact or sidecar verification path travels with it.

## Adapter object needs

The first Slack adapter likely needs these profile-level additions or bindings:
- platform-binding claims between Slack actor ids and DigiD identities
- optional Slack message reference object or signed external reference block
- clear rules for what Slack metadata is signed, referenced by digest, or treated as unsigned context

These do not all need to be core protocol primitives immediately, but the adapter profile must define them.

## Recommended first adoption wedge

The best Slack-first pilot is probably:
- one organization
- one DigiD-issued agent or bot
- one sensitive operational channel
- one verifier modal showing compact and expanded trust state
- one mismatch warning path
- one revoked or stale comparison case

That is enough to prove real deployment value without pretending DigiD has solved all Slack identity.

## Risks the adoption loop should keep revisiting

- Slack UI constraints may prevent ideal inline trust rendering
- Slack app permissions may limit context resolution
- enterprise customers may want unsafe simplifications
- forwarded/copied content may create false certainty outside the verified surface
- users may over-trust bot names, icons, or workspace membership unless mismatch states are shown clearly

## Relation to other DigiD work

This concept should be read alongside:
- `docs/review/adoption-loop-brief.md`
- `docs/review/red-team-brief.md`
- `docs/architecture/verifier-ux-guidance.md`
- `docs/mvp/first-demo-flow.md`

The purpose is to keep Slack in the design loop as a believable sidecar deployment path, not as a vague future integration fantasy.
