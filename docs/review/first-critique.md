# DigiD critique review

## Reviewed slice
- initial DigiD repository structure
- product thesis and design principles
- identity, attestation, and provenance concepts
- object schema draft
- message format draft
- first demo flow and reference verifier concept

## Strengths
- The project is framed around a real and growing problem: communications trust in an AI-heavy world.
- The distinction between human, agent, organization, pseudonymous, and unverified is strong and strategically important.
- The current direction wisely focuses on communications authenticity rather than trying to solve universal identity on day one.
- The reference verifier concept is a good implementation wedge because it converts abstract protocol thinking into a concrete product behavior.
- The first demo flow is strong because verified agent calls are a timely and understandable trust problem.

## Concerns
- The repo still risks sounding broader than the first product can realistically deliver.
- The protocol object layer is promising but still partly conceptual; it needs tighter normative language to avoid ambiguity.
- The current docs do not yet define revocation resolution behavior in enough operational detail.
- The trust-state model is useful, but there is still risk that UX language could imply too much certainty.

## Security concerns
- Key compromise, key rotation, and recovery are not yet concretely modeled enough.
- Delegation semantics need stronger boundaries around scope, expiry, and misuse handling.
- Verification freshness is not yet defined. A stale verification result could mislead users after revocation or expiry.

## Protocol concerns
- Object relationships need a clearer reference model so verifiers know the exact resolution order.
- The project should eventually distinguish between required fields, optional fields, and extension points.
- Message formats need explicit notes on canonicalization or digest generation to avoid mismatched verification behavior later.

## Privacy and governance concerns
- The project still needs a clearer stance on who is allowed to attest humans and under what trust model.
- The pseudonymous path is promising, but it needs stronger protection so it does not become a second-class trust state by default.
- Governance language should remain careful to avoid sounding like a mandatory global identity registry.

## Adoption concerns
- Cross-channel ambition is strategically exciting but commercially dangerous if it dilutes the wedge.
- The first product should likely stay anchored in one or two channels long enough to prove trust UX and verifier value.
- The project should anticipate skepticism from people who will compare it to DIDs, verifiable credentials, or media provenance standards.

## Recommended changes
1. Add a normative protocol draft that distinguishes required vs optional fields and defines object resolution order.
2. Add a key lifecycle and revocation model with concrete freshness assumptions.
3. Add a verifier UX guidance document that limits trust overstatement and clarifies what a badge does and does not prove.
4. Add a competitive map so DigiD's differentiation remains sharp.
5. Keep the first implementation focused on a verifier plus one concrete communications demo rather than broad infrastructure claims.

## Severity summary
- critical: none yet
- high: revocation and key lifecycle underdefined
- medium: adoption scope still broad
- low: current docs are early and understandably conceptual in places
