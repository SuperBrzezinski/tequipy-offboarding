---
name: adr
description: >
  Create or supersede an Architecture Decision Record. USE whenever a decision interprets an
  ambiguity in the task spec, or commits to an architecture / tooling / testing / scope
  direction — including course-corrections discovered between epics. Keeps decisions small,
  immutable and traceable, and feeds the README's key-decisions summary.
---

# ADR

ADRs are how we make judgement visible. The reviewers explicitly grade "defend architecture
with reasoning" — ADRs are that defense, written down.

## When to write one

- A decision **interprets the task spec** (e.g. "Issue is non-terminal", "completion allows
  acknowledged issues"). This is the most important category — capture it.
- A structural/tooling/testing commitment (layering, state approach, Nx boundaries, Vitest).
- A **course-correction**: new facts mid-build. Don't drift silently — supersede.

## Procedure

1. Copy `docs/adr/0000-template.md` to `docs/adr/NNNN-<kebab-title>.md` (next free number).
2. Fill Context → Decision → Rationale → Consequences → Alternatives. Tie rationale to the
   layering and the rubric where relevant. Keep it to one screen.
3. Set status `Accepted` (or `Proposed` if pending operator sign-off).
4. **Superseding:** never rewrite an old ADR. Add a new one; set the old one's status to
   `Superseded by ADR-XXXX` and add a one-line pointer. History stays honest.
5. Update the table in `docs/adr/README.md` and the thin index in
   `agent/memory/decisions.md`.
6. Write the **README line** at the bottom — `readme-craft` lifts it verbatim.

## Style

Crisp, neutral, decision-first. State the cost honestly (every real decision has one). An ADR
that lists no downside isn't finished.
