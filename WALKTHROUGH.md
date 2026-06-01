# Tequipy Home Task Walkthrough – Equipment Offboarding SPA

## 1. Executive Summary

The application is a single-page **Angular 21** SPA for processing employee equipment returns during offboarding. The stack features **Angular 21** (zoneless, standalone components, signals, `ChangeDetectionStrategy.OnPush` throughout), **PrimeNG 21** (Aura theme), **Tailwind CSS v4**, **Nx 22** for workspace management, and **Vitest + Angular Testing Library** for testing.

The primary engineering focus was **correct domain modelling first** — establishing a typed state machine and composable predicate functions — so that every UI safeguard and confirmation dialog falls naturally out of the domain logic rather than being scattered across component code.

---

## 2. Component Design & State Management

### Smart / Dumb Split

There is exactly one smart component per view:

| Component | Role |
| :--- | :--- |
| `EmployeeListPageComponent` | Fetches employees via `resource()`, renders a filterable/sortable list via PrimeNG, navigates. |
| `OffboardingSessionPageComponent` | **Smart**: The only consumer of `OffboardingStore`; owns all mutation logic. |
| `EquipmentRowComponent` | **Dumb**: Receives `AssignedItem` + editing flags as inputs, emits typed events. |
| `SummaryPanelComponent` | **Dumb**: Receives counts + status, emits complete event. |
| `ConditionDiffBadgeComponent` | **Dumb**: Two inputs, one computed output. |
| `StatusBadgeComponent` | Purely presentational. |

Every component leverages `ChangeDetectionStrategy.OnPush` and uses `input()` / `input.required<T>()` throughout. **There is no `@Input()` decorator in the codebase.**

### State Management: Two Separate Concerns

1. **`OffboardingStore`**: A plain `@Injectable` signal service that holds exactly one piece of UI state: which item form is currently open (`editingItem: Signal<{ itemId, mode } | null>`). The `isDirty` signal is computed as `editingItem() !== null`. That is the entire UI store.
2. **`InMemoryOffboardingRepository`**: The source of truth for all session persistence (statuses, conditions, notes, completion timestamps). It implements the `IOffboardingRepository` port interface defined in the domain layer. The session page component calls the repo for every mutation and updates its local signals from the returned payload — mirroring the exact pattern used with a real HTTP client. Swapping to a real backend simply means replacing `useClass: InMemoryOffboardingRepository` with an HTTP implementation; the components remain untouched.

> **Architectural Note (ADR-0005):** This boundary was the result of an explicit refactor. The original design held session state directly in the store, acting as a shadow database. Pushing persistence to a dedicated Repository prevents the Store from absorbing backend responsibilities.

### Routing

Feature routes are lazy-loaded via `loadChildren`. `withComponentInputBinding()` is configured so the `:employeeId` route param arrives directly as a signal `input.required<string>()` on `OffboardingSessionPageComponent` — eliminating the need for `ActivatedRoute` injection. The `canDeactivateSession` guard reads `store.isDirty()` and surfaces a confirmation dialog before allowing navigation away from unsaved edits.

---

## 3. TypeScript & Data Model

All domain types are string union literals — **no enums, no `any` escapes**.

*(Why string unions over enums? TypeScript enums emit runtime IIFEs that slightly increase bundle size and deviate from standard ECMAScript. String unions are entirely erased at compile time, guarantee structural typing, and provide a cleaner developer experience).*

```typescript
// libs/offboarding-feature/domain/src/lib/types.ts
export type ReturnCondition = 'Good' | 'Damaged' | 'Missing accessories';
export type ItemStatus = 'Pending' | 'Returned' | 'Issue';
export type OffboardingStatus = 'In progress' | 'Completed';
```

The condition severity order is encoded as a typed constant in the domain layer, not in component logic:

```typescript
// constants.ts
export const CONDITION_SEVERITY: Record<ReturnCondition, number> = {
  Good: 2,
  'Missing accessories': 1,
  Damaged: 0,
};
```

`isConditionWorse` compares severity scores from this map. The template uses `Object.keys(CONDITION_SEVERITY)` to derive dropdown options, ensuring the UI can never drift out of sync with the type union.

**Exhaustive Checks:** `assertNever` is used in `suggestNote` to make the switch exhaustive at compile time. Adding a new `ReturnCondition` would break the build immediately, ensuring safety.

**Separation of States:** `AssignedItem` has both `assignedCondition` (baseline) and an optional `returnCondition`. They are separate fields rather than overwrites, as displaying the diff ("Was: Good → Now: Damaged") requires both values.

---

## 4. UX Judgement

Every UI safeguard is rooted in an explicit domain or workflow reason:

**Scalable Employee Search (Filtering & Sorting):** In a real enterprise scenario, an IT admin deals with dozens or hundreds of pending offboardings, not just two. Adding instant filtering and sorting to the employee list was critical for real-world usability. By leveraging PrimeNG's built-in table features, this high-value UX capability was implemented at virtually zero engineering cost, demonstrating pragmatic library usage over reinventing the wheel.

**Condition-Downgrade Dialog:** When an admin marks an item as Returned with a condition worse than its baseline (`isConditionWorse` is true), a confirmation dialog fires naming the item and the condition delta. It does not fire when the condition is the same or better, removing unnecessary friction.

**Soft Confirm for Open Issues:** HR and payroll cannot wait indefinitely for unrecovered assets. The app allows completion with open Issues but surfaces a dialog listing the names and notes of every unrecovered item. The admin makes an explicit, informed acknowledgment, which acts as an audit record.

**Returned → Pending Undo:** A mis-click when returning an item could create an irrecoverable chargeback. Undo reverts the state to Pending and forces re-processing.

**Mandatory Issue Notes:** A blank flag is not an audit trail. The `canComplete` predicate enforces `note.trim().length > 0` on all Issue items. The `pendingReason` computed signal explicitly tells the admin why the "Complete offboarding" button is disabled (e.g., "1 issue item needs a note").

**Deactivation Guard:** Navigating away while an item's return/issue form is open triggers an unsaved edit warning, preventing silent data loss.

---

## 5. Test Reasoning

The testing strategy focuses on business logic and critical paths over pure rendering, organized strictly by architectural layers.

*   **Domain Layer (Pure Functions):** Tests target the most load-bearing predicates. `canComplete` validates edge cases like programmatic bypasses of form validators (e.g., whitespace-only notes via `.trim()`). `isConditionWorse` exhaustively covers the condition matrix to prevent false-positive dialogs. For the `suggestNote` feature, tests apply a 3-tier strategy (non-empty return → distinct values per condition → keyword spot-checks) to guarantee the template mapping is genuinely wired and exhaustive, rather than just returning hardcoded strings.
*   **Data-Access Layer:** `InMemoryOffboardingRepository` is tested as the authoritative source of truth. Tests verify state transitions, reference isolation (returning copies), and rejection contracts, rather than just mocking data returns.
*   **Feature & Integration Layer:** `OffboardingSessionPageComponent` exercises the full mutation round-trip (action → confirmation dialog → repo mutation → signal update → UI re-render) using a stateful mock repo. Relying on shallow `vi.fn()` mocks at the method level would have hidden the critical interaction between state signals and the `ConfirmationService` lifecycle. Routing guards (`canDeactivateSession`) are tested via Observables to guarantee unsaved edits are never silently lost.

---

## 6. AI Tooling — Honest Account

I heavily leveraged AI (Claude Code with a multi-agent setup) as a force multiplier during this task. While I drove the architectural decisions, domain modeling, and final UX logic, I used AI to rapidly scaffold standalone components, generate boilerplate TypeScript interfaces, and draft tests based on my specifications.

**Where AI accelerated things:**

- **Specification and ADRs:** Discovery thoughts were quickly formalized into ADRs.
- **Boilerplate elimination:** Standalone component scaffolding and module-boundary configuration were generated instantly.
- **Test structure:** The AI correctly drafted the stateful mock repo pattern and the non-obvious setup for capturing the `ConfirmationService` accept callbacks in integration tests.

**Where I had to correct and guide the AI:**

- **Architectural Corrections:** Early AI drafts placed session persistence inside `OffboardingStore`, making it a shadow database. I had to explicitly push back and enforce the Repository-as-source-of-truth model to keep the architecture scalable.
- **Tailwind v4 Integration:** The AI generated an outdated `.mjs` PostCSS config that Angular silently ignored. Diagnosing this required reading Angular build internals manually to switch to the required `postcss.config.json` and `@source` directives.

---

## 7. Bonus Features Implemented

### Primary: AI-Assisted Note Suggestion

The "Suggest note" button calls `suggestNote(item.type, condition)` — a pure domain function. It contains templates for various device types. It intelligently defaults to checking the `assignedCondition`, unless an item is flagged as an Issue while in `'Good'` condition, in which case it defaults to `'Damaged'` (the most common reason for flagging a Good item).

**UX Detail:** The suggestion populates the textarea but remains editable. Applying it does not erase a note the admin has already started typing.

### Secondary: Condition Diff Badge

The `ConditionDiffBadgeComponent` renders a tag whenever `returnCondition !== assignedCondition`. The severity is styled `'warn'` (amber) when `isConditionWorse` is true, and unstyled when the condition has actually improved. It cleanly surfaces discrepancies at a glance.

---

## 8. Next Steps (If I Had More Time)

**Real Backend + Optimistic Mutations:** The `IOffboardingRepository` is already HTTP-shaped. Connecting it to a real API is a drop-in replacement. With a real async layer, I would add per-mutation loading and error states (which Angular 21's `resource()` API handles gracefully).

**Real LLM Call for Note Suggestions:** The `suggestNote` signature is already designed for this. I would replace the template lookup with a backend `fetch()` that queries an LLM (e.g., "Write a 1-sentence return note for a Damaged Monitor"). A fallback to local templates on network failure would ensure reliability.

**Accessibility Audit & Keyboard Navigation:** While current elements use native buttons and semantic HTML, a full WCAG 2.1 AA pass with a screen reader (particularly testing the `ConfirmDialog` focus trap) is the most significant gap for a production-facing internal tool used daily.
