# Active context

- **Project phase:** ARCHITECTURE COMPLETE — ready to build.
- **Mode:** dev
- **Active epic:** none (next = EPIC: Setup)
- **Last checkpoint:** ADR-0004 written + backlog shaped (2026-05-30).
- **Next action:** pick up EPIC: Setup → `task-breakdown` → `devex-engineer`.

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
