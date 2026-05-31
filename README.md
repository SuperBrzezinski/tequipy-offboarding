# Employee Equipment Offboarding — Tequipy take-home

A production-quality SPA for IT administrators to process the equipment return step of an
employee offboarding workflow. Built as a Founding Frontend Engineer assessment submission.

> Stack: **Angular 21 · Nx 22 · PrimeNG 21 · Tailwind v4 · TypeScript strict · Vitest · Angular Testing Library**

---

## Quick start

```bash
pnpm install
pnpm nx serve shell                       # http://localhost:4200
pnpm nx run-many --target=test --all     # all unit + integration tests
```

The dev server binds to `0.0.0.0:4200`. No environment variables or API keys required — all
data is in-memory.

---

## What it does

- **Employee list** — name, department, offboarding date, `Completed` badge for
  already-processed employees; click a row to open the session.
- **Equipment return workflow** — mark each item as Returned (with condition) or Issue (with
  a mandatory note); undo a return at any time; soft-confirm dialog when the returned
  condition is worse than the assigned condition.
- **Issue reporting** — inline note field; `isDirty` is `true` while the field is uncommitted;
  navigating away while dirty triggers an unsaved-changes warning.
- **Summary panel** — live Pending / Returned / Issue counts; updates synchronously on every
  state change via signal `computed`.
- **Completion flow** — enabled only when zero items remain Pending and every Issue has a
  non-empty note; if Issues remain open, a soft-confirm dialog lists their names before
  committing; view becomes read-only with a `completedAt` timestamp.
- **Session persistence** — each employee's session is cached in the signal store for the
  browser session; navigating between employees and back preserves state exactly.

---

## Architecture

### Layer diagram

```
apps/shell                        bootstrap, router config, global styles
          |
libs/offboarding-feature          OffboardingStore, page + dumb components
          |               \
  domain                   data-access
  pure TypeScript,          InMemoryOffboardingRepository,
  zero Angular imports      mock dataset
```

Dependencies are **inward only**. `@nx/enforce-module-boundaries` tags make any violation a
lint error, not a convention.

### Library structure

| Library | Contents | Boundary rule |
|---|---|---|
| `offboarding-feature` | `OffboardingStore`, page components, dumb UI components | Imports `domain` and `data-access`; no other libs |
| `offboarding-feature/domain` | Types, constants, pure functions, `IOffboardingRepository` port | No Angular; zero outbound deps |
| `offboarding-feature/data-access` | `InMemoryOffboardingRepository`, mock dataset (2 employees, 5 items) | Depends on `domain` only |

`domain` has zero Angular imports — enforced by a `no-restricted-imports` ESLint rule in the
lib, not just convention. It can run in a Node backend or be published as a standalone
package without modification.

### Signal store

`OffboardingStore` is a plain `@Injectable()` service with a
`WritableSignal<Map<employeeId, EmployeeSession>>`. No NgRx. All derived state
(`pendingCount`, `canComplete`, `isDirty`, etc.) is `computed`. Mutation methods
(`confirmReturn`, `confirmIssue`, `completeOffboarding`) call domain pure functions before
writing. `OffboardingSessionPageComponent` is the only component that injects the store;
everything in `libs/ui` receives data as signal inputs and emits events via `output()`.

NgRx SignalStore was considered and rejected: `withState`/`withMethods`/`withComputed`
indirection adds overhead that buys nothing at this scale, and the Angular team's own
guidance for apps without cross-cutting effects is to use signals directly.

### Change detection

`ChangeDetectionStrategy.OnPush` on every component, enforced by
`@angular-eslint/prefer-on-push-component-change-detection`. Angular 21 is zoneless by
default — change detection fires only on signal reads. Signal inputs (`input()`) are tracked
natively; no `markForCheck()` calls anywhere.

### Routing

```
/                        → redirect to employee list
/offboarding/:employeeId → lazy-loaded OffboardingSessionPageComponent
```

`withComponentInputBinding()` is enabled in the router config (`app.config.ts`), so
`employeeId` arrives as a signal input on the page component with no `inject(ActivatedRoute)`
boilerplate. The feature lib is lazy-loaded to demonstrate bundle-splitting; the Nx boundary
rule ensures no feature code leaks into the initial chunk.

---

## Key decisions (ADR summary)

| # | What was decided | Why |
|---|---|---|
| [ADR-0001](docs/adr/0001-tech-stack.md) | Angular 21 (standalone, zoneless, signals) on Nx 22 with PrimeNG 21 and Vitest | Zoneless eliminates Zone.js patching overhead and removes `async`/`fakeAsync` ceremony from tests; signals give co-located reactivity without an external state library; Nx makes boundary enforcement mechanical |
| [ADR-0002](docs/adr/0002-item-state-machine.md) | `Pending → Returned ↔ Pending` (undo) and `Pending → Issue → Returned`; completion requires zero Pending items and non-empty notes on all Issues; open Issues trigger a soft-confirm dialog listing item names | A mis-click creating an irrecoverable chargeback record is worse than allowing undo; blank-note Issues fail audit; hard-blocking completion on open Issues lets asset recovery hold up payroll |
| [ADR-0003](docs/adr/0003-bonus-feature.md) | AI-assisted note as a local template engine (`suggestNote`) + condition diff badge as secondary bonus | The template approach is honest about the implementation; the function signature is the extension seam for a real LLM call; the diff badge surfaces a real admin risk (undeclared damage chargeback) at near-zero implementation cost |
| [ADR-0004](docs/adr/0004-architecture.md) | Four Nx libs with inward-only dependencies; single injectable signal store; only the smart page component touches the store; all `ui` components are pure input/output | Boundary rules that are mechanically enforced cannot drift; one store owner makes state provenance unambiguous; dumb components are independently testable without TestBed |

---

## Bonus features

### AI-assisted note suggestion

A "Suggest note" button appears on the issue-note field whenever an item is in issue-entry
mode. Clicking it calls `suggestNote(type, assignedCondition)` — a pure function in
`libs/domain` — and pre-fills the textarea with a context-aware template. The admin can
edit the suggestion freely before confirming.

Templates cover all six equipment types in the mock dataset (Laptop, Monitor, Headset,
Keyboard, Mouse, Docking Station) across all three conditions. An `assertNever` exhaustiveness
check ensures a compile-time error if a new `ReturnCondition` value is added without updating
the switch. Unknown equipment types fall back to a generic template.

The function signature is the extension seam for a real LLM call. Replacing the template body
with an `anthropic.messages.create(...)` call requires changes only inside `suggest-note.ts`
— no Angular code, no store, no component is aware of the implementation.

### Condition diff badge

`ConditionDiffBadgeComponent` renders inline on any Returned item whose `returnCondition`
differs from `assignedCondition`. It shows `"Was: Good → Now: Damaged"`. PrimeNG `<p-tag>`
receives `severity="warn"` when `isConditionWorse(assigned, returned)` is true; no severity
attribute when the condition improved. An `@if (hasDiff())` guard means no empty placeholder
is rendered when conditions match — the component is invisible, not just empty.

---

## Testing strategy

| Scope | Tool | Tests | What is covered |
|---|---|---|---|
| Domain pure functions | Vitest | 54 | All 9 condition pairs for `isConditionWorse`; `canComplete` boundary cases (empty array, all pending, partial notes, all clear); `hasOpenIssues`; `suggestNote` × 18 type/condition combinations including the fallback path; state machine transition guards |
| Data access | Vitest | 11 | Repository returns correct employees and items; empty-equipment employee returns `[]`; completed employee has correct `offboardingStatus` |
| Feature + UI components | Vitest + Angular Testing Library | ~40 | `EmployeeListPageComponent` list render and Completed badge; `OffboardingSessionPageComponent` state-machine transitions end-to-end (Pending → Returned → Pending, Pending → Issue); `SummaryPanelComponent` button disabled/enabled and completed banner; `ConditionDiffBadgeComponent` renders on diff, hidden on match, `warn` severity on downgrade |

Domain functions carry all the business risk (state machine rules, completion predicate,
condition downgrade logic), so they get exhaustive unit tests where input/output is the
complete contract. Component integration tests use Angular Testing Library against the real
DOM — `getByRole`, `queryByRole` — so they test observable behaviour, not implementation
details, and survive refactors. Mocking is limited to the repository boundary; the store is
exercised with real domain logic in integration tests.

---

## What's next

**LLM integration for note suggestion.** `suggestNote` is already the extension seam:
replace the template lookup with `await anthropic.messages.create(...)`, add a loading state
to `NoteFieldComponent`, and the rest of the stack is unchanged. No other file needs
touching.

**Persistent storage.** Swap `InMemoryOffboardingRepository` for an `HttpOffboardingRepository`
that implements the same `IOffboardingRepository` port. The store, the components, and the
domain layer are untouched — they depend on the port interface, not the class.

**End-to-end tests.** A Playwright suite covering the complete offboarding flow (select
employee → return all items → complete → read-only) and the navigation guard (dirty warning
on mid-flow navigation) would give regression confidence over the wiring that unit tests
cannot reach.

---

## AI tooling note

Claude was used as the engineering agent throughout via the Claude Code CLI. It authored
the discovery session, ADRs, spec, and application code through structured prompting with a
human operator reviewing every checkpoint before committing.

Human-owned decisions: which bonus features to build, the `Returned → Pending` undo
rationale (surfaced from IT-admin domain analysis), the choice of plain signals over NgRx,
and the final wording of every ADR. The operator course-corrected the agent on `isDirty`
semantics — the initial draft tracked all uncommitted session changes, which would have
triggered false navigation warnings on normal Pending items; the corrected version tracks
only open in-progress form edits.

Every generated code increment was passed through an independent code-review sub-agent pass
against the assessment rubric before merging. No generated code was committed without that
step.

---

## Repository layout

```
apps/ libs/      the Angular application (the deliverable)
docs/            spec, discovery notes, ADRs (0001–0004), rubric map
.claude/ agent/  the AI agent layer that drove the build — separated from the app
.devcontainer/   reproducible Node 24 dev environment
```
