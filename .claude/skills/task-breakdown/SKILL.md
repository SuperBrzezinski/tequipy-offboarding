---
name: task-breakdown
description: >
  Break the SINGLE next epic into concrete, small tasks immediately before implementing it.
  USE only when picking up an epic — never up front for the whole project. Produces a short,
  ordered task list, each with a definition of done, written under the epic in
  agent/memory/backlog.md, and sets the next action in active-context.md.
---

# Task breakdown (just-in-time)

Detail the epic you're about to build, and only that one. This keeps plans fresh and the
context lean.

## Procedure

1. Confirm the active epic from `backlog.md`. Re-read the relevant spec/ADR sections — facts
   may have shifted since planning; reconcile (and if a decision changed, write an ADR).
2. Decompose into **3–7 tasks**, each:
   - small (~≤1h), independently implementable and reviewable,
   - a thin vertical where possible (don't split UI from its state pointlessly),
   - phrased as an outcome, not an activity.
3. Give each task a **Definition of Done** (the checklist below).
4. Order them; write under the epic in `backlog.md`; set `active-context.md` next-action to
   task #1.

## Definition of Done (per task)

- [ ] Behaves to the spec's acceptance criteria for this slice
- [ ] Strict TS, clean layering (no domain→Angular leak), well-scoped component
- [ ] Meaningful test where it carries signal (per `testing-strategy`); lint + tests green
- [ ] a11y basics (labels/roles/focus/keyboard) considered, not deferred
- [ ] `code-review` passed (independent), fixes applied
- [ ] memory updated; checkpoint offered

## Reminder

One epic's tasks at a time. When the epic closes, return to `backlog-planning` to pick the
next, then break *that* one down. Don't run ahead.
