# DigiD critique review, pass 2

## Reviewed slice
- v0.3 object schema tightening
- signed message and event envelope definitions
- first demo flow fixture mapping
- reference implementation boundaries implied by architecture docs

## Strengths
- The protocol now has a much clearer verifier-first shape.
- `dgd.communication` is becoming the right anchor for live delegated communication flows.
- The demo is getting honest about lineage by requiring the same communication and delegation graph across comparison cases.
- Envelope rules now better distinguish signed transport facts from unsigned UI interpretation.

## Concerns
- The repo still lacks a single explicit fixture manifest contract, so different implementations could still order or discover inputs differently.
- Event payload schemas are described in prose, but not yet normalized into a machine-consumable profile or examples for each event type.
- The verifier policy surface is still partly implicit. Freshness thresholds exist, but policy profiles by interaction class are not yet gathered in one place.
- Trust rendering rules are stronger, but there is still no dedicated verifier UX guidance doc that limits badge overstatement.

## Security concerns
- The current draft still leaves room for replay unless the first live-session profile defines stream scope, sequence scope, and duplicate-envelope handling more explicitly.
- Delegation restrictions are now modeled, but verifier behavior when restrictions conflict with claimed purpose is still underdefined.
- Revocation object authority is described, but the practical source-of-truth model for revocation lookup remains architectural rather than operational.

## Protocol concerns
- `dgd.communication` now looks mandatory for live flows, which is good, but the repo should decide whether that is a protocol rule or only a demo-profile rule.
- Event payload digest reproducibility is better stated, but the project still needs one canonical note on exactly which bytes are hashed for detached payloads versus inline JSON payloads.
- Comparison fixtures will be persuasive only if the repo defines which fields are allowed to vary per scenario and which must remain frozen.

## Product and adoption concerns
- The wedge is sharper now, but the docs should keep resisting multi-channel sprawl until the voice verifier demo is runnable.
- If the first verifier is CLI-only, the repo should make sure the trust outputs still feel legible to a non-technical observer.

## Recommended changes
1. Add a fixture manifest spec that defines dependency order, scenario metadata, and which object ids must remain stable across comparison cases.
2. Add a dedicated verifier UX guidance doc covering compact labels, expanded details, warning language, and forbidden trust claims.
3. Add a verifier policy profile doc that centralizes freshness defaults, replay handling assumptions, and live-session versus offline posture.
4. Decide explicitly whether `dgd.communication` is mandatory for all live communication profiles or only for the first demo profile.

## Severity summary
- critical: none
- high: replay and policy-profile gaps remain underdefined
- medium: fixture manifest contract and UX guidance still missing
- low: event payload families need more machine-ready examples
