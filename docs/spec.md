# Spec — Equipment Return Offboarding SPA

**Version:** 1.1  
**Date:** 2026-05-30  
**Status:** Accepted — signed off by it-admin-domain-expert + solution-architect

**Changelog v1.1:** Added `Returned → Pending` undo transition (IT admin BLOCKER); clarified
"unsaved changes" trigger; completion dialog now lists item names; `ReturnItem` is composition
not extension; added `isDirty`, `completedAt` to `EmployeeSession`; added `conditionSeverity`
typed constant; updated ADR-0002.

---

## 1. Goal & scope

Build a single-page Angular application that lets an IT administrator process the equipment
return step of an employee offboarding workflow. The admin selects an employee, reviews their
assigned equipment, marks each item as Returned (with condition) or Issue (with a note), and
completes the offboarding session.

**In scope:**
- Employee list + selection
- Equipment list with per-item return workflow (status, condition, note, undo)
- Summary panel (live counts: pending / returned / issue)
- Completion flow with guarded "Complete offboarding" action
- Per-employee in-session state persistence (in-memory, no backend)
- All edge states: loading, empty, error, completed-read-only
- Bonus: AI-assisted note suggestion + condition diff visual

**Out of scope:**
- Backend / real API (in-memory mock data only)
- Authentication / authorization
- Multi-step offboarding beyond equipment return
- Keyboard navigation optimization
- Optimistic UI / offline mode
- Persistent storage (localStorage, server)

---

## 2. Data model

### 2.1 Source data (mock)

The application ships an in-memory dataset. Shape consumed from the data-access layer:

```typescript
type ReturnCondition = 'Good' | 'Damaged' | 'Missing accessories';

// Severity: higher number = worse condition. Used for downgrade detection.
const CONDITION_SEVERITY: Record<ReturnCondition, number> = {
  'Good': 2,
  'Missing accessories': 1,
  'Damaged': 0,
};

function isConditionWorse(assigned: ReturnCondition, returned: ReturnCondition): boolean {
  return CONDITION_SEVERITY[returned] < CONDITION_SEVERITY[assigned];
}

interface Employee {
  id: string;
  name: string;
  department: string;
  email: string;
  offboardingDate: string; // ISO 8601 date, e.g. '2026-06-15'
}

interface AssignedItem {
  id: string;
  employeeId: string;
  name: string;         // e.g. 'MacBook Pro 14"'
  type: string;         // e.g. 'Laptop', 'Monitor', 'Headset'
  serialNumber?: string;
  assignedCondition: ReturnCondition; // condition when originally assigned
}
```

Mock dataset: ≥ 5 employees; ≥ 2 items each; at least one employee with no equipment
assigned (exercises the empty state); at least one employee pre-marked as offboarding
complete (exercises the read-only state).

### 2.2 Derived session state

The application adds the following fields during a session (never persisted to storage):

```typescript
type ItemStatus = 'Pending' | 'Returned' | 'Issue';

// Composition — does NOT extend AssignedItem to avoid crossing the data-access boundary.
interface ReturnItem {
  item: AssignedItem;              // source record, immutable
  status: ItemStatus;              // starts as 'Pending'
  returnCondition?: ReturnCondition; // set when status = 'Returned'
  note: string;                    // required non-empty when status = 'Issue'
}

type OffboardingStatus = 'In progress' | 'Completed';

interface EmployeeSession {
  employeeId: string;
  items: ReturnItem[];
  offboardingStatus: OffboardingStatus;
  completedAt: string | null;      // ISO 8601 timestamp; null until offboarding completes
  isDirty: boolean;                // true when any item has an in-progress edit (open note
                                   // field or open condition dropdown) — drives nav guard
}
```

**`isDirty` is a `computed` signal in the application-layer store**, not a local component
boolean. This makes it accessible to the navigation guard without rendering a component.

### 2.3 Completion predicate

Defined once in the domain layer, referenced everywhere else:

```typescript
function canComplete(items: ReturnItem[]): boolean {
  if (items.length === 0) return false;
  const noPending = items.every(i => i.status !== 'Pending');
  const allIssuesNoted = items
    .filter(i => i.status === 'Issue')
    .every(i => i.note.trim().length > 0);
  return noPending && allIssuesNoted;
}

function hasOpenIssues(items: ReturnItem[]): boolean {
  return items.some(i => i.status === 'Issue');
}
```

---

## 3. Status state machine

Legal transitions (→ = allowed):

```
  [start] → Pending ──────────→ Returned
                │                   │
                │     undo return    │
                │   ←────────────────┘
                │
                └──────────→ Issue ──→ Returned
```

| From     | To       | Trigger                                      | Guard                               |
|----------|----------|----------------------------------------------|-------------------------------------|
| Pending  | Returned | Admin selects "Mark as returned"             | `returnCondition` must be set       |
| Pending  | Issue    | Admin selects "Report issue"                 | `note` must be non-empty on confirm |
| Issue    | Returned | Admin selects "Mark as returned" on issue    | `returnCondition` must be set       |
| Returned | Pending  | Admin clicks "Undo return" on Returned item  | None — always allowed               |

**`Returned → Pending` undo:** Low-prominence gesture (small icon/button). Resets
`returnCondition` and `note` to their defaults. Does not require confirmation — the admin
must re-process the item from Pending, creating a fresh explicit record. See ADR-0002.

---

## 4. User flows & acceptance criteria

### Flow A: Select employee

**Given** the app is loaded  
**When** the employee list renders  
**Then** every employee is shown with name, department, and offboarding date  
**And** employees with `offboardingStatus = Completed` are visually distinguished (e.g. a
"Completed" badge)

**Given** admin clicks an employee  
**When** the equipment list loads  
**Then** the item list for that employee is shown with each item's name, type, serial number
(if present), assigned condition, and current status (Pending on first visit)

**Given** admin navigates to employee B while employee A has in-progress changes  
**When** admin returns to employee A  
**Then** A's item states are restored exactly as left

**Given** `session.isDirty === true` for the current employee  
*(i.e. at least one item has an open note field or an open condition dropdown — an edit that
has not yet been confirmed or cancelled)*  
**When** admin clicks a different employee in the list  
**Then** an unsaved-changes warning is shown: "You have an unsaved edit. Leave and discard?"  
**And** if admin confirms: the in-progress edit is discarded and the new employee is loaded  
**And** if admin cancels: they remain on the current employee with the edit intact  
**Note:** A `session.isDirty = false` employee with Pending items does NOT trigger this
warning — in-progress actions already committed to session state are not "unsaved".

### Flow B: Mark item as Returned

**Given** an item is in `Pending` or `Issue` state  
**When** admin selects a return condition (Good / Damaged / Missing accessories) and confirms  
**Then** the item `status` changes to `Returned` and `returnCondition` is recorded  
**And** the summary panel updates immediately

**Given** `isConditionWorse(item.assignedCondition, selectedCondition) === true`  
**When** admin attempts to confirm the return  
**Then** a soft-confirm dialog appears:  
*"[Item name] was assigned as [Good]. You are recording it as [Damaged]. Continue?"*  
**And** only upon explicit confirmation does the status change  
*(Confirmed in discovery — Q4)*

### Flow C: Undo return

**Given** an item is in `Returned` state  
**When** admin clicks "Undo return"  
**Then** the item status reverts to `Pending`, and `returnCondition` is cleared  
**And** no confirmation is required — admin must re-process the item from Pending  
**And** the summary panel updates immediately

### Flow D: Report issue

**Given** an item is in `Pending` state  
**When** admin selects "Report issue"  
**Then** a note field appears for that item (`isDirty` becomes `true`)

**Given** the note field is open and admin has entered a non-empty note  
**When** admin clicks "Confirm issue"  
**Then** item status changes to `Issue`; note is persisted; `isDirty` returns to `false`

**Given** the note field is open and the note is empty  
**Then** "Confirm issue" is disabled

**Given** the note field is open  
**When** admin clicks "Cancel"  
**Then** the note field closes with no status change; `isDirty` returns to `false`

### Flow E: Summary panel

**Given** any item state changes  
**When** the summary panel is visible  
**Then** it shows live counts: Pending (#), Returned (#), Issue (#)  
**And** counts update without page refresh

### Flow F: Complete offboarding

**Given** `canComplete(items) === true` AND `hasOpenIssues(items) === false`  
**When** admin clicks "Complete offboarding"  
**Then** the offboarding completes immediately  
**And** `completedAt` is set to the current ISO timestamp  
**And** the view switches to completed / read-only state

**Given** `canComplete(items) === true` AND `hasOpenIssues(items) === true`  
**When** admin clicks "Complete offboarding"  
**Then** a soft-confirm dialog appears listing **the names of the open-issue items**:  
*"Complete offboarding with [N] unresolved issue(s)?*  
*• MacBook Pro 14" — screen damage*  
*• USB-C Dock — missing power cable*  
*This action cannot be undone."*  
**And** only upon explicit confirmation does the status change to Completed  
*(Confirmed in discovery — Q3)*

**Given** `canComplete(items) === false`  
**When** the UI renders  
**Then** "Complete offboarding" is disabled with a visible reason (e.g. "2 items still
pending")

**Given** `offboardingStatus === 'Completed'`  
**When** the employee's equipment list is shown  
**Then** the view is read-only — no action buttons, only status labels  
**And** the completion timestamp (`completedAt`) is displayed  
*(Confirmed in discovery — Q6)*

### Flow G: Edge states

| State | Trigger | Expected UI |
|-------|---------|-------------|
| Loading | Equipment fetch in progress | Skeleton / spinner; no content flicker |
| Empty — no equipment | `items.length === 0` | Explicit message: "No equipment assigned to this employee" |
| Error — load failure | Mock throws | Error message + "Retry" button |
| Completed — read-only | `offboardingStatus === 'Completed'` | Read-only labels; `completedAt` timestamp shown |

---

## 5. Bonus features

### 5.1 AI-assisted note (primary bonus)

**Trigger:** Visible on the issue-note field when an item is in issue-entry mode.  
**Button label:** "Suggest note"

**Given** admin is entering a note for an item in Issue state  
**When** admin clicks "Suggest note"  
**Then** a pre-filled note is inserted into the note field, based on `item.type` and
`item.item.assignedCondition`  
**And** the admin can freely edit the suggestion before confirming

**Implementation:** `suggestNote(type: string, assignedCondition: ReturnCondition) → string`
— a pure function in the domain layer. Templates cover all `type × condition` combinations
in the mock dataset. No external LLM call for core; LLM (Claude API) is an explicit
extension point documented in "What's next" in the README.

*Rationale: see ADR-0003.*

### 5.2 Condition diff visual (secondary bonus)

**Given** an item has `returnCondition` set and `returnCondition !== item.item.assignedCondition`  
**When** the item row is rendered  
**Then** a badge/chip shows: "Was: [assignedCondition] → Now: [returnCondition]"  
**And** the badge uses a warning-level colour token when `isConditionWorse(...)` is true

---

## 6. Quality bars

| Bar | Requirement |
|-----|-------------|
| **TypeScript** | Strict mode (`strict: true`). No `any`. `ItemStatus` and `ReturnCondition` are string unions with `assertNever` exhaustiveness checks. `CONDITION_SEVERITY` is a typed `Record`. |
| **Accessibility** | WCAG 2.1 AA. Status is never communicated by colour alone. Interactive elements have accessible labels. Focus moves to dialog on open; returns to trigger on close. |
| **Responsiveness** | Usable on screens ≥ 768 px wide. Layout adapts (two-column → stacked). |
| **Performance** | OnPush change detection everywhere. Zoneless Angular. `computed` signals for all derived state. |
| **Testing** | `canComplete`, `hasOpenIssues`, `isConditionWorse`, `suggestNote` have unit tests. State machine transitions have unit tests. At least one component integration test (equipment list). Tests explain the "why". |
| **Code clarity** | ESLint + Prettier clean. `@nx/enforce-module-boundaries` enforced. Components have single responsibilities and clear names. |

---

## 7. Assumptions & ADR links

| # | Assumption | ADR / source |
|---|-----------|------|
| A1 | Item state is held in-memory per session. Page refresh resets state. No localStorage. | Confirmed by operator (Q5). |
| A2 | `Issue → Returned` is legal. `Returned → Pending` undo is also legal (new in v1.1). | [ADR-0002](adr/0002-item-state-machine.md) |
| A3 | Completion rule: zero Pending AND all Issues have non-empty notes. | [ADR-0002](adr/0002-item-state-machine.md) |
| A4 | Completion with open Issues requires soft confirm listing item names. Not a hard block. | [ADR-0002](adr/0002-item-state-machine.md) |
| A5 | AI note is a local template engine; LLM is a named extension point, not core. | [ADR-0003](adr/0003-bonus-feature.md) |
| A6 | Condition severity: `Good (2) > Missing accessories (1) > Damaged (0)`. Encoded as `CONDITION_SEVERITY` constant in domain layer. | Inline decision. |
| A7 | `isDirty` tracks only uncommitted in-progress edits (open form), not session-level changes. | IT admin review finding. |
| A8 | The mock dataset is the only data source. No network calls. | Confirmed scope. |
