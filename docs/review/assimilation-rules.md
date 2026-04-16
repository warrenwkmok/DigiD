# DigiD critique assimilation rules

## Purpose

These rules define how critique must feed back into DigiD.

## Rule 1
Every meaningful critique, red-team pass, or adoption-loop pass must produce at least one of:
- a doc change
- a feedback-log entry
- an open question
- a rejected recommendation with reason

## Rule 2
High-severity critique items should not sit untracked.
They must appear in `design-feedback-log.md` or be resolved immediately.

## Rule 3
If a critique, red-team finding, or adoption-loop finding changes what the protocol appears to guarantee, the relevant product, protocol, UX, MVP, and architecture docs must all be revisited together.

## Rule 4
The project should distinguish between:
- critique accepted and applied
- critique accepted but deferred
- critique rejected with reason
- critique requiring Master Warren's decision

## Rule 5
The build loop should not only generate new material. It should periodically close critique loops and adoption loops by applying, rejecting, or clarifying prior recommendations.

## Rule 6
When a critique is incorporated, the feedback log should say where it landed so the repo shows design evolution rather than scattered opinion.

## Practical loop
1. Build a slice.
2. Critique it.
3. Red-team it.
4. Run the adoption loop against real platforms/domains.
5. Log the resulting outcomes.
6. Apply or classify the resulting changes.
7. Update roadmap and open questions if needed.
8. Repeat.
