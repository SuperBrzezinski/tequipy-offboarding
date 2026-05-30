# Backlog

Milestones → epics now; **tasks are broken down JIT, immediately before implementing the
epic** (never all up front). Use the `backlog-planning` and `task-breakdown` skills. Epics are
**vertical slices** — each one is demoable end to end. Sequenced by risk × value under the
2–6h time box (de-risk the core rules first; polish + bonus last).

## Milestone 0 — Foundations (agent layer done)
- [x] Agent layer + repo scaffold (done before the app)

## Milestone 1 — Build
1. [ ] **EPIC: Discovery + Spec + Architecture** — resolve flows, write spec, agree layering;
       ADRs for completion rule + issue-state + architecture. _Done = spec.md + architecture ADR signed off._
2. [ ] **EPIC: Setup** (devex) — Nx workspace, libs per layer (feature/application/domain/data-access)
       with boundary tags, ESLint+Prettier, Husky+lint-staged, commitlint, CI.
       _Done = `nx run-many -t lint test build` green from a clean clone; hooks fire._
3. [ ] **EPIC: Domain core** — `ItemStatus` union + transitions + completion predicate + summary
       derivations, pure & unit-tested. _Done = domain rules pass an exhaustive test suite._
4. [ ] **EPIC: Data + employee selection** — in-memory repo behind a domain port; selecting an
       employee loads their equipment (empty/loading/error states). _Done = list renders from data._
5. [ ] **EPIC: Return actions** — mark returned (condition) + report issue (note), wired to the
       signal store. _Done = an item moves through its states in the UI._
6. [ ] **EPIC: Summary + completion** — counts + guarded Complete (enabled iff all actioned) +
       confirmation state. _Done = completion rule enforced + confirmation shown._

## Milestone 2 — Signal & polish
7. [ ] **EPIC: Bonus + polish** — the one chosen bonus (default: AI-assisted note), a11y/responsive
       pass, README finalization, walkthrough script, rubric red-team. _Done = submission-ready._

_Epics get their task breakdown when picked up, not before._
