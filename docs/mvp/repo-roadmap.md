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
- turn the v0.3 docs into actual demo fixture JSON files using the fixture manifest contract, now including explicit `dgd.session` and optional `dgd.artifact` objects
- apply the verifier policy profile in the first CLI or API implementation, with session-scope replay checks resolved from signed session lineage
- add verifier UX guidance so trust banners and warnings do not overstate what DigiD proves
- decide whether `dgd.communication` is mandatory for all live profiles or only for the first demo profile
- choose whether the first code should be a verifier API or signing SDK after the fixture contract is stable
- create a separate media provenance profile-family track inside the same repo, covering recorded and published media like YouTube, Instagram, TikTok, and prerecorded audio/video without diluting the live communication wedge
- write an initial strategy doc for the media provenance track that defines reuse of DigiD core primitives versus new media-specific objects, manifests, transformation lineage, and trust-state UX
- add a standing red-team pass to every meaningful design/build iteration so adversarial findings feed into the critique loop before the next slice ships
- add a standing adoption-loop pass to every meaningful design/build iteration so each slice is tested against real-world platforms, domains, adapter strategies, and rollout constraints before the next slice ships
- decide whether the red-team reviewer should remain a doc-defined role inside DigiD first or become a dedicated agent/runtime workflow once the first verifier implementation exists
- decide whether the adoption-loop reviewer should remain a doc-defined role at first or become a dedicated recurring workflow that evaluates target surfaces like Slack, voice systems, email, messaging, and media platforms
