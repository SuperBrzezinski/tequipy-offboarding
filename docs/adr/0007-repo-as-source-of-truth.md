# ADR-0007 — Repository as source of truth for session state

**Date:** 2026-06-01  
**Status:** Accepted  
**Supersedes:** — (extends ADR-0004, does not supersede it)

---

## Context

The original implementation held all mutable session state (item statuses, offboarding completion) in `OffboardingStore` — an `@Injectable` signal service that acted as a client-side shadow database keyed by `employeeId`. This worked, but conflated two unrelated concerns:

1. **Backend-replaceable persistence** — item statuses, offboarding completion, timestamps. In a real product these would live on the server and be fetched/mutated via HTTP.
2. **Pure UI state** — which item's form is currently open (`editingItem`). This has no backend equivalent; it is evanescent and component-scoped in spirit.

The tell: if you added a real backend (or `json-server`), the entire `_sessions` map and all related store methods would be deleted and replaced with HTTP calls. That is the wrong abstraction — the store was a backend substitute, not a frontend state manager.

---

## Decision

Move all session persistence into `IOffboardingRepository` (and its in-memory implementation), and reduce `OffboardingStore` to a single responsibility: tracking which item form is open.

### Repository (source of truth)
`IOffboardingRepository` now exposes write methods:
- `initSession(employeeId, items)` — seeds the session once (idempotent)
- `markItemReturned(employeeId, itemId, condition)` — Pending/Issue → Returned
- `markItemIssue(employeeId, itemId, note)` — Pending → Issue
- `revertItem(employeeId, itemId)` — Returned → Pending
- `completeOffboarding(employeeId)` — finalises the session; returns `completedAt`

`InMemoryOffboardingRepository` holds mutable instance-level state (not static module constants). `getEmployees()` reflects post-completion status in the same instance, so the employee list picks up completed status on its next render (which happens naturally on route re-activation).

### Store (pure UI state)
`OffboardingStore` retains only:
- `editingItem: Signal<{ itemId, mode } | null>`
- `isDirty: Signal<boolean>`
- `beginReturn / confirmReturn / cancelReturn / beginIssue / confirmIssue / cancelIssue / cancelAnyEdit`

### Session page component
The session page mirrors the repo state into local signals (`_items`, `_offboardingStatus`, `_completedAt`) after each mutation. This is the "optimistic update" pattern used in production HTTP clients: call the backend, set local state from the response.

The `resource()` loader calls `initSession` + `getSessionItems` on every activation, so navigating back to an employee restores the persisted state from the repo — exactly what a real backend would do.

---

## Consequences

**Positive**
- Replacing `InMemoryOffboardingRepository` with an HTTP client requires zero changes to `OffboardingStore`, the component, or the domain.
- `OffboardingStore` is now obviously correct: one signal, one concern.
- `EmployeeListPageComponent` no longer needs to know about `OffboardingStore` at all.
- The employee list automatically reflects completion status on route re-activation (repo is the single source of truth).

**Negative / trade-offs**
- The session page now holds a local copy of items (`_items` signal) in addition to the repo state. This is intentional: the component needs reactive rendering, and signals are the Angular primitive for that. A production HTTP client would do the same (local reactive cache + server round-trips).
- `completeOffboarding` updates `_offboardingStatus` locally but does not re-fetch `getEmployee`. On re-navigation to a completed session, `completedAt` falls back to `employee.completedAt` (set by the repo) which is correct.

---

## Alternatives considered

**Keep the store as-is:** rejected — the store was doing the backend's job. Adding a real backend would require deleting most of it, which is a sign of the wrong abstraction.

**Make the repo reactive (signals instead of Promises):** technically cleaner but deviates from how HTTP clients work. `Promise`-based methods are the universal contract; the local signal mirror in the component is the correct seam.
