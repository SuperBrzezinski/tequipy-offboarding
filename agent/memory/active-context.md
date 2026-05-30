# Active context

- **Project phase:** BUILDING — EPIC: Domain core COMPLETE. Next = EPIC: Data + employee list.
- **Mode:** dev
- **Active epic:** none (next = EPIC: Data + employee list)
- **Last checkpoint:** `feat(dev-007)` — Domain core: all types, pure functions, 54 tests green (2026-05-30).
- **Next action:** EPIC: Data + employee list → `task-breakdown` → `frontend-engineer`.

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

## EPIC: Setup — completed tasks (dev-006)

- S-1: Nx 22.7.5 workspace, Angular 21 app shell, strict TS, zoneless, pnpm
- S-2: Four libs with boundary tags; `@nx/enforce-module-boundaries` configured
- S-3: ESLint OnPush rule; Prettier (singleQuote, printWidth 100); domain `no-restricted-imports`
- S-4: Husky pre-commit (lint-staged) + commit-msg (commitlint, dev-NNN/meta-NNN scopes)
- S-5: CI pipeline (lint + test + build on push/PR)
