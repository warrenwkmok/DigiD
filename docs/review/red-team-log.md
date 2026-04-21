# DigiD red-team log

This file records adversarial findings per meaningful DigiD iteration.
It should stay tightly coupled to build slices so attack paths feed the next implementation loop quickly.

## RT-015 - Delegated key substitution and authority drift attacks
- date: 2026-04-20
- timestamp: 2026-04-20 14:34 America/Vancouver
- reviewed slice:
  - issuer-signed key binding blocks on attestations and delegations (`subject_key`, `delegate_key`)
  - reference verifier enforcement and a signed negative fixture proving downgrade (`voice.key-binding-mismatch`)
- attack scenarios:
  - delegated-key substitution: an issuer delegates to an agent identity but the agent later signs with a different key than the one the issuer intended (or the receiver assumes any current key is "good enough"), leading to silent authority drift
  - key-rotation ambiguity: an issuer rotates an agent key and an attacker reuses old delegated objects to claim authority under a new key (or vice versa), betting that verifiers collapse "signature valid" into a high-trust agent badge
  - kid-only confusion: a verifier matches only `kid` and fails to bind it to the subject identity key bytes, allowing digest/encoding drift or collision across implementations
- recommended mitigations:
  1. require explicit key bindings for high-trust delegated communication profiles, and downgrade when bindings are missing or mismatched
  2. bind key identity with both `kid` and a digest of the `SubjectPublicKeyInfo` bytes (`sha256:<hex>`) so receivers can detect key substitution
  3. keep key-rotation widening explicit: new keys should require updated bindings or a later key-authorization primitive rather than silent acceptance

## RT-014 - Proof cryptosuite stripping and demo-key misuse attacks
- date: 2026-04-20
- timestamp: 2026-04-20 11:35 America/Vancouver
- reviewed slice:
  - strict `proof.cryptosuite` disclosure and cryptosuite allowlisting in the v0.3 verifier profile
  - deterministic demo-only signing keys for fixture regeneration
- attack scenarios:
  - cryptosuite stripping: a sender omits `proof.cryptosuite` and hopes a verifier infers "close enough" from `proof.type` or key metadata, creating inconsistent behavior across SDKs and room for badge laundering
  - cryptosuite mismatch confusion: a sender claims one `proof.cryptosuite` while manipulating other proof metadata fields, hoping a verifier checks a subset of parameters and accepts a proof under ambiguous policy
  - demo-key copy/paste: developers accidentally reuse demo-only private keys outside fixtures (or in a prototype adapter), leading to predictable signatures and false expectations about key-management posture
- recommended mitigations:
  1. require `proof.cryptosuite` and reject missing/unsupported values (no inference, no "best effort")
  2. surface the claimed cryptosuite in crypto-detail views and portable result exports so adapters can’t hide algorithm-policy failures
  3. keep demo-only keys clearly confined to fixture tooling and never treat them as an issuer pattern or key-management strategy

## RT-013 - Key encoding confusion and digest-prefix downgrade attacks
- date: 2026-04-20
- timestamp: 2026-04-20 08:33 America/Vancouver
- reviewed slice:
  - key record encoding disclosure (`keys[].public_key_encoding`) and verifier enforcement
  - digest-prefix allowlisting and sha256-only posture for v0.3
- attack scenarios:
  - key encoding confusion: a sender publishes a `public_key` that can be interpreted in multiple ways across implementations (or causes a fallback parser path), leading to inconsistent verification results and potential badge laundering when one verifier "accepts" what another rejects
  - digest-prefix downgrade: a sender supplies `content_digest` strings with non-sha256 prefixes or malformed hex, hoping a verifier treats them as informational metadata rather than a strict binding parameter for detached content
  - verifier drift across languages: different SDKs accept different encodings/prefixes and an attacker exploits that split to target specific receivers
- recommended mitigations:
  1. require explicit key encoding disclosure and reject unsupported encodings (no implicit parsing fallbacks)
  2. treat digest prefixes as strict, signed parameters and enforce sha256-only in v0.3
  3. keep multi-suite/key-encoding support receiver-controlled and versioned if it ever appears

## RT-012 - Retroactive revocation and repudiation-by-backdating
- date: 2026-04-20
- timestamp: 2026-04-20 05:33 America/Vancouver
- reviewed slice:
  - revocation timing posture (`created_at` vs `revoked_at`) and key revocation targeting by `kid`
  - verifier warning vocabulary for backdated revocation claims (`revocation-backdated`)
- attack scenarios:
  - repudiation-by-backdating: an issuer publishes a revocation statement after the fact with `revoked_at` set earlier than issuance and hopes verifiers treat it as rewriting event-time validity, letting an issuer deny or suppress previously "valid" communications
  - selective history edits: a compromised issuer selectively backdates only some keys/delegations to invalidate specific signed artifacts while leaving others apparently clean
  - target ambiguity: revocation statements target keys by `kid`; if `kid` conventions are not globally unique and unambiguous across issuer/subject contexts, an attacker can craft collisions that let revocations hit the wrong key
- recommended mitigations:
  1. require signed `created_at` on revocations and default to non-retroactive effective timing (`max(revoked_at, created_at)` with small skew allowance)
  2. surface a stable warning (`revocation-backdated`) whenever a revocation claims an effective time that significantly predates its issuance
  3. keep revocation distribution services, issuer admin tooling, and compromise response workflows as outside this reference repo's current scope

## RT-011 - Signing key lifecycle and "still valid" badge abuse
- date: 2026-04-20
- timestamp: 2026-04-20 02:36 America/Vancouver
- reviewed slice:
  - signing-key lifecycle enforcement in the reference verifier (purpose + window + current-time operational status)
  - portable result contract updates requiring key lifecycle fields to remain visible to adapters
- attack scenarios:
  - badge laundering: a signed artifact remains mathematically valid, but the signing key is no longer operationally active; an adapter suppresses that fact while keeping a high-trust compact label
  - key-purpose confusion: a verifier accepts signatures from keys not authorized for `assertion`, letting authentication-only keys be misused to mint trust-bearing communication artifacts
  - status overreach: a product treats `status: revoked` as proof of a past revocation moment and makes incorrect historical claims, or conversely ignores `status` and overstates current-time trust
- recommended mitigations:
  1. enforce key purpose and lifecycle posture in the verifier and expose it in stable machine-readable checks
  2. require adapters to preserve signing-key lifecycle fields and to surface warnings when current-time key status blocks a live trust claim
  3. keep key compromise workflows, key-management operations, and revocation distribution infrastructure outside this reference repo's current scope

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
  - any hosted key assurance scoring, issuer key lifecycle dashboards, or enterprise crypto policy engines are outside this repo's current scope
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
  - future product work starts encoding customer-specific restriction matrices in the reference repo under the guise of `better scope diagnostics`
- integration risks:
  - scope diagnostics are appropriate only while they stay transparent, signed-input-derived, and fixture-audited
  - any admin workflow for defining delegation templates, custom restriction catalogs, or tenant policy exceptions belongs outside the current reference scope
- exploitability notes:
  - the new fixture materially hardens the verifier because an attacker can no longer rely on the current repo having only generic or missing regression coverage for delegation scope conflicts
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
  - any workflow for acquiring, distributing, or administering pinned org roots is scope-sensitive and should not be implemented as a hosted public service in this repo
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
  - issuer trust is now explicitly policy-bound; any future hosted policy registry, issuer administration, or enterprise trust-root workflow is outside this repo's current scope
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
  - conformance, tenancy, and rollout tooling should remain outside the current reference scope
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
  - no hosted adapter conformance work in the current reference scope

## RT-005 - Presentation guardrail red-team pass
- date: 2026-04-17
- timestamp: 2026-04-17 13:35 America/Vancouver
- reviewed slice:
  - local presentation guardrail evaluator
  - CLI simulation of platform mismatch and context loss
- attack scenarios:
  - a future adapter reuses the positive verifier contract but never applies mismatch or context-loss degradation when the surrounding surface changes
  - presentation warning synthesis logic quietly migrates into a hosted API, absorbing adapter decision behavior and tenant-specific UX control
  - a copied artifact inherits a positive compact label because downstream tooling treats verifier output as screenshot-safe by default
- integration risks:
  - the reference repo still lacks a standardized evidence shape for platform-native identity binding, so different adapters could simulate mismatch inconsistently
  - warning synthesis logic could become too channel-specific if it keeps expanding without a bounded adapter profile contract
- exploitability notes:
  - this slice materially hardens the current public reference surface by making out-of-context and platform-mismatch degradation executable
  - hosted adapter runtimes, policy administration, or enterprise trust-decision operations should remain outside the current reference scope
- recommended mitigations:
  1. standardize a narrow adapter evidence input before adding more presentation cases
  2. keep guardrail evaluation local and transparent in the reference repo
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
  - hosted adapter logic could be introduced later under the guise of "profile conformance" and gradually absorb trust-decision behavior that should stay local to the reference layer
- integration risks:
  - the docs describe mismatch handling, but the repo still lacks a concrete signed adapter evidence schema for platform-native identity binding
  - without a fixture-backed evidence shape, downstream adapters can implement the right warning text while skipping the real binding test
- exploitability notes:
  - this is exploitable as a presentation downgrade: a receiver can be shown a positive compact label with no mechanically verified platform-binding proof behind it
  - the gap is appropriate to close with local fixtures and contract code, but not with a hosted decision service
- recommended mitigations:
  1. add a minimal signed adapter evidence object or fixture-backed profile for platform identity binding
  2. require the public contract to synthesize mismatch only from that evidence object, not from manual flags alone
  3. keep adapter conformance evaluation local and transparent until the reference repo stops being the source of trust decisions

## Status
- applied in this iteration:
  - RT-006 evidence-contract gap logged
- planned:
  - fixture-backed adapter evidence profile
  - local-only conformance checks for mismatch/context loss
- planned:
  - bounded adapter evidence contract
  - no hosted adapter service work in the current reference scope

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
  - future hosted API work starts from the exported contract and quietly grows into a trust-decision service that absorbs platform logic
- integration risks:
  - platform-identity mismatch is still advisory in the contract until fixtures or adapter profiles prove how the mismatch state should be triggered
  - live context-loss warnings now exist in vocabulary, but consuming surfaces could still ignore them unless contract conformance becomes testable
- exploitability notes:
  - this slice meaningfully hardens the adapter boundary by making warning preservation and context binding explicit
  - hosted verifier operations, tenant policy control, or enterprise workflow surfaces should remain outside the current reference scope
- recommended mitigations:
  1. add at least one mismatch or context-loss fixture scenario before any public adapter implementation
  2. treat contract conformance tests as the last bounded adapter surface, not a hosted verifier runtime
  3. keep any multi-tenant verification API, policy admin console, or registry operation code outside this repo before implementation starts

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
  - local audit tooling slowly expands into a hosted verification or regression service that absorbs operational capability
- integration risks:
  - delegation-scope conflict and platform-identity mismatch still do not have equivalent audited negative fixtures
  - authoring new signed negative cases is still awkward without a clearly bounded demo-key strategy
- exploitability notes:
  - this slice removes an easy way to hide trust-label regressions behind expected fixture text
  - it is still safe as local reference tooling, but it should not become the seed of a public hosted trust-decision platform
- recommended mitigations:
  1. add the next audited negative fixture around delegation-scope conflict once the demo-key strategy is decided
  2. keep the audit command local-only while the repo remains public
  3. keep any hosted regression dashboards, tenant policy controls, or operational trust pipelines outside this repo before implementation

## Status
- applied in this iteration:
  - audited owner-binding mismatch coverage
  - runtime-derived compact-banner validation
- planned:
  - delegation-scope conflict regression coverage
  - no hosted regression or verification tooling in the current reference scope

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

## RT-002 - Owner-binding and verifier-scope red-team pass
- date: 2026-04-17
- timestamp: 2026-04-17 00:00 America/Vancouver
- reviewed slice:
  - owner-binding enforcement in the reference verifier
  - policy extraction from manifest verification logic
  - CLI exposure of owner-binding and scope diagnostics
- attack scenarios:
  - an attacker presents a mathematically valid agent signature and counts on a UI collapsing the result back into generic verified-agent language
  - future API work grows from the reference verifier into a hosted trust decision service, unintentionally absorbing operational logic
  - a platform adapter hides owner-binding or scope warnings while keeping the positive compact label
- integration risks:
  - owner-binding gaps are now machine-readable, but downstream adapters could still discard the warning channel unless result contracts stay strict
  - the current reference repo should not become the home for hosted policy evaluation, tenant-aware rule management, or registry operations
- exploitability notes:
  - this slice meaningfully reduces trust overstatement inside the reference verifier
  - the operational platform that would turn these checks into a production trust service is outside this repo's scope
- recommended mitigations:
  1. preserve owner-binding and authority-scope result fields in any future adapter contract
  2. keep any future verifier API local-only or clearly demo-scoped while the repo remains public
  3. keep hosted verifier services, enterprise policy administration, and trust-registry operations outside this repo before implementation starts

## Status
- applied in this iteration:
  - owner-binding warnings in the reference verifier
- planned:
  - adapter-facing mismatch-state contracts
  - no hosted service work in the current reference scope

## RT-003 - Delegated key authorization red-team pass
- date: 2026-04-20
- timestamp: 2026-04-20 17:36 America/Vancouver
- reviewed slice:
  - `dgd.key_authorization` as a rotation overlap bridge for delegated agents
  - verifier behavior when `subject_key` / `delegate_key` bindings no longer match the signing key
- attack scenarios:
  - attacker attempts to reuse a legitimate `dgd.key_authorization` across a different delegation by swapping `delegation_id` or relying on a verifier that does not check the issuer/delegation linkage
  - attacker crafts a kid-collision / silent key replacement attempt where the `kid` matches but the public key material differs, hoping the verifier checks only kid and not digest
  - attacker presents an expired or revoked key authorization and counts on a UI showing the positive trust label without surfacing the warning channel
- integration risks:
  - adapters might render `org-issued-agent` while dropping `key_binding_method`/`key_authorization_status`, hiding whether the issuer actually bound the live signing key
  - a future hosted verifier service might be tempted to absorb key-rotation approvals, issuance logs, or revocation distribution into this repo’s reference scope
- recommended mitigations:
  1. require `issuer_id` to match the referenced delegation issuer and require `authorized_key.public_key_digest` equality, not kid-only
  2. treat expired/revoked key authorization as a first-class downgrade path with stable warning codes
  3. preserve machine-readable evidence (`key_binding_method`, `key_authorization_*`) in the portable result contract so adapter UIs cannot silently smooth trust transitions

