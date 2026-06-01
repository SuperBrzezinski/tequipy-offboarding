# Employee Equipment Offboarding — Tequipy take-home

An SPA for IT administrators to manage the equipment return step of an employee offboarding
workflow. Submitted as the Tequipy Founding Frontend Engineer take-home assessment.

> Stack: **Angular 21 · Nx 22 · PrimeNG 21 · Tailwind v4 · TypeScript strict · Vitest · Angular Testing Library**

---

## Quick start

**Environment (pick one):**
- **Dev Container (recommended)** — open the repo in VS Code and choose *Reopen in Container*
  (or **Dev Containers: Reopen in Container** from the Command Palette). Node 24, pnpm, and
  all VS Code extensions are provisioned automatically.
- **Local** — ensure Node 24 and pnpm are installed manually.

Then run:

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
- **Session persistence** — item statuses and completion state are held in
  `InMemoryOffboardingRepository` for the browser session; navigating between employees and
  back preserves state exactly without a re-fetch.

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

`OffboardingStore` is a thin `@Injectable()` service that tracks only one piece of transient
UI state: which item form is currently open (`signal<EditingItem | null>`). All session state
— item statuses, offboarding completion — lives in `OffboardingSessionPageComponent` as
private `WritableSignal`s, populated from the repository via Angular's `resource()` API.
Derived state (`pendingCount`, `canComplete`, `isDirty`) is `computed` on the page component.
Swapping `InMemoryOffboardingRepository` for an HTTP client requires no changes to the store
or any component.

`OffboardingSessionPageComponent` is the only smart component; all others receive data via
signal `input()` and emit events via `output()`.

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
/                        → EmployeeListPageComponent
/offboarding/:employeeId → OffboardingSessionPageComponent  (canDeactivate guard)
**                       → redirect to /
```

The entire feature chunk is lazy-loaded via `loadChildren` in the shell router config.
`withComponentInputBinding()` is enabled in `app.config.ts`, so `employeeId` arrives as a
signal `input()` on the page component with no `inject(ActivatedRoute)` boilerplate. The Nx
boundary rule ensures no feature code leaks into the initial chunk.

---

## Key decisions (ADR summary)

| ADR | What was decided | Why |
|---|---|---|
| [0001 — Tech stack](docs/adr/0001-tech-stack.md) | Angular 21 (standalone, zoneless, signals) on Nx 22 with PrimeNG 21 and Vitest | Zoneless eliminates Zone.js patching overhead and removes `async`/`fakeAsync` ceremony from tests; signals give co-located reactivity without an external state library; Nx makes boundary enforcement mechanical |
| [0002 — State machine](docs/adr/0002-item-state-machine.md) | `Pending → Returned ↔ Pending` (undo) and `Pending → Issue`; completion requires zero Pending items and non-empty notes on all Issues; open Issues trigger a soft-confirm dialog | A mis-click creating an irrecoverable chargeback record is worse than allowing undo; blank-note Issues fail audit |
| [0003 — Bonus features](docs/adr/0003-bonus-feature.md) | AI-assisted note as a local template engine (`suggestNote`) + condition diff badge | The function signature is the extension seam for a real LLM call; the diff badge surfaces a real admin risk at near-zero cost |
| [0004 — Architecture](docs/adr/0004-architecture.md) *(superseded by 0006-lib-consolidation)* | Original flat four-library layout | — |
| [0005 — Employee list table](docs/adr/0005-employee-list-table-over-cards.md) | `p-table` with column sorting and filtering over a card list | Real admin environments have 50–200+ employees; sorting by offboarding date is a first-class need |
| [0005 — Repo as source of truth](docs/adr/0005-repo-as-source-of-truth.md) | Repository owns all mutable session state; `OffboardingStore` tracks UI-only edit mode | The store was acting as a backend substitute; splitting the concerns makes the repository boundary trivially swappable |
| [0006 — Library consolidation](docs/adr/0006-feature-library-consolidation.md) | Nested Nx sub-libraries (`offboarding-feature`, `domain`, `data-access`) instead of flat top-level libs; no separate `ui` lib | All four original libs belong to one feature — the flat layout communicated shared infrastructure that doesn't exist |

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

**Upgrading to a real LLM call.** The extension point is
`libs/offboarding-feature/domain/src/lib/suggest-note.ts`. The function signature is already
`async`-compatible:

```ts
// current: template lookup
export function suggestNote(type: string, condition: ReturnCondition): string { … }

// replacement: real LLM call (example using the Anthropic SDK)
export async function suggestNote(type: string, condition: ReturnCondition): Promise<string> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Write a one-sentence equipment return note for an IT admin.
                Equipment type: ${type}. Condition when assigned: ${condition}.
                Be concise and factual.`,
    }],
  });
  return (message.content[0] as TextBlock).text;
}
```

No Angular code, no store, and no component needs to change — they all depend on the function
signature, not the implementation. The `NoteFieldComponent` would need a loading state added
for the async path, which is the only UI change required.

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
| Data access | Vitest | 30 | Repository returns correct employees and items; empty-equipment employee returns `[]`; completed employee has correct `offboardingStatus`; all repository mutations (mark returned, mark issue, revert, complete); `OffboardingStore` open/cancel/confirm transitions |
| Feature + UI components | Vitest + Angular Testing Library | 53 | `EmployeeListPageComponent` list render and Completed badge; `OffboardingSessionPageComponent` state-machine transitions end-to-end (Pending → Returned → Pending, Pending → Issue); `SummaryPanelComponent` button disabled/enabled and completed banner; `ConditionDiffBadgeComponent` renders on diff, hidden on match, `warn` severity on downgrade; `EquipmentRowComponent` all row modes; `canDeactivateSession` guard |

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

The project was built with Claude Code CLI operating in a structured **DEV mode** workflow:
discovery → spec → architecture → per-epic task breakdown → implementation → code review →
checkpoint. Each phase was delegated to a specialist sub-agent — `solution-architect` for
ADRs and layering, `code-reviewer` for an independent assessment of every diff before
committing, `qa-test-engineer` for testing strategy, `ui-designer` for visual review, and
`it-admin-domain-expert` to pressure-test flows against real offboarding scenarios.

A parallel **META mode** let the agent refine its own skills and playbooks independently,
keeping agent mechanics (`CLAUDE.md`, `.claude/`, `agent/`) strictly separated from
application code. DEV work never touched the meta layer, and vice versa.

Every code increment passed through the code-review sub-agent before merging. No increment
was committed without that step.

