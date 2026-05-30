# Backlog

Milestones → epics now; **tasks are broken down JIT, immediately before implementing the
epic** (never all up front). Use the `backlog-planning` and `task-breakdown` skills. Epics are
**vertical slices** — each one is demoable end to end. Sequenced by risk × value under the
2–6h time box (de-risk the core rules first; polish + bonus last).

## Milestone 0 — Foundations (agent layer done)
- [x] Agent layer + repo scaffold (done before the app)

## Milestone 1 — Build
1. [x] **EPIC: Discovery + Spec + Architecture** — resolve flows, write spec, agree layering;
       ADRs 0001–0004 written (tech stack, state machine, bonus, architecture). _Done ✓_
2. [x] **EPIC: Setup** (devex) — Nx workspace; four libs (`domain`, `data-access`,
       `feature-offboarding`, `ui`) + `apps/offboarding-shell` with `@nx/enforce-module-boundaries`
       tags, ESLint (incl. `prefer-on-push`), Prettier, Husky+lint-staged, commitlint, CI.
       _Done ✓ — lint/test/build 5/5 green; hooks fire. `build(dev-006)`._
3. [ ] **EPIC: Domain core** — `ReturnStatus`/`ReturnCondition` string unions; `AssignedItem`,
       `ReturnItem` (composition), `EmployeeSession` types; `CONDITION_SEVERITY`,
       `isConditionWorse`, `canComplete`, `hasOpenIssues`, `suggestNote` pure functions;
       `IOffboardingRepository` port interface; exhaustive unit tests. _Done = all domain logic green._
4. [ ] **EPIC: Data + employee list** — `OffboardingRepository` (in-memory behind port); mock
       dataset (≥5 employees, ≥2 items each, one empty, one completed); employee list view with
       Pending/Completed badge; clicking an employee loads session. _Done = list renders + selection navigates._
5. [ ] **EPIC: Return actions** — `OffboardingStore` signal store; `OffboardingSessionPageComponent`
       (smart, reads store); `EquipmentListComponent`/`EquipmentRowComponent`/`StatusBadgeComponent` (dumb);
       mark-returned (condition select, condition-downgrade soft-confirm), report-issue (note field,
       isDirty, confirm/cancel), undo-return. _Done = item moves through all state transitions in the live UI._
6. [ ] **EPIC: Summary + completion** — `SummaryPanelComponent` live counts; Complete button
       guarded by `canComplete`; completion dialog listing open-issue item names; completed
       read-only state with `completedAt` timestamp. _Done = full completion flow end to end._

## Milestone 2 — Signal & polish
7. [ ] **EPIC: Bonus + polish** — `ConditionDiffBadgeComponent`; `NoteFieldComponent` "Suggest
       note" button wired to `suggestNote()`; a11y pass (WCAG 2.1 AA); responsive ≥768px;
       README as deliverable; walkthrough script; rubric red-team. _Done = submission-ready._

_Epics get their task breakdown when picked up, not before._
