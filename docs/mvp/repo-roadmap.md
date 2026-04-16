# DigiD repo roadmap

## Phase 1 — concept and protocol foundation
- define the product thesis
- define the trust states
- define identity, attestation, and signing models
- define the MVP wedge
- define privacy and threat-model stance

## Phase 2 — reference architecture
- model verifier service
- model registry and revocation service
- define adapter contracts
- define trust-indicator UI behavior

## Phase 3 — prototype implementation
- create a simple identity object format
- create a signing and verification library
- build a basic verifier API
- build a small demo UI for trust-state display

## Phase 4 — channel proof of concept
- prototype one voice use case
- prototype one messaging or email use case
- prototype one media provenance use case

## Phase 5 — productization
- org admin model
- delegated agent issuance
- key rotation and recovery flows
- enterprise and developer integrations

## Immediate next steps
- turn the v0.3 docs into actual demo fixture JSON files plus a fixture manifest contract
- centralize verifier policy for freshness, replay handling, and duplicate-envelope posture
- add verifier UX guidance so trust banners and warnings do not overstate what DigiD proves
- decide whether `dgd.communication` is mandatory for all live profiles or only for the first demo profile
- choose whether the first code should be a verifier API or signing SDK after the fixture contract is stable
