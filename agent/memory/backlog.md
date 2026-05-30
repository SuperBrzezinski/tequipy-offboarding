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
3. [x] **EPIC: Domain core** — `ReturnStatus`/`ReturnCondition` string unions; `AssignedItem`,
       `ReturnItem` (composition), `EmployeeSession` types; `CONDITION_SEVERITY`,
       `isConditionWorse`, `canComplete`, `hasOpenIssues`, `suggestNote` pure functions;
       `IOffboardingRepository` port interface; exhaustive unit tests. _Done = all domain logic green._

   **Tasks (JIT breakdown 2026-05-30):**

   - [ ] **D-1** — Types, constants, port interface: all string unions (`ReturnCondition`,
         `ItemStatus`, `OffboardingStatus`), all interfaces (`Employee`, `AssignedItem`,
         `ReturnItem`, `EmployeeSession`), `CONDITION_SEVERITY` constant, `IOffboardingRepository`
         port. Exported from `libs/domain/src/index.ts`. No Angular imports anywhere in domain.
         DoD: `nx build domain` + `nx lint domain` green.

   - [ ] **D-2** — Condition logic + tests: `assertNever` exhaustiveness guard,
         `isConditionWorse(assigned, returned)` pure function. Unit tests: all 9 condition pairs
         (3×3), same condition = not worse, Good→Damaged = worse, etc.
         DoD: `nx test domain` green.

   - [ ] **D-3** — Completion predicates + tests: `canComplete(items)` and `hasOpenIssues(items)`
         pure functions. Unit tests: empty array, all pending, all resolved with notes, open issues
         without notes, partial states, items.length=0 guard.
         DoD: `nx test domain` green.

   - [ ] **D-4** — `suggestNote` template engine + tests: `suggestNote(type, assignedCondition)`
         pure function. Templates covering all `type × condition` combos in the planned mock dataset
         (Laptop, Monitor, Headset, Keyboard, Mouse, Docking Station). Unit tests: every combination
         returns a non-empty string; unknown type falls back gracefully.
         DoD: `nx test domain` green.
4. [ ] **EPIC: Data + employee list** — `OffboardingRepository` (in-memory behind port); mock
       dataset (≥5 employees, ≥2 items each, one empty, one completed); employee list view with
       Pending/Completed badge; clicking an employee loads session. _Done = list renders + selection navigates._

   **Tasks (JIT breakdown 2026-05-30):**

   - [ ] **E-1** — Domain addendum + mock dataset: add `offboardingStatus: OffboardingStatus` to
         `Employee` interface (needed for list badge); create `MOCK_EMPLOYEES` (6 employees: 4 active
         with items, 1 active no items, 1 pre-completed) and `MOCK_ASSIGNED_ITEMS` in `libs/data-access`.
         DoD: `nx build data-access && nx lint data-access` green; data covers all edge cases.

   - [ ] **E-2** — `InMemoryOffboardingRepository` + DI token: implement `IOffboardingRepository`
         against the mock data; provide via `InjectionToken<IOffboardingRepository>` (`OFFBOARDING_REPO`);
         export token + class from `libs/data-access/src/index.ts`. Unit test: `getEmployees()` returns
         all 6 employees; `getAssignedItems('emp-no-items')` returns [].
         DoD: `nx test data-access && nx lint data-access` green.

   - [ ] **E-3** — `EmployeeListPageComponent`: smart component in `libs/feature-offboarding`;
         injects `OFFBOARDING_REPO`, wraps Promise in `resource()` signal; renders list with name,
         department, offboarding date, Completed badge; loading skeleton + empty + error states;
         click navigates to `/offboarding/:employeeId`. Integration test: renders employee count,
         Completed badge present for completed employee.
         DoD: `nx test feature-offboarding && nx lint feature-offboarding` green.

   - [ ] **E-4** — Session page scaffold + route wiring: `OffboardingSessionPageComponent` in
         `libs/feature-offboarding`; receives `employeeId` input (via `withComponentInputBinding()`);
         loads employee + items from repo; shows employee name + "items coming next epic" placeholder.
         Wire `app.routes.ts`: `''` → `EmployeeListPageComponent` (eager), `offboarding/:employeeId`
         → `OffboardingSessionPageComponent` (lazy). Back button → list.
         DoD: full navigation flow works end-to-end in the browser; `nx build offboarding-shell` green.
5. [x] **EPIC: Return actions** — `OffboardingStore` signal store; `OffboardingSessionPageComponent`
       (smart, reads store); `EquipmentListComponent`/`EquipmentRowComponent`/`StatusBadgeComponent` (dumb);
       mark-returned (condition select, condition-downgrade soft-confirm), report-issue (note field,
       isDirty, confirm/cancel), undo-return. _Done ✓ — `feat(dev-009)`._

   **Tasks (JIT breakdown 2026-05-30):**

   - [ ] **R-1** — `OffboardingStore` signal service + unit tests: `@Injectable` service in
         `libs/feature-offboarding`; `WritableSignal<Map<employeeId, EmployeeSession>>` session map;
         `editingItem: WritableSignal<{itemId:string, mode:'return'|'issue'} | null>` for isDirty;
         `isDirty = computed(...)`, `getSession(id)` computed; methods: `loadSession`, `beginReturn`,
         `confirmReturn(itemId, condition)`, `undoReturn`, `beginIssue`, `confirmIssue(itemId, note)`,
         `cancelIssue`; session persists across navigation (cache by employeeId).
         Unit tests: all 5 transitions, cache hit (navigate away + back restores state), isDirty
         set/cleared correctly on begin/confirm/cancel.
         DoD: `nx test feature-offboarding && nx lint feature-offboarding` green.

   - [ ] **R-2** — Dumb presentational components (`StatusBadgeComponent`, `EquipmentRowComponent`,
         `EquipmentListComponent`) in `libs/ui`: `StatusBadgeComponent` — signal input `status: ItemStatus`,
         renders colour-coded badge (Pending=neutral, Returned=success, Issue=warning); `EquipmentRowComponent`
         — signal inputs: `item: ReturnItem`, `isEditing: boolean`, `editMode: 'return'|'issue'|null`;
         outputs: `markReturn`, `undoReturn`, `reportIssue`, `confirmIssue`, `cancelIssue`, `suggestNote`;
         renders item name/type/serial/assignedCondition + status badge + contextual action buttons;
         `EquipmentListComponent` — input `items: ReturnItem[]`, relays all row events.
         Component tests: badge renders correct variant; row shows correct buttons per status.
         DoD: `nx test ui && nx lint ui` green.

   - [ ] **R-3** — Return flow: condition select + condition-downgrade soft-confirm + undo: in
         `EquipmentRowComponent`, when `editMode === 'return'`: show `<p-select>` (Good / Damaged /
         Missing accessories); "Confirm return" calls `confirmReturn`; `isConditionWorse` check in
         `OffboardingSessionPageComponent` — if true, show PrimeNG `<p-confirmdialog>` before calling
         store; "Undo return" button on Returned row calls `undoReturn`. Dialog: "{{name}} was assigned
         as {{assigned}}. Recording as {{returned}}. Continue?". Focus moves to dialog on open,
         returns to trigger on close.
         DoD: both happy-path and downgrade-confirm flow work in browser; `nx test feature-offboarding` green.

   - [ ] **R-4** — Issue flow: note field + suggest note + confirm/cancel: in `EquipmentRowComponent`,
         when `editMode === 'issue'`: show `<p-textarea>` (required, min-length 1) + "Suggest note"
         button (calls `suggestNote(item.type, item.assignedCondition)` from domain, fills textarea);
         "Confirm issue" (disabled when note empty) calls `confirmIssue`; "Cancel" calls `cancelIssue`;
         `isDirty` is `true` while the field is open, `false` after confirm/cancel.
         Component test: Confirm disabled when empty, enabled when non-empty; suggest note pre-fills.
         DoD: `nx test ui && nx test feature-offboarding && nx lint` green.

   - [ ] **R-5** — Smart page wiring + isDirty navigation guard + integration tests: wire
         `OffboardingSessionPageComponent` to `OffboardingStore` — inject store, call `loadSession`
         on `employeeId` input change, pass `currentItems`, `editingItem` signals into
         `EquipmentListComponent`, handle all output events by calling store; add `CanDeactivateFn`
         guard to `/offboarding/:id` route — if `store.isDirty()` prompt "You have an unsaved edit.
         Leave and discard?" (use `location.back()` after discard or stay on confirm); integration
         tests: render equipment list for emp-001; transition Pending→Returned→Pending (undo);
         Pending→Issue (with note); navigation guard fires when isDirty.
         DoD: full state-machine flow verified in browser; `nx build offboarding-shell` green;
         integration tests green.
6. [ ] **EPIC: Summary + completion** — `SummaryPanelComponent` live counts; Complete button
       guarded by `canComplete`; completion dialog listing open-issue item names; completed
       read-only state with `completedAt` timestamp. _Done = full completion flow end to end._

## Milestone 2 — Signal & polish
7. [ ] **EPIC: Bonus + polish** — `ConditionDiffBadgeComponent`; `NoteFieldComponent` "Suggest
       note" button wired to `suggestNote()`; a11y pass (WCAG 2.1 AA); responsive ≥768px;
       README as deliverable; walkthrough script; rubric red-team. _Done = submission-ready._

_Epics get their task breakdown when picked up, not before._
