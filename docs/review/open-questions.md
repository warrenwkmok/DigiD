# DigiD open questions

This file holds questions that should not be silently resolved by drift.
These are the design questions most likely to shape the protocol and product boundary.

## OQ-001 — Who can issue strong human attestations?
Should DigiD define a narrow trusted-attestor model early, or stay abstract until later?

## OQ-002 — What counts as enough proof for a verified human?
Should the first product even expose this deeply, or stay more focused on verified agent and organization relationships first?

## OQ-003 — How fresh must verification be?
How should verifiers interpret revocation checks, stale status, offline checks, and cached results?

## OQ-004 — What is the exact first implementation wedge?
Current leaning after the v0.3 schema tightening:
- start with verifier CLI or minimal local API over static fixtures
- make the first rendered proof a voice-session trust-state demo
- postpone broader adapter work until the fixture and verifier story is coherent

## OQ-005 — How should pseudonymous identities be treated in UX?
How do we keep pseudonymous identities legitimate without misleading receivers into over-trusting or under-trusting them?

## OQ-006 — How should DigiD relate to existing standards?
Should it wrap, extend, or bridge into things like verifiable credentials and media provenance standards later, or stay fully independent at first?

## OQ-007 — What should the first verifier do when event-time and current-time disagree?
Should the default UX be warning-first, hard-fail for live surfaces, or context-dependent by channel and risk level?

## OQ-008 — How opinionated should revocation freshness policy be in v1?
Should DigiD standardize concrete freshness windows by interaction class, or leave them to verifier policy profiles?

## OQ-009 — Should `dgd.communication` be mandatory in every live demo flow?
The current docs now lean yes because it cleanly binds signer, operator, delegation, session, and purpose. If that stays true, the first code slice should model it as a required fixture, not an optional abstraction.

## OQ-010 — Which payload fields must be signable versus merely referenced by digest?
Resolved for the first implementation slice: trust-bearing lineage fields and any directly rendered trust text must be signed in the object or envelope body, while large detached content may be represented by signed digests plus stable descriptors.
Still open: whether later adapter profiles should permit richer signed sidecars or alternate canonicalized payload bundles for large media artifacts.

## OQ-011 — Is `dgd.communication` a universal live-flow requirement or only a demo-profile requirement?
Working resolution for v0.3: treat `dgd.communication` as mandatory for the first live delegated communication profile, with `session_id` aligned to envelope `conversation_id`.
Still open: whether this becomes universal for all future live profiles or remains a scoped profile rule.

## OQ-012 — What is the fixture manifest contract?
Resolved for the first implementation slice: the verifier should consume a manifest file with dependency order, scenario metadata, and stable-id assertions. Directory conventions may still help humans browse fixtures, but they are not the trust contract.

## OQ-013 — What replay protections are mandatory in the first live-session profile?
Resolved for the first implementation slice: the live-session verifier policy should treat duplicate envelope ids, duplicate sequence numbers within the same scope, sequence regression, and conflicting signer or delegation lineage as replay-sensitive. The exact transport-layer mitigation can evolve later, but verifier behavior is now opinionated enough to implement.

## OQ-014 — Should event payload families be published as standalone JSON Schemas before code scaffolding?
The repo now has a normalized payload profile in `docs/protocol/message-formats.md`, which is enough for a first typed registry in code.
Still open: whether to publish separate JSON Schema files immediately or let the first `packages/protocol` implementation generate them from typed source definitions.

## OQ-020 — Should top-level delegated `purpose` become universal across all DigiD envelopes or stay limited to live delegated profiles?
Working resolution for the first delegated live slice: top-level `purpose` is required so communication, session, and envelope lineage compare cleanly without digging into channel-specific payloads.
Still open: whether low-risk non-live channels should also promote purpose to a top-level field, or whether they can safely leave purpose inside signed payloads only.

## OQ-021 — Should warning and reason codes live in the core protocol package or in verifier-policy profiles?
Working resolution for the first slice: normalize a small shared set in protocol docs so adapters and fixtures stop drifting.
Still open: whether later profiles should treat the code list as core protocol, policy-profile defaults, or generated constants from implementation source.

## OQ-015 — How should DigiD handle recorded and published social media artifacts?
DigiD now has a deliberate same-repo future track for media provenance profiles covering recorded and published media such as YouTube, Instagram, TikTok, prerecorded podcasts, and similar non-live artifacts.
Still open: which core primitives should be reused unchanged from the live communication model, which media-specific objects must be introduced, how edit and repost lineage should degrade across surfaces, and what the first narrow media wedge should be without diluting the live communication build loop.

## OQ-016 — When should the red-team role become a dedicated agent/workflow instead of a doc-defined reviewer?
DigiD now has a standing red-team role in the build loop.
Still open: whether that role should remain manual and document-driven until the first verifier exists, or whether the project should stand up a dedicated red-team agent that runs attack-scenario reviews and feeds findings into the critique loop after each design/build iteration.

## OQ-017 — When should the adoption loop become a dedicated recurring workflow instead of a doc-defined reviewer?
DigiD now has a standing adoption-loop role in the build loop.
Still open: whether that role should remain manual and document-driven at first, or whether the project should stand up a dedicated recurring workflow that evaluates concrete target surfaces like Slack, enterprise chat, voice systems, email, messaging, and media platforms after each meaningful design/build iteration.

## OQ-018 — Should `dgd.session` become mandatory for every live communication profile?
Working resolution for the first delegated live voice slice: yes, because signed session scope makes sequence ordering, replay detection, and artifact lineage explicit.
Still open: whether lower-risk future channels can safely collapse session scope back into envelopes, or whether DigiD should standardize `dgd.session` as a universal live-flow object.

## OQ-019 — Should `dgd.artifact` stay optional in the core verifier path or become a required object whenever detached media or transcripts exist?
Working resolution for the first demo slice: optional for the happy path, required whenever a recording, transcript, or post-call summary is part of the fixture set.
Still open: whether later media-heavy profiles should treat artifact objects as mandatory lineage anchors instead of mere post-call extras.

## OQ-022 - When should the critique and red-team roles become runtime agents instead of review logs?
Working resolution for this iteration: keep them as explicit repo artifacts and review obligations while the verifier MVP is still local and fixture-driven.
Still open: whether the next build slice should automate those roles as local scripts, Codex workflows, or service-side agents once the verifier API exists.

## OQ-023 - Does DigiD need a first-class signed key-binding object for non-self-controlled agents?
Working resolution for now: the first delegated-agent profile can rely on the signed identity controller binding plus owner-signed attestation and delegation to bind the agent key back to a human or organization.
Still open: whether later commercial profiles should introduce a dedicated owner-signed key-binding or key-authorization object so agent key issuance, rotation, and emergency revocation are even more explicit.

## OQ-024 - What is the last public-safe verifier surface before DigiD crosses into private commercial infrastructure?
Working resolution for now: the public repo can keep shipping protocol, trust-model, fixtures, reference verifier logic, and limited local or demo interfaces that expose transparent diagnostics.
Still open: exactly where to draw the line between a local verifier API that helps adoption and a hosted verifier service, enterprise policy surface, registry operation layer, or other monetizable platform capability that should move to a private repo before implementation.

## OQ-025 - Which adapter-mismatch and context-loss signals belong in the core verifier result contract versus channel-specific adapter profiles?
Working resolution for now: the public reference verifier should export guardrails for `platform-identity-mismatch` and `artifact-context-missing`, and live surfaces should treat them as first-class warning paths when context or platform binding is lost.
Still open: which concrete evidence fields each adapter profile must supply to trigger those warnings deterministically without bloating the core public contract into service-side policy logic.

## OQ-026 - What is the safest public-safe strategy for authoring new signed negative fixtures?
Working resolution for now: keep audited manifests, checked-in demo fixtures, and local generation flows public so the reference verifier can cover adversarial cases like owner-binding mismatch without introducing hosted fixture infrastructure.
Still open: whether DigiD should use fixed demo-only signing keys, deterministic seeded keys, or full-corpus regeneration as the intended path for adding new signed negative scenarios such as delegation-scope conflict. Any answer should remain explicitly demo-only and must not become a production key-management or hosted fixture platform.

## OQ-027 - What is the minimum public-safe evidence contract for adapter mismatch and context-loss inputs?
Working resolution for now: the public repo should use a local `dgd.adapter_evidence` contract with fixture-backed `presentation_context.verified_context_status` and `platform_identity.binding_status` fields so mismatch and context-loss warnings no longer depend on manual flags.
Still open: which additional evidence fields, if any, are justified per adapter profile without turning the public repo into a tenant-aware policy engine or a channel-specific business-rules matrix.

## OQ-028 - Should future platform-binding evidence stay local-only or become a signed DigiD object?
Working resolution for now: keep adapter evidence local-only and explicitly outside the signed DigiD protocol object model so the public repo can audit presentation honesty without claiming more protocol proof than DigiD currently has.
Still open: whether commercial or standards-track profiles eventually need a signed or countersigned platform-binding primitive for higher-assurance adapter surfaces.
