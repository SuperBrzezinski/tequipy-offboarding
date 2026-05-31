# Build log

Append-only. Newest at the top. One line per shipped increment, referencing the commit scope.

- `style(dev-017)` — Tailwind v4 + Inter font + full visual overhaul. Installed `tailwindcss`,
  `@tailwindcss/postcss`, `@tailwindcss/cli`, `primeicons`. Replaced all component SCSS files
  with Tailwind utility classes in HTML templates. Added Inter font (Google Fonts). Added
  global nav bar in `app.html`. Replaced raw HTML `back-btn`/`retry-btn` with `p-button`.
  Fixed `p-message` deprecated `text=` attr. Tailwind v4 integrated via CLI pre-processing
  (`tailwind-input.css` → `styles.css`) to bypass esbuild service-mode deadlock with
  `@tailwindcss/oxide`. `prebuild-css` Nx target + parallel `serve` target added. 129 tests
  green, build clean.

- `fix(dev-016)` — Replaced invented mock dataset with exact task-spec data. `mock-data.ts` now
  uses Maria Kowalski (emp-001, Engineering, 2024-06-30) with eq-101 MacBook Pro 14"/C02XG2JHQ6DN,
  eq-102 Dell 27" Monitor/CN-0T7VWR-48621, eq-103 Logitech MX Keys/2246OD118965; and Tomasz
  Wierzbicki (emp-002, Sales, 2024-07-15) with eq-201 Lenovo ThinkPad X1/PF2YNAB2, eq-202
  iPhone 14 Pro/DNPXC3J3Q1GC. Repository spec updated: 6→2 count assertions, removed emp-005/
  emp-006 references, added name and equipment-ID assertions. All 29 data-access tests green.

- `test(dev-015)` — Integration test: full return flow in `OffboardingSessionPageComponent`.
  New `describe('complete flow (integration)')` block: renders with real `OffboardingStore` +
  mocked repo, waits for both items to load, asserts Complete button is disabled (2 Pending),
  drives both items to Returned via `onConfirmReturn` (Good→Good, no dialog), asserts button
  enables, clicks Complete via `userEvent`, asserts "Offboarding completed" banner appears.
  45/45 feature tests green, 30/30 data-access green. Project submission-ready.

- `test(dev-014)` — Test suite cleanup. Removed 6 store describe-blocks testing incidental
  signal state (beginReturn, beginIssue, cancelIssue, cancelReturn, getSession, getSessionReactive).
  Removed 9 trivial rendering tests from EquipmentRowComponent. Removed 1 implementation-
  coupled test (private selectedCondition/noteValue signal access via isEditing flip).
  Removed "Summary panel and completion flow" block from session-page spec (8 tests using
  page['store'], page['pendingCount'] etc.). Removed "suggest note" test (page['noteHints']).
  Fixed suggestedNote assertion to check textarea.value instead of private signal.
  Removed 1 redundant pendingReason test from SummaryPanel. Result: 74 tests, all
  behavioural or domain-level, 0 private-member access outside condition-downgrade dialog.
  Next: one integration test covering the full return flow.

- `feat(dev-011)` — EPIC: Bonus + polish. All 5 tasks complete:
  B-1: `ConditionDiffBadgeComponent` (secondary bonus) — "Was: X → Now: Y" tag on Returned
  items; severity="warn" on downgrade, default otherwise; `@if hasDiff()` guard; `data-severity`
  attr for stable tests; 4 tests covering equal/worse/better/'Missing accessories' paths.
  B-2: A11y pass — `aria-live="polite"` on summary counts, `aria-label` on session `<main>`,
  `StatusBadgeComponent` TagSeverity alias removed (inline union).
  B-3: Responsive — session header stacks at ≤600px; employee-card gap; global box-sizing reset.
  B-4: README as deliverable — architecture diagram, lib boundary table, signal store rationale,
  ADR summary table, bonus features, testing strategy table, AI tooling note, "What's next".
  B-5: Navigation guard + rubric audit — `canDeactivateSession` (window.confirm, spec §FlowA);
  `OffboardingStore` moved to `@org/data-access` (non-lazy, avoids static-import lint violation);
  session page loading now uses `<p-skeleton>` instead of plain text; `docs/rubric-map.md` written.
  Total: 155 tests, lint 0 errors, build green. **Submission-ready.**

- `feat(dev-010)` — EPIC: Summary + completion. Four tasks delivered:
  C-1: `OffboardingStore.completeOffboarding()` — guards with `canComplete()`, sets
  `completedAt` ISO timestamp, clears `isDirty`; 5 unit tests (happy, Issue-with-notes,
  throws-on-pending, throws-no-session, clears-dirty).
  C-2: `SummaryPanelComponent` (dumb, `libs/ui`) — live Pending/Returned/Issue count
  chips with WCAG-AA colour tokens; "Complete offboarding" `<p-button>` (disabled +
  `pendingReason` text when `!canComplete`); completed read-only banner with sticky
  positioning, `var(--p-green-700)` contrast-corrected icon, `<time>` + null fallback;
  11 tests.
  C-3: `readOnly = input<boolean>(false)` on `EquipmentRowComponent` — suppresses all
  action buttons; status badge shown for Pending rows in readOnly too; relayed through
  `EquipmentListComponent`; 3 tests.
  C-4: `OffboardingSessionPageComponent` wired — 7 computed signals (`pendingCount`,
  `returnedCount`, `issueCount`, `sessionCanComplete`, `sessionHasOpenIssues`,
  `pendingReason`, `isCompleted`); `onComplete()` with `escapeHtml` guard and
  open-issue confirmation dialog listing item names + notes; `readOnly` bound to
  `isCompleted()`; 4 integration tests.
  Code review: CHANGES-REQUESTED → HTML injection, pendingReason fallthrough,
  missing guard, double-filter, formatDate duplication, 2 test gaps — all resolved.
  Design review: REWORK → sticky CTA (blocker fixed), WCAG contrast on icon, token
  cleanup (0.8/0.9rem → 0.875rem, border-radius token, #fff → CSS custom property).
  Final gates: 48 feature-offboarding + 36 ui tests, lint clean, build green.
  Next: EPIC: Bonus + polish.

- `feat(dev-009)` — EPIC: Return actions complete. `OffboardingStore` (plain signal
  service): session map, `editingItem`, `isDirty` computed; all 5 state transitions
  with guards + 20 unit tests. Dumb components in `libs/ui`: `StatusBadgeComponent`
  (colour-coded badge, not colour-only), `EquipmentRowComponent` (condition select,
  note field, suggest note, all outputs), `EquipmentListComponent` (relay layer).
  `OffboardingSessionPageComponent` (smart): resource() loads employee+items, seeds
  store, delegates all outputs; condition-downgrade soft-confirm via PrimeNG
  ConfirmationService; `isDirty` navigation guard; `CanDeactivateFn` on route;
  `suggestNote` fills noteHints signal. Code review resolved 4 blockers + 8 should
  items. Design review resolved 3 should items. All gates green. Next: Summary + completion.

- `feat(dev-008)` — EPIC: Data + employee list complete. Domain: `Employee.offboardingStatus`
  added (needed for list badge). Data-access: `InMemoryOffboardingRepository` behind
  `OFFBOARDING_REPO` InjectionToken (single DI instance via `inject()`); mock dataset (6
  employees: 4 active, 1 no equipment, 1 pre-completed). `IOffboardingRepository` port
  extended with `getEmployee(id)` (avoids `getEmployees()` scan on session page). Feature-
  offboarding: `EmployeeListPageComponent` (resource(), loading/error/empty states,
  Completed/In-progress badge, keyboard-accessible card nav); `OffboardingSessionPageComponent`
  scaffold (receives `employeeId` signal input, shows name+count, employee-not-found guard).
  Routes wired: both pages lazy-loaded. PrimeNG 21 + Aura theme configured. @testing-library/
  angular installed; 12 component integration tests + 11 repository unit tests, all green.
  Code review: CHANGES-REQUESTED → blockers (dual DI, silent not-found) + 6 should items
  resolved. Final: lint 5/5, test 5/5, build green. Next: EPIC: Return actions.

- `feat(dev-007)` — EPIC: Domain core complete. Pure-TS lib with zero Angular imports:
  string unions (ReturnCondition/ItemStatus/OffboardingStatus), all interfaces (Employee,
  AssignedItem, ReturnItem as composition, EmployeeSession), CONDITION_SEVERITY constant,
  assertNever exhaustiveness guard, isConditionWorse, canComplete, hasOpenIssues, suggestNote
  template engine (6 types × 3 conditions + fallback, switch-guarded with assertNever),
  IOffboardingRepository read-only port. 54 unit tests, all green. Code review passed
  (APPROVE-WITH-NITS); nits addressed (assertNever wired into suggestNote switch,
  it.each label fixed, content spot-checks + assertNever test added).
  Next: EPIC: Data + employee list.

- `feat(meta-006)` — add design layer: `ui-designer` sub-agent, `visual-design` playbook,
  `design-review` skill + command; wired into roster, indexes, primeng-usage, rubric-map.

- `build(dev-006)` — EPIC: Setup complete. Nx 22.7.5 + Angular 21 workspace scaffolded;
  apps/offboarding-shell (zoneless, OnPush, strict TS, withComponentInputBinding); four libs
  (domain/data-access/feature-offboarding/ui) with boundary tags; @nx/enforce-module-boundaries
  + no-restricted-imports on domain (zero Angular imports enforced); @angular-eslint/prefer-on-push
  as error; Prettier (singleQuote, printWidth 100); Husky pre-commit (lint-staged) + commit-msg
  (commitlint, custom dev-NNN/meta-NNN scopes); CI (.github/workflows/ci.yml, lint+test+build).
  All gates green: lint 5/5, test 5/5, build 5/5. Next: EPIC: Domain core.

- `docs(dev-005)` — ADR-0004 written: Nx lib split (domain/data-access/feature-offboarding/ui),
  plain signal store, OnPush+zoneless, smart/dumb contract, lazy routing; backlog updated
  (epic 1 complete, epics 2–7 sharpened). Next: EPIC Setup (devex-engineer).

- `docs(dev-004)` — spec v1.1 signed off: state machine (incl. Returned→Pending undo),
  completion predicate, all edge flows, bonus ACs; ADR-0002 + ADR-0003 written.
  Next: architecture ADR (ADR-0004) → backlog.

- `feat(dev-003)` — agent layer complete: 7 sub-agents, 14 skills, 7 commands, DEV+META
  memory, 7 playbooks, rubric-map. **Application build not started** — next is the
  Discovery+Spec+Architecture epic.

- `chore(dev-000)` — repo skeleton, layer separation, devcontainer, CLAUDE.md, README v0,
  ADR-0001 (tech stack). Application not yet scaffolded.
