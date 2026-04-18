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

## Current implementation status

DigiD now includes a runnable verifier-first MVP slice:
- signed demo fixtures for delegated agent, verified human, and unverified sender voice scenarios
- audited negative fixtures for missing delegation, delegation purpose conflict, stale checks, revoked delegation, and owner-binding mismatch
- a protocol package for canonicalization, shape validation, lineage checks, and signature verification
- a verifier package that resolves event-time vs current-time trust outcomes
- a demo CLI that renders compact trust banners, expanded verification details, portable result contracts, manifest-audit output, and local presentation-guardrail simulations
- a portable local verifier result contract plus a fixture-backed local adapter evidence contract so future adapter experiments can trigger mismatch/context-loss deterministically without shipping hosted adapter decision services

## Run the demo

Generate the signed fixtures:

```bash
node scripts/generate-demo-fixtures.mjs
```

Verify the happy-path delegated agent scenario:

```bash
node apps/demo-cli/src/index.js verify fixtures/demo/manifests/voice.happy-path.manifest.json
```

Verify the delegated purpose-conflict scenario:

```bash
node apps/demo-cli/src/index.js verify fixtures/demo/manifests/voice.delegation-purpose-conflict.manifest.json
```

Compare two scenarios:

```bash
node apps/demo-cli/src/index.js compare fixtures/demo/manifests/voice.happy-path.manifest.json fixtures/demo/manifests/voice.delegation-revoked.manifest.json
```

Audit the full checked-in manifest suite against expected decisions, warnings, and verifier checks:

```bash
node apps/demo-cli/src/index.js audit fixtures/demo/manifests
```

Export the portable verifier result contract:

```bash
node apps/demo-cli/src/index.js export fixtures/demo/manifests/voice.happy-path.manifest.json
```

Apply local presentation guardrails to simulate a platform mismatch or copied artifact:

```bash
node apps/demo-cli/src/index.js present fixtures/demo/manifests/voice.happy-path.manifest.json --platform-mismatch
node apps/demo-cli/src/index.js present fixtures/demo/manifests/voice.happy-path.manifest.json --context-loss
```

Apply fixture-backed adapter evidence and audit presentation expectations:

```bash
node apps/demo-cli/src/index.js present-evidence fixtures/demo/presentation/voice.platform-mismatch.presentation.json
node apps/demo-cli/src/index.js present-audit fixtures/demo/presentation
```

## Active review loop

DigiD now keeps per-iteration review artifacts under `docs/review/`:
- `critique-log.md`
- `red-team-log.md`
- `design-feedback-log.md`

Those logs are intended to feed the next design/build loop instead of leaving critique as disconnected commentary.
