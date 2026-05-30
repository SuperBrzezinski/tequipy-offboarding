# ADR-0004 — Front-end architecture: library split, state, routing, and component tree

- **Status:** Accepted
- **Date:** 2026-05-30
- **Deciders:** solution-architect + orchestrator + operator
- **Mode:** dev
- **Tags:** architecture, layering, state, routing

---

## Context

ADR-0001 ratified the stack (Angular 21 zoneless + signals, Nx 22.3+, PrimeNG 21). This ADR
commits the *internal* architecture: how the monorepo is divided into Nx libraries, where
state lives, what the component tree looks like, and how routing and data access are wired.
These decisions are the primary axis the rubric probes ("is state lifted to the right level?",
"are components well-scoped?"). Getting them wrong silently — code that works but looks
spaghetti — is worse than declaring a coherent architecture up front.

The app has **one primary view** (the offboarding session screen for one employee) and at most
a minimal landing/error boundary. The domain is already specified (ADR-0002/0003). There are
no real async back-end calls; the data layer is in-memory. Complexity lives in the state
machine and UX flows, not in HTTP orchestration. The architecture must therefore be clean
enough to demonstrate senior judgement without being over-engineered for its actual size.

---

## Decision

### 1. Nx library split

Four publishable-boundary libs; one app shell. Dependencies are **inward only**.

```
apps/
  offboarding-shell/          ← Angular app: bootstraps providers, router, global styles

libs/
  domain/                     ← pure TypeScript, zero Angular imports
  data-access/                ← in-memory repository; implements domain port
  feature-offboarding/        ← signal store + use-cases; lazy-loaded feature module
  ui/                         ← presentational components + PrimeNG wrappers
```

**Module boundary tags** (enforced by `@nx/enforce-module-boundaries`):

| Library tag       | May depend on                    | Must not depend on          |
|-------------------|----------------------------------|-----------------------------|
| `type:domain`     | (nothing)                        | everything                  |
| `type:data-access`| `type:domain`                    | `type:feature`, `type:ui`   |
| `type:feature`    | `type:domain`, `type:data-access`| `type:ui` (reads, not lays) |
| `type:ui`         | `type:domain`                    | `type:feature`, `type:data-access` |
| `type:app`        | all                              | —                           |

Note: `ui` components receive domain types as inputs but know nothing of stores or repos.
`feature` composes `ui` components and injects the store and repo. `domain` has no Angular
import — the lint rule enforces it mechanically.

**What lives where:**

`libs/domain/`
- `AssignedItem`, `ReturnItem`, `SessionFields`, `EmployeeSession`, `ReturnCondition`,
  `ReturnStatus`, `OffboardingStatus` type definitions
- `CONDITION_SEVERITY` constant
- `itemStatusMachine` — the pure transition guard function (`canTransition(from, to)`)
- `canComplete(items)` — completion predicate
- `isConditionWorse(from, to)` — condition downgrade guard
- `suggestNote(type, condition)` — AI-note template engine (ADR-0003)

`libs/data-access/`
- `OffboardingRepository` — injectable service, in-memory; loads `MOCK_SESSIONS` at
  construction
- `MockSessionsData` constant (the hardcoded dataset — one employee with 6–8 items)
- Implements the `IOffboardingRepository` port interface (defined in `domain`)

`libs/feature-offboarding/`
- `OffboardingStore` — the single signal store for the active session (see §2)
- `OffboardingSessionPageComponent` — smart container; the only component that injects the
  store
- Route definition (`offboardingRoutes`) used by lazy-loading

`libs/ui/`
- `EquipmentListComponent` — renders the list of `ReturnItem[]`; all inputs/outputs
- `EquipmentRowComponent` — single row: status badge, condition select, note field, actions
- `StatusBadgeComponent` — maps `ReturnStatus` to PrimeNG `p-tag` severity
- `ConditionDiffBadgeComponent` — the bonus condition-diff chip (ADR-0003)
- `CompleteOffboardingDialogComponent` — confirmation dialog (wraps `p-dialog`)
- `NoteFieldComponent` — textarea + "Suggest note" button; emits the final note value

---

### 2. State management — plain Angular signals + injectable service store

The session state lives in a single class, `OffboardingStore`, decorated with
`@Injectable({ providedIn: 'root' })` or (preferably) provided at the feature route level via
`providers` on the route config.

```typescript
// libs/feature-offboarding/store/offboarding.store.ts  (skeleton only)

@Injectable()
export class OffboardingStore {
  // --- private writable signals (the single source of truth)
  private readonly _session = signal<EmployeeSession | null>(null);

  // --- public read-only projections
  readonly session   = this._session.asReadonly();
  readonly items     = computed(() => this._session()?.items ?? []);
  readonly pending   = computed(() => this.items().filter(i => i.returnStatus === 'Pending'));
  readonly canComplete = computed(() => canComplete(this.items()));
  readonly isDirty   = computed(() => /* items with non-Pending in-progress edits */);

  // --- use-case methods (the only mutation surface)
  transitionItem(itemId: string, to: ReturnStatus): void { ... }
  updateCondition(itemId: string, condition: ReturnCondition): void { ... }
  updateNote(itemId: string, note: string): void { ... }
  completeSession(): void { ... }
}
```

State mutations call domain pure functions (`canTransition`, `isConditionWorse`) before
writing. The store never imports from `ui`. Components call store methods; they never write
signals directly.

**Why plain signals, not NgRx SignalStore or NgRx ComponentStore:**

- NgRx SignalStore (`@ngrx/signals`) is the modern answer, but adds a dependency and its
  opinionated `withState`/`withMethods`/`withComputed` API is indirection that buys nothing
  at this scale.
- NgRx ComponentStore is the previous-generation answer; its RxJS internals conflict with the
  "signals over streams" stance in a zoneless app.
- Plain `signal()` + `computed()` inside an injectable service is idiomatic Angular 21, zero
  extra dependencies, and completely transparent to tests (construct, call, assert — no
  TestBed required for domain functions).
- **This is not a simplification rationalized post-hoc.** The Angular team's own guidance
  for small-to-medium apps without cross-cutting side-effects is to use signals directly.
  NgRx is for apps where devtools debugging, effects middleware, or cross-store
  synchronization justify the overhead.

---

### 3. Component tree

```
AppComponent (shell, router-outlet)
└── OffboardingSessionPageComponent   [SMART — injects OffboardingStore]
    ├── EmployeeHeaderComponent        [dumb — @Input() employee]
    ├── EquipmentListComponent         [dumb — @Input() items; @Output() events]
    │   └── EquipmentRowComponent      [dumb — @Input() item; @Output() statusChange, conditionChange, noteChange]
    │       ├── StatusBadgeComponent   [dumb — @Input() status]
    │       ├── ConditionDiffBadgeComponent  [dumb — @Input() assigned, returned]
    │       └── NoteFieldComponent     [dumb — @Input() note, itemType, condition; @Output() noteChange, suggestRequested]
    └── CompleteOffboardingDialogComponent  [dumb — @Input() visible, openIssueItems; @Output() confirmed, cancelled]
```

**Smart vs dumb contract:**

- `OffboardingSessionPageComponent` is the **only smart component**: it reads store signals
  via `computed` template expressions and forwards events to store methods. It also handles
  dialog visibility as local component state (a `signal<boolean>` on the component itself —
  this is transient UI state that does not belong in the store).
- Every component in `libs/ui/` is **dumb**: `@Input()` with `input()` signal inputs, no
  store injection, no side effects, no business rules. The condition-downgrade confirmation
  fires from the page component after receiving a `conditionChange` event — not from the row
  component, which only emits.
- `isDirty` is a store `computed` but its *display* (a "You have unsaved changes" banner) is
  triggered by reading `store.isDirty` in the page component template — no effect needed.

---

### 4. Routing

```
/                        → redirect to /offboarding/emp-001  (seeded from mock data)
/offboarding/:employeeId → lazy loads OffboardingSessionPageComponent
/not-found               → inline 404 template (one-liner)
```

The `:employeeId` param is read in `OffboardingSessionPageComponent` via `inject(ActivatedRoute)`
(or preferably `inject(Router).getCurrentNavigation()` / input binding with `withComponentInputBinding()`
enabled in the router config). On init, the component calls `store.loadSession(employeeId)` which
delegates to `OffboardingRepository`.

**No route resolver.** The single async operation (in-memory lookup — effectively synchronous)
does not justify a resolver. The page shows a `@if (store.session(); else loading)` guard.
If the SPA were to grow a real API, a resolver would be the correct next step; recording that
intent in the README is sufficient.

**Lazy loading.** `feature-offboarding` is lazy-loaded to demonstrate the pattern, even
though the bundle difference is trivial. The Nx boundary rule ensures the feature chunk
cannot bleed into the initial bundle.

---

### 5. Data access

`OffboardingRepository` is an `@Injectable()` service in `libs/data-access/`. It holds a
`MOCK_SESSIONS` array (defined in a sibling `mock-data.ts` file) and exposes two methods:

```typescript
getSession(employeeId: string): EmployeeSession | undefined
saveSession(session: EmployeeSession): void   // updates in-memory array; no real persistence
```

The store injects `OffboardingRepository`. If a real API were introduced, only
`data-access` changes — the store and everything above it remain untouched, because the
store depends only on the repository's method signatures (the `IOffboardingRepository`
interface in `domain`), not the implementation.

`saveSession` is called by `completeSession()` in the store. It does not trigger a network
call; the side-effect is purely local. This keeps the store synchronous and avoids any
loading state complexity that would require an unearned `resource()` / `toSignal()` pattern.

---

### 6. Change detection

- `ChangeDetectionStrategy.OnPush` on **every component**, including the smart page
  component. This is the Angular 21 default; we will enforce it with an ESLint rule
  (`@angular-eslint/prefer-on-push-component-change-detection`) to catch any component
  generated without it.
- Zoneless is already in effect (Angular 21 default in new Nx workspaces). There is no
  Zone.js; change detection fires only on signal reads and explicit `markForCheck()` calls.
- Dumb components update only when their `@Input()` signal inputs change. Because inputs are
  `input()` signal inputs (not decorator-based), Angular 21 tracks them natively without
  needing `markForCheck`.
- The page component reads store signals in the template; Angular schedules a re-render
  automatically when any signal the template subscribes to changes. No manual subscription
  management required.
- `effect()` is reserved for: logging the session state in dev mode. Nothing else. All
  derived display values are `computed`.

---

## Consequences

- **Positive:** Layer boundaries are mechanically enforced by Nx lint rules — no runtime
  regression can silently violate them. The store is a plain class with public signals;
  testing it requires no Angular TestBed and no mocking framework magic. The component tree
  is unambiguously smart/dumb, which makes every component independently testable. The domain
  layer has zero Angular imports — it can be extracted, open-sourced, or reused in a Node
  backend without modification.
- **Negative / cost:** Four libs is more scaffolding than a single-module app would need.
  The overhead is justified by the rubric scoring of layering, but the README must explain it
  as intentional, not resume-driven. Providing the route for a single employee via a redirect
  means the "landing" is not a real list view — this is a deliberate scope choice (see spec),
  not a gap.
- **Follow-ups:**
  - `devex-engineer` to configure `@nx/enforce-module-boundaries` tags in `nx.json`.
  - `devex-engineer` to add `@angular-eslint/prefer-on-push-component-change-detection` rule.
  - `frontend-engineer` to use `withComponentInputBinding()` in router config so route
    params bind as signal inputs without `inject(ActivatedRoute)` boilerplate.
  - ADR-0005 (testing strategy) to specify what gets unit- vs integration-tested.

---

## Alternatives considered

- **NgRx SignalStore for state.** Adds a well-designed abstraction and integrates with
  Redux DevTools. Rejected: the overhead (extra package, feature patterns, mental model) is
  disproportionate for a single-session SPA with one store. The rubric rewards correctness of
  placement, not sophistication of tooling.
- **Single flat lib (no split).** Faster to scaffold but defeats the stated purpose: an Nx
  monorepo without enforced boundaries is just a folder, not an architecture. Rejected.
- **Server-side data (HTTP + `HttpClient`).** Outside scope; adds async loading states,
  error handling, and retry logic that consume time without adding rubric signal. The
  in-memory repo is honest and testable. Rejected.
- **Smart components throughout (store injected in rows).** Faster to write; harder to test
  and reason about. A row component that directly calls the store is not a component — it is
  an anonymous fragment of the feature. Rejected.
- **Route resolver for session loading.** Correct for real async; unnecessary complexity for
  a synchronous in-memory lookup. Rejected for core; documented as the correct next step.

---

## README line

> The codebase is split into four Nx libs (`domain`, `data-access`, `feature-offboarding`, `ui`) with module-boundary lint rules enforcing inward-only dependencies; a single injectable signal store owns session state, and only the page-level smart component touches it — all `ui/` components are pure input/output.
