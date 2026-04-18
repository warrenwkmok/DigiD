# DigiD adapter evidence contract v0.1

## Purpose

The public DigiD repo needs one bounded way for local adapter experiments to say:
- verified context is still present
- verified context has been lost
- platform-native identity still matches the DigiD trust path
- platform-native identity no longer matches it

This contract exists so those states are reproducible from fixtures instead of ad hoc CLI flags.

## Public-safe boundary

This contract is public-safe only because it stays:
- local
- transparent
- fixture-backed
- narrow

It is not:
- a hosted adapter decision API
- a tenant-aware policy engine
- a production rollout control plane
- a new signed DigiD protocol object

## Contract shape

```json
{
  "evidence_type": "dgd.adapter_evidence",
  "schema_version": "0.1",
  "evidence_id": "dgd:evidence:voice_platform_mismatch",
  "manifest_path": "fixtures/demo/manifests/voice.happy-path.manifest.json",
  "adapter_profile": "voice-sidecar-v0",
  "presentation_context": {
    "verified_context_status": "preserved",
    "surface": "voice_call_ui",
    "context_source": "live_sidecar"
  },
  "platform_identity": {
    "binding_status": "mismatch",
    "platform": "pstn",
    "native_label": "+1-555-0100 Acme callback",
    "verified_label": "Acme Support Agent 01"
  },
  "expected_outcome": {
    "effective_decision": "allow-with-warning",
    "effective_compact_label": "Verified agent, platform identity mismatch",
    "synthesized_warning_codes": ["platform-identity-mismatch"],
    "effective_warning_codes": ["platform-identity-mismatch"],
    "presentation_context": {
      "verified_context_status": "preserved",
      "platform_identity_status": "mismatch"
    }
  }
}
```

## Required fields

- `evidence_type`
- `schema_version`
- `evidence_id`
- `manifest_path`
- `adapter_profile`
- `presentation_context.verified_context_status`
- `platform_identity.binding_status`

## Allowed values in v0.1

- `presentation_context.verified_context_status`
  - `preserved`
  - `lost`
- `platform_identity.binding_status`
  - `matched`
  - `mismatch`
  - `unavailable`

## Design constraints

- keep the contract channel-light and evidence-light
- do not encode tenant policy or customer-specific wording
- do not let adapter metadata become core trust text
- do not treat this as a substitute for the portable verifier result contract

The result contract answers what DigiD proved.
The adapter evidence contract answers what local presentation context the adapter still has.

## First fixture-backed use cases

- voice sidecar shows a caller label that does not match the verified DigiD identity
- a verified live result is copied into a transcript, screenshot, or detached artifact view

## Future boundary warning

If this contract starts accumulating:
- per-tenant override logic
- hosted conformance checks
- platform-specific business rules
- workflow state

then DigiD has crossed out of a public-safe local contract and into private product infrastructure.
