# ADR-0006 — Merge session state into AssignedItem; remove session layer

**Date:** 2026-06-01  
**Status:** Proposed — not yet implemented

---

## Context

After ADR-0005 (repo-as-source-of-truth), `OffboardingStore` was reduced to UI state only
(`editingItem`). However, the repository still carries a session layer: `initSession`,
`getSessionItems`, and an internal `_sessionItems: Map<string, ReturnItem[]>`. This exists
solely because `AssignedItem` (our "backend" type) has no status fields — so status must be
synthesised client-side on first load and stored somewhere.

A real backend would never work this way. `GET /employees/:id/items` would return items
**with their current status already in the payload**. There is no separate "session
initialisation" step — you just fetch and render what the server gives you.

The conclusion: the session layer (both the old `OffboardingStore._sessions` map and the
current `_sessionItems` map in the repo) is a fake backend, not a frontend architectural
necessity.

---

## Decision

Extend `AssignedItem` to include return-status fields, eliminating `ReturnItem` as a
separate type and removing the session initialisation layer entirely.

### Domain type change

```typescript
// Before
interface AssignedItem {
  id: string; employeeId: string; name: string; type: string;
  serialNumber?: string; assignedCondition: ReturnCondition;
}
type ReturnItem =
  | { item: AssignedItem; status: 'Returned'; returnCondition: ReturnCondition; note: string }
  | { item: AssignedItem; status: 'Pending' | 'Issue'; returnCondition?: ReturnCondition; note: string };

// After — one flat type, status baked in
interface AssignedItem {
  id: string; employeeId: string; name: string; type: string;
  serialNumber?: string; assignedCondition: ReturnCondition;
  // return-status fields — present from first fetch, mutated in place
  status: ItemStatus;           // default: 'Pending'
  returnCondition?: ReturnCondition; // set when status = 'Returned'
  note: string;                 // default: ''
}
```

`ReturnItem` is removed. All code that previously referenced `ReturnItem` uses `AssignedItem`
directly.

### Repository port changes

Remove:
- `initSession(employeeId, items): Promise<void>`
- `getSessionItems(employeeId): Promise<ReturnItem[] | null>`

Mutations now operate directly on `AssignedItem[]`:
- `markItemReturned(employeeId, itemId, condition): Promise<AssignedItem[]>`
- `markItemIssue(employeeId, itemId, note): Promise<AssignedItem[]>`
- `revertItem(employeeId, itemId): Promise<AssignedItem[]>`
- `completeOffboarding(employeeId): Promise<string>`

`getAssignedItems(employeeId)` already returns items with their current status — no
initialisation step needed.

### Repository implementation changes

`InMemoryOffboardingRepository`:
- `_sessionItems: Map` is removed
- `_items: AssignedItem[]` (copy of MOCK_ASSIGNED_ITEMS with status fields) is the single
  mutable store
- `getAssignedItems` returns a copy of the current state (including any mutations applied
  in this session)
- Mutation methods update `_items` in place and return the updated slice

### Mock data changes

`MOCK_ASSIGNED_ITEMS` gains `status: 'Pending'`, `note: ''` defaults.  
Employees already marked `Completed` in mock data get `status: 'Returned'` on their items.

### Component changes

`OffboardingSessionPageComponent`:
- `_items` signal type changes from `ReturnItem[]` to `AssignedItem[]`
- resource loader: remove `initSession` + `getSessionItems` calls; just `getAssignedItems`
- `_isSessionLoaded` can be derived from `!sessionResource.isLoading() && !!sessionResource.value()?.employee`
- All references to `item.item.name` etc. (the nested composition) become `item.name`

---

## Consequences

**Positive**
- `ReturnItem` type disappears — one less layer of indirection everywhere
- `initSession` / `getSessionItems` disappear from the port
- Resource loader in the component becomes trivially simple
- Mock data is the single source of truth — no "seeding" logic
- The port now faithfully mirrors what a real REST backend would expose

**Negative / trade-offs**
- `AssignedItem` becomes a "fat" type that carries both assignment and return-status data.
  In a real system these might come from different services. Acceptable for this scope.
- All existing tests that reference `ReturnItem` or `item.item.*` need to be updated.

---

## Files to change

| File | Change |
|------|--------|
| `domain/src/lib/types.ts` | Extend `AssignedItem`; remove `ReturnItem` |
| `domain/src/lib/repository.port.ts` | Remove `initSession`, `getSessionItems`; return types `AssignedItem[]` |
| `domain/src/lib/predicates.ts` | Update `canComplete`, `hasOpenIssues` signatures |
| `data-access/src/lib/mock-data.ts` | Add status/note defaults |
| `data-access/src/lib/offboarding.repository.ts` | Remove `_sessionItems`; single `_items` store |
| `data-access/src/lib/offboarding.repository.spec.ts` | Update all tests |
| `feature/…/offboarding-session-page.component.ts` | `_items: AssignedItem[]`; remove session init |
| `feature/…/offboarding-session-page.component.spec.ts` | Update makeRepo + assertions |
| `feature/…/equipment-*.component.ts + .html` | `item.name` instead of `item.item.name` |
| `domain/…/*.spec.ts` | Update fixtures |
