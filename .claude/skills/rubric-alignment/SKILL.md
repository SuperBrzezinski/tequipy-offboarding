---
name: rubric-alignment
description: >
  Map every deliverable to Tequipy's assessment rubric and run a pre-submission self-audit.
  USE when choosing the bonus feature (effort-vs-signal trade-off), at mid-build to check
  coverage, and before submission as a skeptical red-team pass. Produces docs/rubric-map.md so
  nothing the reviewers grade is left to chance.
---

# Rubric alignment

The reviewers grade specific dimensions. Engineer the deliverable to evidence each one, then
red-team it before sending.

## The dimensions → where we evidence them (docs/rubric-map.md)

| Dimension | Evidence to point at |
|-----------|----------------------|
| **Component design** | layer libs, smart/presentational split, state lifted correctly |
| **TypeScript** | discriminated-union status, generics where they earn it, strict mode, no loose `any` |
| **UX judgement** | edge cases (issue items, condition mismatch, completion guard, empty/error states) |
| **Code clarity** | naming, structure, a teammate reading it cold; lint config |
| **Test reasoning** | the *chosen* tests (state-machine, completion predicate) + the written "why" |
| **AI tooling** | the README AI-note + this very agent layer as evidence of habit |

## Bonus feature trade-off (pick ONE)

| Bonus | Effort | Signal | Notes |
|-------|--------|--------|-------|
| **AI-assisted note** | low–med | **high** | Aligns with the AI-first product/role; can be a local template now, real LLM call later. **Recommended.** |
| **Condition diff** | **low** | med–high | Cheap, visible UX judgement; great *second* if time allows. |
| Optimistic UI | med | med | Shows async/loading/error maturity; more moving parts to test. |
| Keyboard navigation | med | med | Strong a11y signal; easy to under-deliver if rushed. |

Default: **AI-assisted note** as the committed bonus, **condition-diff** only if the time box
has room. Decide this in `discovery-session`; record as an ADR.

## Pre-submission red-team (run before sending)

- [ ] Clean clone → run instructions work *exactly* as written (no hidden global deps).
- [ ] `nx run-many -t lint test build` green; tests meaningful, not padding.
- [ ] Completion rule correct at the boundary; edge cases don't crash or mislead.
- [ ] README truthful; ADRs summarized; no overclaiming in the AI-note.
- [ ] Walkthrough recorded (3–5 min), hits the rubric.
- [ ] Time box honored — scope cuts named in "what's next", not hidden.
- [ ] "What would a skeptical senior reviewer ding first?" — fix or own it.
