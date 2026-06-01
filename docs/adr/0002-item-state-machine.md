# ADR-0002 — Item status state machine and completion predicate

- **Status:** Accepted
- **Date:** 2026-05-30
- **Deciders:** orchestrator + it-admin-domain-expert + operator
- **Mode:** dev
- **Tags:** ux, architecture, domain

## Context

The task spec says "Complete offboarding when all items are actioned" but leaves three
ambiguities:

1. Is `Issue` a terminal state, or can an issued item later be marked as Returned?
2. What exactly does "actioned" mean for an Issue item — does a blank flag count?
3. Can the offboarding be completed if Issues remain unresolved — hard block or soft confirm?

These decisions directly determine the domain type shape, the state machine, the completion
predicate, and every guard in the UI. Getting them wrong silently is the most testable-wrong
thing in the whole spec.

## Decision

**State machine:** `Pending → Returned`, `Pending → Issue`, `Issue → Returned`,
`Returned → Pending` (undo). Neither `Returned` nor `Issue` is fully terminal: `Returned`
can be undone back to `Pending`; `Issue` can be resolved to `Returned`.

**Completion predicate:**
```
canComplete = (items) =>
  items.length > 0
  && items.every(i => i.status !== 'Pending')
  && items.filter(i => i.status === 'Issue').every(i => i.note.trim() !== '')
```

**Completion with open Issues:** allowed via a soft-confirm dialog listing the **names** of
the open-issue items (not just a count). No hard block.

## Rationale

**Issue → Returned allowed:** IT admins routinely recover items after the initial flag (item
arrives by post, found later). Blocking that transition creates data loss. A write-off path
is still available — an Issue with a note explicitly recording it as unrecoverable fully
satisfies the predicate and therefore allows completion.

**Returned → Pending undo:** A mis-click when marking an item Returned (wrong condition,
wrong item) previously created an irrecoverable chargeback record against the employee.
The undo gesture reverts to Pending and forces explicit re-processing — creating a fresh
audit record rather than silently patching the wrong one. No confirmation is needed for undo
because the re-processing step provides the confirmation implicitly.

**Non-empty note required for Issue:** A blank flag is not an audit trail. Finance and HR
need at minimum a one-line record ("laptop confirmed stolen, ticket #4421") to justify the
write-off. Requiring a note is the minimum accountability bar without being onerous.

**Soft confirm, not hard block:** HR and payroll cannot be suspended indefinitely waiting for
an unrecovered asset. A soft confirm surfaces the risk (lists the issue count), creates an
explicit acknowledgment record, and preserves admin agency. Hard blocks punish the process
rather than the problem.

## Consequences

- **Positive:** Completion rule is a pure function — trivially unit-testable. Audit trail is
  always present on Issues. Undo prevents irrecoverable chargebacks from mis-clicks.
- **Negative / cost:** Four transitions instead of two increases the state-machine test
  surface. The completion dialog now renders item names (requires joining items to Issues).
- **Follow-ups:** Define condition severity order (Good > Missing accessories > Damaged) for
  the condition-downgrade confirmation (Q4 — inline UX decision, no additional ADR needed).

## Alternatives considered

- **Hybrid state: Returned + Issue note simultaneously:** An admin might want to record "returned as damaged" AND add a free-text issue note. Rejected because the `returnCondition` field (`Damaged / Missing accessories`) already captures this signal; "Returned + condition = Damaged" is the correct encoding for a physical return with problems. `Issue` is semantically reserved for cases where physical return is absent or uncertain (device lost, employee refuses). Combining states would duplicate the condition-diff feature and complicate the predicate without adding information. See discovery Q8.


- **Issue is terminal (no resolution):** Simpler state machine, but real admins would need
  to abuse the system (re-create a record) to close a recovered item. Ruled out.
- **Hard block on open Issues:** Prevents legitimate completions when an asset is
  unrecoverable. HR SLAs override asset recovery timelines. Ruled out.
- **Allow blank-note Issues to satisfy predicate:** Gives admin a "fast escape" but creates
  zero-value audit records that fail finance/HR review. Ruled out.
- **Returned is terminal (no undo), rely on soft-confirm:** Soft-confirm on condition
  downgrade only fires when condition is *worse* — it does not catch wrong-item selection or
  wrong-condition selection when not a downgrade. One irrecoverable compliance record is too
  high a cost. Ruled out.

## README line

> Equipment items follow a `Pending → Returned ↔ Pending / Pending → Issue → Returned` state machine (Returned is undoable); offboarding completes when all items leave Pending and every Issue has a recorded note — soft-confirm dialog listing open-issue item names if any remain.
