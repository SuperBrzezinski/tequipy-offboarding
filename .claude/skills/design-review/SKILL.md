---
name: design-review
description: >
  Review how a view actually LOOKS and behaves as UX, before the checkpoint for any
  view-bearing increment. USE after a view is implemented (alongside code-review, which covers
  the code). Spawns ui-designer to check hierarchy, spacing rhythm, token discipline, state
  completeness (empty/loading/error/disabled/success), contrast/a11y and responsiveness;
  reports findings and routes fixes to frontend-engineer. Restraint over decoration.
---

# Design review

Code review checks the code; design review checks the *result*. Both run before a view's
checkpoint. Spawn `ui-designer`; reference `agent/playbooks/visual-design.md`.

## Checklist (tagged like code review)

- **Hierarchy** — is the primary action obvious and singular? Does the eye land in the right
  place? Secondary/tertiary actions appropriately quiet?
- **Spacing & alignment** — consistent scale, no off-grid one-offs, aligned columns, mono for
  serials? Rhythm feels intentional?
- **Tokens** — colours/spacing/radius come from the theme, not hard-coded values? Flag any
  magic value as [should].
- **State completeness** — empty, loading, populated, error, **disabled-with-reason**, and
  success states all present and intentional? (The most common gap — check it hardest.)
- **Clarity of status** — Pending/Returned/Issue and condition-diff legible without colour
  alone (label/icon + colour)?
- **Contrast & a11y** — text/control contrast adequate; focus visible; targets reasonable.
- **Responsiveness** — usable at narrow and wide widths; table degrades gracefully; no layout
  jump on data load.
- **Restraint** — anything decorative that doesn't aid clarity? Any "AI-slop" tell (gradient,
  emoji-icons, competing accents, shadow-on-everything)? Cut it.

## Output

Findings tagged **[blocker] / [should] / [nit]** with the view/element and a concrete fix,
then a verdict: **SHIP / SHIP-WITH-NITS / REWORK**. Route blockers + agreed shoulds to
`frontend-engineer`; nits are the operator's call under the time box.

## Boundaries

`ui-designer` reports; it doesn't rewrite feature code. Proportionate to a 2–6h take-home —
the bar is "clean, modern, defensible", not "pixel-perfect against a Figma". Record any visual
choice that interprets the task as an ADR.
