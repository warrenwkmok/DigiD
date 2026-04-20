# DigiD red-team log

This file records adversarial findings per meaningful DigiD iteration.
It should stay tightly coupled to build slices so attack paths feed the next implementation loop quickly.

## RT-010 - Cryptosuite downgrade and algorithm-confusion red-team pass
- date: 2026-04-19
- timestamp: 2026-04-19 23:28 America/Vancouver
- reviewed slice:
  - v0.3 cryptosuite disclosure and strict enforcement in the reference verifier
  - verifier outputs carrying an explicit cryptosuite identifier and proof/digest algorithm diagnostics
  - UX guidance for keeping cryptographic details out of compact labels
- attack scenarios:
  - algorithm confusion: a sender provides identity/key metadata that claims one algorithm while the proof metadata implies another, hoping a verifier "tries both" or a UI upgrades trust based on the wrong field
  - downgrade pressure: issuers introduce new suites and rely on verifiers treating "unknown but verified" as acceptable, leading to silent acceptance of weaker or non-audited suites
  - UI misdirection: a product exposes cryptographic details in primary trust badges, training users to trust the presence of crypto jargon rather than the authority and policy checks DigiD actually performs
- integration risks:
  - multi-suite support is a policy surface: without receiver-controlled suite allowlists and explicit downgrade behavior, "crypto agility" becomes an exploit path
  - any hosted key assurance scoring, issuer key lifecycle dashboards, or enterprise crypto policy engines are private-boundary candidates and should not be implemented in this public repo
- recommended mitigations:
  1. keep v0.3 locked to one suite and reject mismatches or missing key algorithm disclosure
  2. if/when multiple suites exist, make acceptance receiver-controlled (explicit allowlist) and keep UX stable (suite id in debug, not marketing badges)
  3. treat unsupported suites as explicit verification failures rather than degraded-but-green trust states

## RT-009 - Delegation purpose-conflict red-team pass
- date: 2026-04-18
- timestamp: 2026-04-18 14:20 America/Vancouver
- reviewed slice:
  - reason-specific scope-conflict wording in verifier output
  - signed `voice.delegation-purpose-conflict` negative fixture
  - protocol wording that keeps one stable `delegation-scope-conflict` code while preserving the failed scope dimension in copy
- attack scenarios:
  - a malicious sender presents a perfectly signed agent interaction for a real organization, but switches the communication purpose to one the delegation never authorized and relies on generic UI copy to hide the difference
  - an adapter preserves the positive actor/org identity chips while suppressing the authority-scope reason, leading receivers to assume the communication is still within delegated bounds
  - future product work starts encoding customer-specific restriction matrices in the public repo under the guise of `better scope diagnostics`
- integration risks:
  - scope diagnostics are public-safe only while they stay transparent, signed-input-derived, and fixture-audited
  - any admin workflow for defining delegation templates, custom restriction catalogs, or tenant policy exceptions belongs on the private side of the boundary
- exploitability notes:
  - the new fixture materially hardens the public verifier because an attacker can no longer rely on the current repo having only generic or missing regression coverage for delegation scope conflicts
  - preserving `purpose not delegated` in compact copy reduces the chance that a receiver treats the warning as generic noise
- recommended mitigations:
  1. keep scope-conflict copy derived strictly from signed purpose/channel/action inputs
  2. require adapters to preserve degraded authority wording whenever `delegation-scope-conflict` is present
  3. keep delegation authoring tools, enterprise policy management, and customer-specific restriction workflows private before implementation

## RT-008 - Verified organization + pinned trust root red-team pass
- date: 2026-04-18
- timestamp: 2026-04-18 12:54 America/Vancouver
- reviewed slice:
  - `verified-organization` trust state rendered from receiver-pinned trust roots
  - `message.verified-organization` async-message fixture family
  - receiver UX note about `issuer not trusted` being a policy gap
- attack scenarios:
  - a sender (or attacker) tricks an integration into accepting sender-supplied `trusted_issuer_ids` (or equivalent) so an attacker-controlled org id is treated as "verified organization"
  - a UI treats "pinned" as universally verified and hides the fact that the trust root is locally configured, leading users to overgeneralize the meaning of "verified organization"
  - a malicious actor uses a lookalike org display name and relies on a receiver pinning the wrong org id (social engineering / misbinding)
- integration risks:
  - any workflow for acquiring, distributing, or administering pinned org roots is boundary-sensitive and should not be implemented as a hosted public service in this repo
  - if adapters suppress `issuer-untrusted` or similar warnings while keeping positive trust chips, they recreate the "fake verified ecosystem" attack path
- recommended mitigations:
  1. treat pinned trust roots as receiver-side configuration only; never accept them from sender inputs in real deployments
  2. keep trust-root administration, issuer discovery, and trust registry operations private before implementation
  3. keep UX wording explicit that unanchored issuers are a policy gap, not a signature failure

## RT-007 - Trusted issuer anchors red-team pass
- date: 2026-04-18
- timestamp: 2026-04-18 00:55 America/Vancouver
- reviewed slice:
  - `verification_defaults.trusted_issuer_ids` as a minimal trust-root input
  - `issuer-untrusted` warning and `voice.issuer-untrusted` regression scenario
  - explicit `org-issued-agent` trust state rendering
- attack scenarios:
  - an attacker creates a fully self-consistent org + agent + attestation + delegation graph and relies on a verifier treating internal signature consistency as "verified"
  - an integration accidentally accepts a sender-supplied manifest (or equivalent policy input) that smuggles in a malicious issuer allowlist and upgrades trust incorrectly
  - a UI collapses high-trust states back into generic "verified agent" language, masking which authority actually backs the communication
- integration risks:
  - issuer trust is now explicitly policy-bound; any future hosted policy registry, issuer administration, or enterprise trust-root workflow is a private-boundary candidate and should not be implemented in this public repo
  - if adapters drop `issuer-untrusted` warnings while keeping a positive label, they recreate the original exploit path
- exploitability notes:
  - adding the `issuer-untrusted` scenario is a strong regression guardrail: it proves the verifier refuses to upgrade trust without an explicit trusted issuer anchor
  - the `org-issued-agent` trust chip reduces ambiguity about who is accountable for agent actions
- recommended mitigations:
  1. treat trusted issuer anchors as receiver-side configuration only; never accept them from the sender in real deployments
  2. keep trust-root administration, issuer discovery, and trust registry operations private before implementation
  3. keep warning codes mandatory in any adapter rendering path so issuer-untrusted cannot be silently suppressed

## RT-006 - Adapter evidence contract red-team pass
- date: 2026-04-18
- timestamp: 2026-04-18 00:10 America/Vancouver
- reviewed slice:
  - local `dgd.adapter_evidence` contract
  - fixture-backed platform-mismatch and context-loss evidence
  - demo CLI `present-evidence` and `present-audit` flows
- attack scenarios:
  - an adapter reuses a positive verifier contract but never records whether the verified surface was preserved, allowing copied artifacts to inherit a trust badge
  - an adapter claims platform mismatch checks exist while never actually providing a deterministic binding-status input
  - the local evidence contract slowly accumulates customer rules and becomes a de facto hosted adapter policy engine
- integration risks:
  - if additional adapter fields proliferate without discipline, the evidence contract will stop being auditable and start acting like channel-specific workflow state
  - a future platform-binding primitive may need signing or countersigning, but conflating that future need with the current local evidence contract would blur protocol and presentation responsibilities
- exploitability notes:
  - this slice materially hardens the current public reference surface because mismatch and context-loss can now be regression-tested from checked-in evidence files instead of manual flags
  - the commercial moat still depends on keeping conformance, tenancy, and rollout tooling outside the public repo
- recommended mitigations:
  1. keep adapter evidence schema small and local-only
  2. require fixture-backed presentation audit before expanding to a second adapter family
  3. move any hosted adapter conformance services, tenant-aware rendering APIs, or enterprise rollout tooling private before implementation

## Status
- applied in this iteration:
  - fixture-backed adapter evidence schema
  - presentation expectation audit over local evidence files
- planned:
  - boundary decision for any future signed platform-binding object
  - private-boundary split before hosted adapter conformance work

## RT-005 - Presentation guardrail red-team pass
- date: 2026-04-17
- timestamp: 2026-04-17 13:35 America/Vancouver
- reviewed slice:
  - local presentation guardrail evaluator
  - CLI simulation of platform mismatch and context loss
- attack scenarios:
  - a future adapter reuses the positive verifier contract but never applies mismatch or context-loss degradation when the surrounding surface changes
  - presentation warning synthesis logic quietly migrates into a hosted public API, giving away monetizable adapter decision behavior and tenant-specific UX control
  - a copied artifact inherits a positive compact label because downstream tooling treats verifier output as screenshot-safe by default
- integration risks:
  - the public repo still lacks a standardized evidence shape for platform-native identity binding, so different adapters could simulate mismatch inconsistently
  - warning synthesis logic could become too channel-specific if it keeps expanding without a bounded adapter profile contract
- exploitability notes:
  - this slice materially hardens the current public reference surface by making out-of-context and platform-mismatch degradation executable
  - the commercial moat still depends on not open-sourcing hosted adapter runtimes, policy administration, or enterprise trust-decision operations
- recommended mitigations:
  1. standardize a narrow adapter evidence input before adding more presentation cases
  2. keep guardrail evaluation local and transparent in the public repo
  3. move any hosted adapter conformance services, tenant-aware rendering APIs, or enterprise rollout tooling private before implementation

## Status
- applied in this iteration:
  - local mismatch/context-loss warning synthesis
  - demoable guardrail degradation for copied or mismatched surfaces

## RT-006 - Adapter evidence contract red-team pass
- date: 2026-04-17
- timestamp: 2026-04-17 21:34 America/Vancouver
- reviewed slice:
  - portable verifier contract
  - presentation guardrail synthesis
  - Slack adapter concept and normative protocol wording
- attack scenarios:
  - an adapter inherits the portable result contract but supplies platform identity as an unstated local flag, so mismatch becomes a UI choice instead of a signed evidence check
  - a forwarded or quoted artifact still looks verifiable because the current public contract can synthesize `platform-identity-mismatch` and `artifact-context-missing`, but it cannot yet prove a channel-specific binding object for Slack, email, or other adapters
  - hosted adapter logic could be introduced later under the guise of "profile conformance" and gradually absorb trust-decision behavior that should stay local or private-boundary
- integration risks:
  - the docs describe mismatch handling, but the repo still lacks a concrete signed adapter evidence schema for platform-native identity binding
  - without a fixture-backed evidence shape, downstream adapters can implement the right warning text while skipping the real binding test
- exploitability notes:
  - this is exploitable as a presentation downgrade: a receiver can be shown a positive compact label with no mechanically verified platform-binding proof behind it
  - the gap is public-safe to close with local fixtures and contract code, but not with a hosted decision service
- recommended mitigations:
  1. add a minimal signed adapter evidence object or fixture-backed profile for platform identity binding
  2. require the public contract to synthesize mismatch only from that evidence object, not from manual flags alone
  3. keep adapter conformance evaluation local and transparent until the public repo stops being the source of trust decisions

## Status
- applied in this iteration:
  - RT-006 evidence-contract gap logged
- planned:
  - fixture-backed adapter evidence profile
  - local-only conformance checks for mismatch/context loss
- planned:
  - bounded adapter evidence contract
  - private-boundary split before any hosted adapter service work

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

## RT-004 - Manifest-audit and runtime-label red-team pass
- date: 2026-04-17
- timestamp: 2026-04-17 12:43 America/Vancouver
- reviewed slice:
  - manifest expectation matching
  - runtime compact-banner derivation
  - audited owner-binding mismatch coverage
- attack scenarios:
  - a verifier regression changes the compact banner or warning set while the fixture metadata still claims the old behavior
  - the owner-binding mismatch path exists in the repo but quietly drops out of the active demo loop because nobody checks it continuously
  - local audit tooling slowly expands into a hosted verification or regression service that gives away monetizable operational capability
- integration risks:
  - delegation-scope conflict and platform-identity mismatch still do not have equivalent audited negative fixtures
  - authoring new signed negative cases is still awkward without a clearly public-safe demo-key strategy
- exploitability notes:
  - this slice removes an easy way to hide trust-label regressions behind expected fixture text
  - it is still safe as local reference tooling, but it should not become the seed of a public hosted trust-decision platform
- recommended mitigations:
  1. add the next audited negative fixture around delegation-scope conflict once the demo-key strategy is decided
  2. keep the audit command local-only while the repo remains public
  3. move any hosted regression dashboards, tenant policy controls, or operational trust pipelines to a private repo before implementation

## Status
- applied in this iteration:
  - audited owner-binding mismatch coverage
  - runtime-derived compact-banner validation
- planned:
  - delegation-scope conflict regression coverage
  - private-boundary split before any hosted regression or verification tooling

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
