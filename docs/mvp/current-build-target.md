# DigiD current build target

## Why this doc exists

DigiD now has enough framework that it can feel more complete than it really is.
This doc is the blunt orientation marker for where the project actually is, what the MVP really is, and what needs to be built next.

## What DigiD is building right now

DigiD is building a **verifier-first trust layer for communications**.

The first real product question is:

**Can a receiver tell whether a communication came from a verified human, a verified agent, or a delegated agent acting for a verified organization?**

That is the wedge.
Not universal identity.
Not every channel at once.
Not a production-ready Slack or Teams platform yet.

## What the MVP is

The first MVP should be a **fixture-driven verifier prototype** for **verified agent/human communications**.

The MVP should prove, honestly and concretely:
- signed sender identity
- human vs agent vs organization distinction
- delegated authority from organization to agent
- event-time versus current-time trust differences
- compact and expanded trust rendering
- degraded outcomes like revoked, stale, or missing authority

## What the MVP is not

Not yet in MVP 1:
- live Slack integration
- live Microsoft Teams integration
- production voice transport integration
- a full signing/issuance admin platform
- a decentralized registry network
- a broad media-provenance product across every platform

Those may come later.
They are not prerequisites for the first honest MVP.

## The next build target

The next thing DigiD should build is:

**A runnable local verifier demo over static JSON fixtures for the delegated voice flow.**

That means:
1. the repo contains actual happy-path fixture JSON
2. the repo contains degraded comparison fixtures
3. a protocol package validates object and envelope shapes
4. a verifier package resolves trust state from the fixture graph
5. a tiny CLI renders compact and expanded trust output

If that works, DigiD has a real MVP.
If that does not work, more adapter or platform discussion is premature.

## The exact next implementation slice

### Build now
1. create the happy-path delegated voice fixture family
2. create contrast fixtures for:
   - delegation revoked
   - revocation stale
   - missing delegation
   - verified human direct flow
   - unverified sender flow
3. scaffold `packages/protocol`
4. scaffold `packages/verifier`
5. scaffold `apps/demo-cli`
6. make the happy-path manifest verify end to end

### Do immediately after
1. add degraded trust resolution for revoked and stale cases
2. add compact and expanded renderer output
3. add replay-sensitive and lineage-conflict checks
4. compare scenarios side by side in the CLI

## Why Slack and Teams are not first

Slack and Teams matter, but right now they are **adoption test surfaces**, not the core MVP.

We do not yet need:
- a Slack dev account
- a Microsoft developer tenant
- platform app registrations

We will need those once the verifier core is real enough to justify adapter implementation.

## When Sophia should ask Master Warren for something

Sophia should reach out when DigiD hits a real external dependency, for example:
- Slack dev workspace or Slack app access
- Microsoft 365 or Teams developer tenant access
- Twilio or other voice platform credentials
- a domain, webhook, or API key
- a product decision on which channel to prioritize after the verifier MVP
- permission to test against a real target environment

The current repo state does **not** require those yet.
The current repo state requires fixtures and verifier code.

## Current project status in one sentence

**DigiD has enough protocol and architecture framework. The next honest move is to build the fixture-driven verifier MVP, not another round of channel-level design.**

## Default decision until changed

Unless Master Warren changes direction, the default near-term DigiD build order should be:
1. fixture family
2. protocol validation package
3. verifier package
4. demo CLI
5. only then, adapter implementation experiments
