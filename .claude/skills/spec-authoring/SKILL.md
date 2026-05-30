---
name: spec-authoring
description: >
  Author docs/spec.md from the confirmed discovery. USE after discovery and before
  architecture/coding. Translates agreed flows into precise functional requirements with
  acceptance criteria, defines the equipment status state-machine and the completion rule,
  and records every spec interpretation as an ADR. Keep it crisp — a spec a reviewer can read
  in three minutes.
---

# Spec authoring

Turn the discovery decisions into a precise, testable spec. The acceptance criteria here
become the basis for tests and for the `code-reviewer`'s UX checks.

## docs/spec.md structure

1. **Goal & scope** — one paragraph; what's in, what's explicitly out (non-goals).
2. **Data model** — the shape we consume (employees → equipment), and the *derived* status we
   add (`Pending | Returned | Issue`) plus return condition (`Good | Damaged | Missing
   accessories`) and issue note. Reference the mock dataset.
3. **Status state-machine** — the legal transitions, drawn in text. The single source of
   truth for both UI and tests. Define it in the domain layer.
4. **User flows** with **acceptance criteria** (Given/When/Then), each tied back to a
   discovery decision:
   - Select employee → load assigned equipment (incl. empty/error states).
   - Mark returned (with condition) / report issue (with note).
   - Summary panel counts (pending/returned/issue).
   - **Completion rule** — the exact predicate that enables "Complete offboarding".
   - Confirmation state on completion.
5. **The chosen bonus** — its acceptance criteria.
6. **Quality bars** — strict TS, a11y, responsiveness, performance posture.
7. **Assumptions** — every unconfirmed decision, each pointing to its ADR.

## Rules

- Be precise about the **completion predicate** — it's the most testable, most easily-wrong
  rule. State it as a boolean over item states.
- Every interpretation of the task → `adr` skill; link it inline.
- Have `it-admin-domain-expert` sanity-check the flows and `solution-architect` confirm
  feasibility before moving to architecture/backlog.

## Gate

Spec signed off → proceed to architecture ADR, then `backlog-planning`. Checkpoint.
