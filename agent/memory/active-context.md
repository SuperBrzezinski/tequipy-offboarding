# Active context

- **Project phase:** SPEC COMPLETE — architecture ADR is next.
- **Mode:** dev
- **Active epic:** none
- **Last checkpoint:** spec authoring complete (2026-05-30). Spec v1.1 signed off.
- **Next action:** run `solution-architect` to produce architecture ADR (layer split, store
  design, component tree). Then `backlog-planning` to create epics.

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

## Next ADR
- ADR-0004: architecture — layer split, store design, component tree (solution-architect)
