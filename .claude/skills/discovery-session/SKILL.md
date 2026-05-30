---
name: discovery-session
description: >
  Run a structured discovery session with the operator to resolve ambiguous offboarding flows
  BEFORE writing the spec. USE this first at project start, and again whenever a flow question
  surfaces mid-build. Resolves the "what should happen here?" questions, decides the one bonus
  feature, and records confirmed decisions + assumptions in docs/discovery.md. Do not let
  spec-authoring start until the key flow questions are answered.
---

# Discovery session

The task spec is deliberately under-specified. Resolving that ambiguity *with the operator*,
up front, is a seniority signal in itself — and it prevents building the wrong thing. Spawn
`it-admin-domain-expert` to bring the real user's voice.

## Procedure

1. Read `agent/memory/active-context.md` — it seeds the open questions. Add any you spot.
2. Work through questions **one at a time**. For each: propose a sensible default *grounded in
   IT-admin reality*, label it explicitly as an **assumption**, give the trade-off, and ask
   the operator to confirm or override. You may be wrong — say so, invite correction.
3. Decide the **one bonus feature** here (use `rubric-alignment` for the effort-vs-signal
   matrix; default recommendation: AI-assisted note, with condition-diff as a cheap second).
4. Capture results in `docs/discovery.md` as a decision log (format below).
5. Anything that *interprets the task spec* → flag for an **ADR** (use the `adr` skill).

## Question bank (the hard ones)

- Is **"Issue reported" terminal**, or resolvable later (issue → returned)?
- What exactly is **"all items actioned"** — does an Issue count as actioned for completion?
- **Complete with open issues?** (IT-admin reality says yes, if acknowledged — confirm.)
- **Condition worse than assigned** on return — silent, or require confirmation?
- **Re-selecting an employee** mid-flow — preserve or reset progress? Undo a mark?
- List **empty / loading / error** states.
- Single employee at a time vs. a queue.

## docs/discovery.md entry format

```
### Q: <question>
- Decision: <what we'll do>
- Rationale: <why, from the admin's reality>
- Status: confirmed by operator | assumption (to verify)
- ADR: ADR-00XX (if it interprets the spec) | n/a
```

## Gate

Do **not** proceed to `spec-authoring` until the completion rule, the meaning of "actioned",
and the issue-state question are resolved (confirmed or explicitly assumed). Checkpoint after
discovery (`checkpoint` skill).
