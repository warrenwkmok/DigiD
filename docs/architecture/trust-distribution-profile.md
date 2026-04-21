# DigiD trust distribution profile v0.3

## Purpose

DigiD already says issuer trust is receiver-side policy input.
For a public framework draft, that is not enough by itself.
Outside readers also need to know what a receiver-side trust input looks like, how broad its scope is, and how DigiD avoids drifting into a hidden trust-registry product.

This document defines the v0.3 trust distribution posture:
- trust is still receiver-controlled
- trust inputs may be packaged and reused
- sender-provided trust roots are never authoritative
- registry operations, tenant policy consoles, and commercial onboarding workflows remain outside this repo

## Why this exists

Without a concrete trust distribution profile, DigiD stays vulnerable to two opposite failures:
- everything looks local and ad hoc, so outside implementers cannot tell how public verification would ever work
- everything sounds global and automatic, so readers assume DigiD is secretly promising a universal registry it does not have

The v0.3 answer is narrower:
- DigiD should standardize receiver-managed trust bundles
- those bundles must disclose their scope and governance class
- DigiD should not standardize hosted registry operations in the public repo yet

## Trust input classes

The first public DigiD framework should recognize three receiver-side trust input classes.

### 1. Local receiver roots

This is the narrowest trust input.
The receiver pins one or more issuer or organization identities for its own environment.

Properties:
- strongest fit for enterprise or private deployments
- valid for `receiver-anchored` organization trust
- not automatically transferable to other receivers
- must never be described as universal public verification

### 2. Partner trust bundles

This is a shared but scope-limited trust input.
Multiple parties agree on a curated issuer list for a defined ecosystem, business network, or channel surface.

Properties:
- broader than one receiver's local roots
- still bounded to a named scope, not the whole public internet
- useful for partner organizations, platform ecosystems, and closed industry groups
- may justify `verified-organization` or scoped human trust only within the bundle's declared audience

### 3. Public trust bundles

This is the broadest v0.3 trust input.
A bundle operator publishes a curated set of independent issuers for public consumption.

Properties:
- intended for broad public verifier adoption
- required for DigiD to say anything stronger about general-purpose `verified-human` trust without falling back to opaque receiver pinning
- must disclose operator identity, review policy, and change history
- still does not imply one mandatory global registry

## Minimum trust bundle contract

In v0.3, a trust bundle is a verifier-side policy artifact, not a DigiD sender object.
It may be stored as a local file, packaged config, pinned remote document, or another integrity-protected distribution format.

At minimum, a reusable trust bundle should declare:
- `bundle_id`
- `bundle_class` (`local`, `partner`, or `public`)
- `version`
- `published_at`
- bundle operator identity or accountable maintainer
- audience scope and subject classes the bundle is meant to cover
- one or more issuer entries
- status and expiry information
- a changelog or supersession pointer

Each issuer entry should declare at least:
- `issuer_id`
- issuer class (`owner`, `platform`, `independent-issuer`, or receiver-operated equivalent)
- allowed subject classes
- allowed trust ceiling
- current status
- evidence or policy reference sufficient for bundle reviewers to justify inclusion

## Governance expectations by bundle class

### Local

Local roots are governed by the receiver.
They may be fast-moving and environment-specific.
Their meaning must stay explicitly local.

Minimum expectations:
- clear owner for the local policy
- explicit pin or allowlist mechanism
- no UI wording that implies public verification

### Partner

Partner bundles need enough governance to stop bilateral shortcuts from masquerading as universal truth.

Minimum expectations:
- named operator or working group
- declared audience and scope boundary
- documented admission and removal criteria
- versioned updates that receivers can review before adoption

### Public

Public bundles carry the highest overstatement risk and therefore need the clearest governance posture.

Minimum expectations:
- publicly named accountable operator
- human-reviewable admission criteria
- public change log or release notes
- explicit removal and emergency-update path
- bundle expiry or freshness expectation so stale trust sets do not look current forever
- clear statement of which trust claims the bundle is allowed to support

## Mandatory verifier rules

For high-trust DigiD outcomes:
- verifiers MUST treat trust bundles as receiver-adopted inputs, not sender-selected inputs
- senders MUST NOT be able to upgrade trust by embedding, referencing, or choosing the bundle used for evaluation
- verifiers SHOULD preserve the trust-input class (`local`, `partner`, or `public`) in machine-readable diagnostics and any expanded UX
- compact UX MUST NOT collapse a local receiver root and a public trust bundle into the same unqualified "verified" story

Practical consequences:
- `verified-human` should normally require an acceptable independent issuer listed in a receiver-adopted public trust bundle, unless the receiver is intentionally applying an explicit equivalent local anchor
- `verified-organization` outside direct receiver anchoring should require a receiver-adopted partner or public bundle, not a sender self-description
- owner-backed agent trust may still rely on local or partner trust input when the receiver is evaluating attributable authority rather than public universal reputation

## Reference-repo mapping

The current reference verifier does not implement bundle fetch, refresh, governance workflows, or operator signatures.

What it does implement:
- local `trusted_issuer_ids` as verifier policy input
- manifest-scoped examples of receiver anchoring for the fixture suite

How that maps to this profile:
- fixture `trusted_issuer_ids` are the smallest possible `local` trust bundle equivalent
- they validate the trust-shape concept without claiming public registry operations
- they are intentionally insufficient as a public distribution design by themselves

## Non-goals for v0.3

This profile does not standardize:
- a mandatory global issuer registry
- automatic issuer discovery on the public internet
- hosted trust-bundle administration consoles
- billing, tenancy, enterprise onboarding, or commercial moderation workflows
- a signed `dgd.trust_bundle` protocol object

Those may become later implementation or standards questions, but they should not be smuggled into the public reference repo as if they were already solved.

## Release posture

This profile makes DigiD's trust-root story more concrete and publicly legible:
- local trust is local
- shared trust can be packaged as a partner bundle
- broad public trust should come from a governed public bundle, not from sender claims

That is enough to make the framework more coherent.
It is not enough, by itself, to make DigiD publicly release-ready yet.

The remaining public-release gaps are:
- no executable trust-bundle contract in the reference implementation yet
- no stable verifier result field that preserves trust-input class across adapters
- no finalized governance model for any future public bundle operator or federation
