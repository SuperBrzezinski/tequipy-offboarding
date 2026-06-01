# Discovery log — Equipment Return offboarding SPA

Date: 2026-05-30  
Participants: operator + it-admin-domain-expert (agent) + orchestrator

All decisions below are either **confirmed by operator** or explicitly marked as **assumption**.

---

### Q1: Is "Issue" a terminal state, or resolvable later?

- **Decision:** Issue is NOT terminal. An item in Issue state can later be marked as Returned (Issue → Returned). The only "final write-off" path is an Issue with a note explicitly acknowledging it as unrecoverable.
- **Rationale:** IT admins regularly see items surface after offboarding (returned by post, found in shipping). Blocking re-resolution creates real data loss risk.
- **Status:** confirmed by operator
- **ADR:** ADR-0002 (item state machine)

---

### Q2: What exactly does "all items actioned" mean?

- **Decision:** Actioned = item has left Pending state. Completion rule: **no item in Pending** AND **every item in Issue state has a non-empty note**. An Issue without a note does NOT count as actioned.
- **Rationale:** A blank Issue flag tells you nothing. A note ("laptop confirmed stolen, ticket #4421") creates a defensible audit trail for finance/HR. Requiring a note is the minimum viable accountability record.
- **Status:** confirmed by operator
- **ADR:** ADR-0002 (item state machine)

---

### Q3: Can offboarding be completed with open, unresolved Issue items?

- **Decision:** Yes — offboarding CAN be completed when all items are actioned (Q2 rule), even if some remain in Issue state. Completion uses a **soft confirm**: if any Issues are open, the "Complete" button triggers a dialog listing the open-issue count and requiring explicit acknowledgment ("Complete with 2 open issues"). No hard block.
- **Rationale:** HR/payroll processes cannot be held hostage to an unrecovered laptop indefinitely. Acknowledging the issue count creates the audit trail; blocking prevents legitimate completions.
- **Status:** confirmed by operator
- **ADR:** ADR-0002 (item state machine)

---

### Q4: Should returning a device in worse condition than assigned require confirmation?

- **Decision:** Yes — **soft confirmation** when the recorded return condition is worse than the assigned condition (e.g. assigned Good, returned Damaged). Dialog: "This item was assigned as Good. You are recording it as Damaged. Continue?" Admin confirms actively; no hard block.
- **Rationale:** Condition mismatch is a potential chargeback against the employee's final settlement. Silent field change leaves no record that anyone noticed. Soft confirm creates an audit trail without blocking the flow.
- **Status:** confirmed by operator
- **ADR:** n/a (UX decision, not spec interpretation)

---

### Q5: Re-selecting an employee mid-flow — preserve or reset progress?

- **Decision:** **Per-employee state persists within the browser session** (in-memory signal store, keyed by employeeId). Navigating to employee B and back to employee A restores A's in-progress state. If admin attempts to navigate away from an employee with unsaved/uncommitted changes, an **unsaved changes warning** is shown.
- **Rationale:** Admins regularly jump between employees mid-flow (Slack interrupts, item arrivals). A reset-on-navigate approach causes real data loss. In-memory persistence is the correct scope for a frontend-only SPA.
- **Status:** confirmed by operator
- **ADR:** n/a (implementation detail, not spec interpretation)

---

### Q6: Required empty / loading / error states

- **Decision:** The UI must handle all four states:
  1. **Loading** — while employee list or equipment list is fetching
  2. **Empty — no equipment** — employee has no items assigned; explicit message, not a blank list
  3. **Error — load failure** — API/data unavailable; message + retry option, not a white screen
  4. **Completed — read-only** — offboarding already closed; view is read-only, no active actions
- **Status:** confirmed by operator
- **ADR:** n/a

---

### Q7: Bonus feature selection

- **Decision:**
  - **Primary bonus:** AI-assisted note — a "Suggest note" button when marking an item as Issue; generates a pre-filled description based on device type and condition. Implementation: local template engine (no LLM API required for core; LLM call as stretch if time allows).
  - **Secondary bonus:** Condition diff — visually highlight when return condition differs from assignment condition (e.g. a badge/chip showing "Was: Good → Now: Damaged").
  - Keyboard navigation and Optimistic UI are explicitly out of scope.
- **Rationale:** AI-assisted note is the highest-signal bonus for reviewers (demonstrates AI integration awareness + real-world utility — admins skip notes when they're high-friction). Condition diff is low-effort, high-UX-quality, and naturally embedded in the return flow.
- **Status:** confirmed by operator
- **ADR:** ADR-0003 (bonus feature rationale)

---

## Summary — completion rule (the single most important decision)

> Offboarding is completable when:
> 1. Zero items in Pending state
> 2. Every item in Issue state has a non-empty note
>
> If any Issues are open → soft confirm dialog with count. Otherwise → complete immediately.

---

### Q8: Should "Returned" and "Issue" be combinable states (e.g. "returned but damaged with a note")?

- **Decision:** No — `Returned` and `Issue` remain **mutually exclusive** terminal states. The condition field on return (`Good / Damaged / Missing accessories`) is the mechanism for flagging problems at physical return. `Issue` is reserved for cases where physical return is absent or uncertain.
- **Rationale:** The spec's status model `Pending | Returned | Issue reported` explicitly reads as three discrete states. More importantly, "Returned + Damaged" is already fully expressed by `status = Returned, returnCondition = Damaged`. Adding a free-text issue note on top of a Returned item would duplicate the condition diff feature, complicate the state machine, and go beyond what was asked. The condition field IS the issue signal for physical returns.
- **Assumption:** "Issue reported" semantically means something blocked or prevented the return (employee refuses, device lost, not found) — NOT "item came back in bad shape". Condition-on-return handles the latter.
- **Status:** assumption — confirmed by operator 2026-06-01
- **ADR:** noted in ADR-0002 (alternatives considered)

---

## Items flagged for ADRs

| ADR | Topic |
|-----|-------|
| ADR-0002 | Item state machine (Pending → Returned / Issue → Returned, completion rule) |
| ADR-0003 | Bonus feature choice (AI note + condition diff over keyboard nav / optimistic UI) |
