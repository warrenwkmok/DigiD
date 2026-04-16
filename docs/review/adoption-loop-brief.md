# DigiD adoption loop brief

## Purpose

DigiD should not evolve only as a clean protocol on paper.
Each meaningful design/build iteration should also test whether the current direction can land in real applications, platforms, and domains.

This is the adoption loop.

Its job is to keep DigiD honest about:
- where the protocol can realistically integrate now
- where it needs sidecars, overlays, or gateways instead of native platform support
- where UX trust claims would survive or break in real tools
- which domain wedge is sharp enough to adopt first
- which ideas are strategically exciting but operationally premature

## Core responsibilities

### 1. Map each slice to real deployment surfaces
After each meaningful design/build slice, ask:
- where could this work today?
- where would it require a sidecar, browser extension, bot, gateway, plugin, or native partnership?
- what data would actually be available on the target platform?

### 2. Pressure-test domain fit
Check whether the current slice helps DigiD in concrete domains such as:
- enterprise chat and collaboration
- customer support agents
- voice assistants and call flows
- messaging/email trust workflows
- recorded media provenance
- internal enterprise automation

### 3. Keep the wedge narrow enough to ship
The adoption loop should prevent the repo from drifting into "works everywhere eventually" thinking.
It should force the repo to say:
- first where?
- for whom?
- under what deployment model?
- with what limitations?

### 4. Feed platform lessons back into protocol and UX
If a platform like Slack, email, Zoom, or messaging apps cannot preserve a trust assumption cleanly, that should change the product and protocol docs, not just sit as commentary.

### 5. Track adapter strategy explicitly
The adoption loop should clarify whether a given target surface is best approached as:
- verifier sidecar
- bot/app integration
- gateway-mediated issuance
- browser extension
- enterprise admin integration
- native partner integration later

## Questions the adoption loop should always ask

### Platform realism
- What does the target platform actually let DigiD see, attach, sign, or render?
- What breaks when messages are forwarded, copied, exported, screenshotted, clipped, or quoted?
- What metadata is unavailable, mutable, delayed, or unreliable?

### Product wedge
- Is this a real early-adopter pain point?
- Who would pay or deploy first?
- Is the current slice helping the first wedge or distracting from it?

### Deployment model
- Can this work as a sidecar before native adoption?
- Does it require enterprise admin control?
- Does it require a platform partnership?
- Can a narrow internal deployment prove value first?

### UX realism
- Where will the trust state actually appear?
- Will users understand it in the context of the target platform?
- Will the platform UI distort, hide, or overstate DigiD meaning?

## Expected output format

Each adoption-loop pass should ideally produce:
- candidate domains or platforms affected by the current slice
- feasibility notes
- deployment-model recommendation
- integration risks
- adoption risks
- recommended follow-up changes

## Operating rule inside DigiD

Run an adoption-loop pass after every meaningful design/build iteration.
Feed the results into:
- `docs/review/design-feedback-log.md`
- `docs/review/open-questions.md`
- roadmap, MVP, architecture, and protocol docs where needed

## Golden rule

If a DigiD slice only works in a perfect demo environment and has no believable path into a real product surface, the adoption loop should say so directly.
