# DigiD red-team log

This file records adversarial findings per meaningful DigiD iteration.
It should stay tightly coupled to build slices so attack paths feed the next implementation loop quickly.

## RT-003 - Portable verifier contract and context-loss red-team pass
- date: 2026-04-17
- timestamp: 2026-04-17 10:05 America/Vancouver
- reviewed slice:
  - portable verifier result contract
  - local contract export mode
  - owner-binding mismatch fixture family
- attack scenarios:
  - an adapter consumes the exported compact label but drops the warning channel, recreating the same green-badge-overstatement problem in a new form
  - a live trust result is copied into a screenshot, transcript, or forwarded artifact without surfacing context degradation
  - future hosted API work starts from the exported contract and quietly grows into a public trust-decision service that gives away monetizable platform logic
- integration risks:
  - platform-identity mismatch is still advisory in the contract until fixtures or adapter profiles prove how the mismatch state should be triggered
  - live context-loss warnings now exist in vocabulary, but consuming surfaces could still ignore them unless contract conformance becomes testable
- exploitability notes:
  - this slice meaningfully hardens the adapter boundary by making warning preservation and context binding explicit
  - the commercial moat still depends on not open-sourcing hosted verifier operations, tenant policy control, or enterprise workflow surfaces
- recommended mitigations:
  1. add at least one mismatch or context-loss fixture scenario before any public adapter implementation
  2. treat contract conformance tests as the last public-safe adapter surface, not a hosted verifier runtime
  3. move any multi-tenant verification API, policy admin console, or registry operation code to a private repo before implementation starts

## Status
- applied in this iteration:
  - warning-preserving local result contract
  - owner-binding mismatch negative fixture
- planned:
  - context-loss and platform-mismatch fixture coverage
  - boundary check before service-shaped adapter work

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

## RT-002 - Owner-binding and verifier-boundary red-team pass
- date: 2026-04-17
- timestamp: 2026-04-17 00:00 America/Vancouver
- reviewed slice:
  - owner-binding enforcement in the reference verifier
  - policy extraction from manifest verification logic
  - CLI exposure of owner-binding and scope diagnostics
- attack scenarios:
  - an attacker presents a mathematically valid agent signature and counts on a UI collapsing the result back into generic verified-agent language
  - future API work grows from the public verifier into a hosted trust decision service, unintentionally giving away monetizable operational logic
  - a platform adapter hides owner-binding or scope warnings while keeping the positive compact label
- integration risks:
  - owner-binding gaps are now machine-readable, but downstream adapters could still discard the warning channel unless result contracts stay strict
  - the current public repo should not become the home for hosted policy evaluation, tenant-aware rule management, or registry operations
- exploitability notes:
  - this slice meaningfully reduces trust overstatement inside the reference verifier
  - the commercial moat still depends on not open-sourcing the operational platform that would turn these checks into a production trust service
- recommended mitigations:
  1. preserve owner-binding and authority-scope result fields in any future adapter contract
  2. keep any future verifier API local-only or clearly demo-scoped while the repo remains public
  3. move hosted verifier services, enterprise policy administration, and trust-registry operations to a private repo before implementation starts

## Status
- applied in this iteration:
  - owner-binding warnings in the reference verifier
- planned:
  - adapter-facing mismatch-state contracts
  - private-boundary split before hosted service work
