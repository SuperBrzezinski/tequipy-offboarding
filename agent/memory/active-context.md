# Active context

- **Project phase:** COMPLETE — All epics shipped + visual overhaul done.
- **Mode:** dev
- **Active epic:** —
- **Last checkpoint:** `style(dev-017)` — Tailwind v4 + Inter font + full visual overhaul. All SCSS removed from components. PrimeNG p-button replaces all raw HTML buttons. Nav bar added to app shell. 129 tests green. (2026-05-31)
- **Next action:** none — project is submission-ready.

## Tailwind v4 integration details (dev-017)

- **Architecture**: Tailwind CLI (`pnpm tailwindcss`) pre-processes `tailwind-input.css` → `styles.css`. Angular build consumes pure CSS — no PostCSS plugin in Angular's pipeline (avoids esbuild service-mode deadlock with `@tailwindcss/oxide`).
- **Dev workflow**: `nx serve shell` runs Tailwind CLI watch + Angular dev-server in parallel via `nx:run-commands`. `nx build shell` runs `prebuild-css` target first.
- **Fonts**: Inter from Google Fonts in `index.html`; PrimeIcons added to `project.json` styles array.
- **Known pre-existing lint issue**: `@angular-eslint/component-selector` errors on `lib-*` selectors (not introduced by this increment; existed in dev-006).

## Architecture addendum (dev-011 change)

- `OffboardingStore` moved from `libs/feature-offboarding` to `libs/data-access`.
  Reason: the `canDeactivateSession` guard in the app shell needs a static import of
  the store. `feature-offboarding` is lazy-loaded by the app shell (via `loadComponent`),
  making static imports of it forbidden by `@nx/enforce-module-boundaries`.
  `data-access` is non-lazy and already imported statically by the app shell — correct layer.
- `canDeactivateSession` guard lives in `apps/offboarding-shell/src/app/offboarding-session.guard.ts`
  and imports `OffboardingStore` from `@org/data-access`.

## Architecture decisions (ADR-0004)

- Four libs: `domain` (pure TS), `data-access` (in-memory repo), `feature-offboarding` (signal store + smart page), `ui` (dumb components)
- App: `apps/offboarding-shell` (bootstraps, router, global styles)
- State: plain `@Injectable` signal service (`OffboardingStore`) — no NgRx
- Routing: `/offboarding/:employeeId` lazy-loaded; `withComponentInputBinding()` for route params
- Change detection: OnPush everywhere, zoneless, signal inputs
- Smart/dumb split: `OffboardingSessionPageComponent` is the **only** store consumer

## Confirmed decisions (full log in docs/discovery.md + docs/spec.md)

### State machine (ADR-0002)

- `Pending → Returned`, `Pending → Issue`, `Issue → Returned`, **`Returned → Pending`** (undo)
- Completion rule: zero Pending AND all Issues have non-empty notes
- Completion with open Issues: soft-confirm dialog listing **item names** (not just count)
- Condition downgrade (isConditionWorse): soft-confirm dialog

### Session model

- `ReturnItem` = composition `{ item: AssignedItem } & SessionFields` (not `extends`)
- `EmployeeSession` has: `items`, `offboardingStatus`, `completedAt`, `isDirty`
- `isDirty` = computed signal tracking open in-progress edits only (not Pending items)
- `CONDITION_SEVERITY: Record<ReturnCondition, number>` typed constant in domain layer
- `suggestNote(type, assignedCondition) → string` pure function in domain layer

### Bonus

- Primary: AI-assisted note (local template engine, LLM extension point)
- Secondary: condition diff badge on items with `returnCondition !== assignedCondition`

## ADRs written

- ADR-0001: tech stack (Angular 21, Nx, PrimeNG, Vitest, pnpm)
- ADR-0002: item state machine (v1.1 — includes Returned → Pending undo)
- ADR-0003: bonus feature choice
- ADR-0004: front-end architecture (lib split, signal store, routing, component tree)

## EPIC: Data + employee list — completed (dev-008)

- E-1: `Employee.offboardingStatus` added to domain type; mock dataset (6 employees, 11 items)
- E-2: `InMemoryOffboardingRepository` + `OFFBOARDING_REPO` token; `getEmployee(id)` on port
- E-3: `EmployeeListPageComponent` — resource(), all states, badge, keyboard nav; 6 integration tests
- E-4: `OffboardingSessionPageComponent` scaffold + routes wired; 5 integration tests; back nav

## What's in the codebase

- `libs/domain`: types, constants, pure functions, port interface — 54 unit tests
- `libs/data-access`: mock data + `InMemoryOffboardingRepository` — 11 unit tests
- `libs/feature-offboarding`: `EmployeeListPageComponent` + `OffboardingSessionPageComponent` (scaffold) — 12 integration tests
- `apps/offboarding-shell`: zoneless Angular 21 app, PrimeNG Aura, lazy routes

## EPIC: Setup — completed tasks (dev-006)

- S-1: Nx 22.7.5 workspace, Angular 21 app shell, strict TS, zoneless, pnpm
- S-2: Four libs with boundary tags; `@nx/enforce-module-boundaries` configured
- S-3: ESLint OnPush rule; Prettier (singleQuote, printWidth 100); domain `no-restricted-imports`
- S-4: Husky pre-commit (lint-staged) + commit-msg (commitlint, dev-NNN/meta-NNN scopes)
- S-5: CI pipeline (lint + test + build on push/PR)
