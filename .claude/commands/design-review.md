---
description: Visual/UX review of the current view before checkpoint (looks, states, tokens, a11y).
---

Run the `design-review` skill. Spawn the `ui-designer` sub-agent on the implemented view; it
checks hierarchy, spacing rhythm, token discipline, state completeness
(empty/loading/error/disabled/success), status legibility without colour-alone, contrast/a11y,
responsiveness, and restraint. Reports findings tagged [blocker]/[should]/[nit] + a verdict
(SHIP / SHIP-WITH-NITS / REWORK); route fixes to `frontend-engineer`. Pairs with `/review`
(code) before a view's checkpoint.
