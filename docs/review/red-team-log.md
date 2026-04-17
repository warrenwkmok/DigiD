# DigiD red-team log

This file records adversarial findings per meaningful DigiD iteration.
It should stay tightly coupled to build slices so attack paths feed the next implementation loop quickly.

## RT-001 - Verifier-first MVP implementation red-team pass
- date: 2026-04-16
- timestamp: 2026-04-16 20:05 America/Vancouver
- reviewed slice:
  - signed demo fixtures
  - verifier trust derivation
  - compact and expanded CLI rendering
- attack scenarios:
  - copied or screenshotted trust banners outside the verified surface can still overstate current authority if the surrounding context is lost
  - stale revocation checks may still look persuasive if a downstream adapter collapses warning surfaces
  - delegated-agent trust can be misread as organization endorsement of content truth rather than signer authenticity and current authority scope
- integration risks:
  - real platforms will introduce platform-identity mismatch states the current CLI does not yet render
  - replay protection is only fixture-local today; transport-facing replay behavior still needs real adapter assumptions
- exploitability notes:
  - the current implementation is strongest as an honest local verifier demo, not as a deployment-safe integration product
  - the first commercial adapter must not render the compact badge without the warning channel staying visible
- recommended mitigations:
  1. add explicit platform-mismatch result fields before Slack, voice gateway, or messaging adapter work begins
  2. add artifact-copy and out-of-context rendering warnings to the next CLI or verifier API slice
  3. preserve machine-readable warning codes end to end so adapters cannot silently smooth degraded trust into a green badge

## Status
- applied in this iteration:
  - red-team log artifact
- planned:
  - mismatch-state handling
  - artifact-context degradation rules in implementation, not docs only
