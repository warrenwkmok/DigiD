# DigiD critique review, pass 3

## Reviewed slice
- verifier UX guidance
- Slack adapter concept
- implementation scaffold plan
- latest roadmap wording around fixture-first implementation

## Strengths
- The repo is getting much more honest about what DigiD proves versus what it cannot prove.
- The verifier UX guidance is a real improvement because it sharply limits trust overstatement and forces mismatch states into the visible design.
- The Slack adapter concept keeps adoption work grounded by treating Slack as a sidecar verifier surface rather than pretending platform-native trust is already solved.
- The implementation scaffold plan is the right bridge from protocol prose into executable work. It reduces the risk that the first code slice will blur protocol, verifier, fixtures, and renderer responsibilities.

## Concerns
- The loop is becoming richer, but also heavier. If every slice requires too much ceremony, the project may stall in process rather than progress.
- Slack is now the first concrete adapter concept, which is useful, but there is still a risk that the repo begins designing around Slack-specific realities before the core fixture set and verifier pipeline are actually running.
- The scaffold plan is strong at package boundaries, but still does not force a strict first milestone that says exactly what must exist after the first hour of implementation work.

## Security concerns
- The verifier UX guidance correctly forbids overclaiming, but the repo should eventually define machine-readable warning codes so adapter surfaces cannot quietly substitute friendlier wording.
- The Slack concept names mismatch risk clearly, but the protocol still lacks an explicit adapter-binding profile for platform actor ids. Until that exists, mismatch handling remains partly narrative rather than enforceable.

## Protocol concerns
- The current docs now support fixture-first implementation, but the next slice must stop creating more prose-only dependencies and instead produce the actual happy-path fixture family.
- The scaffold plan should not become a substitute for implementation. It should be treated as a one-step handoff into real files and validators.

## Privacy and governance concerns
- Slack and future adapter profiles could tempt the project into collecting too much platform metadata for convenience. The adapter strategy should keep asking what metadata is necessary for trust versus what is merely available.

## Adoption concerns
- The adoption loop is now healthier because it has one real target surface, but the repo should resist adding too many platform concepts before one sidecar path is proven.
- The current build loop cadence sounds too broad and event-driven. A tighter recurring rhythm would likely keep DigiD moving better than waiting for vaguely defined meaningful slices.

## Recommended changes
1. Treat the next mandatory slice as actual fixture creation, not more architecture prose.
2. Add a lightweight hourly build-loop rule so DigiD advances in smaller, more frequent slices.
3. Add one explicit note that Slack is an adoption test surface, not the driver of core protocol semantics.
4. Plan a future adapter-binding profile for platform actor ids once the first verifier slice exists.

## Severity summary
- critical: none
- high: fixture creation now needs to outrank further prose expansion
- medium: cadence is too loose and Slack-specific drift is a watch item
- low: warning-code normalization and adapter-binding profile are future hardening items
