# Rubric map

Tequipy grades specific dimensions. This file maps each to where it's evidenced, so nothing
they assess is left to chance. Maintained via the `rubric-alignment` skill; evidence links
fill in as epics land (TBD = not built yet).

## Assessment dimensions → evidence

| Dimension | What they check | Where we evidence it |
|-----------|-----------------|----------------------|
| **Component design** | well-scoped components; state lifted right | layer libs (`feature`/`application`/`domain`/`data-access`); smart page + presentational row/summary; `@nx/enforce-module-boundaries` lint — _TBD links_ |
| **TypeScript** | meaningful types; shape propagates cleanly | `ItemStatus` discriminated union + `ReturnCondition` union in `domain`; `assertNever` exhaustiveness; strict mode on — _TBD links_ |
| **UX judgement** | flow makes sense; edge cases handled | discovery decisions (`docs/discovery.md`); issue/condition-mismatch/empty/error states; guarded completion with a clear reason — _TBD links_ |
| **Code clarity** | a teammate reads it with no guide | naming + layering; ESLint/Prettier config; small components — _TBD links_ |
| **Visual / UX polish** | clean, modern, defensible views | token system via PrimeNG theme; complete empty/loading/error/disabled/success states; status legible without colour-alone (`visual-design.md`) — _TBD links_ |
| **Test reasoning** | tested the right thing; useful tests | state-machine + completion-predicate unit tests; the "why" in README + testing ADR — _TBD links_ |
| **AI tooling** | used it; said where it helped / course-corrected | README AI-tooling note; **this agent layer** (`.claude/` + `agent/`) as evidence of habit; ADRs showing course-corrections |

## Bonus feature — decision

Pick **one** (effort vs signal):

| Bonus | Effort | Signal | Verdict |
|-------|--------|--------|---------|
| **AI-assisted note** | low–med | **high** | **Committed default** — aligns with the AI-first product/role; local template now, real LLM call optional. |
| Condition diff | low | med–high | Cheap *second* if time allows; strong UX-judgement signal. |
| Optimistic UI | med | med | Async/loading/error maturity; more to test. |
| Keyboard navigation | med | med | A11y signal; easy to under-deliver if rushed. |

Decision recorded in discovery + an ADR once confirmed with the operator.

## Pre-submission red-team (run before sending — see `rubric-alignment`)

- [ ] Clean clone → run steps work exactly as written
- [ ] `nx run-many -t lint test build` green; tests meaningful
- [ ] Completion rule correct at the boundary; edge cases graceful
- [ ] README truthful; ADRs summarized; AI-note not overclaimed
- [ ] Walkthrough recorded (3–5 min), hits these dimensions
- [ ] Time box honored; cuts named in "what's next"
- [ ] "What would a skeptical senior reviewer ding first?" — fixed or owned
