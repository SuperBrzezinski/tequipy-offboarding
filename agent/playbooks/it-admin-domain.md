# Playbook — IT-admin domain (offboarding reality)

Consulted by `it-admin-domain-expert` and `solution-architect`. This is the lived reality the
"UX judgement" rubric rewards. The agent should reason from this, then confirm with the
operator (assume you might be wrong).

## How equipment return actually goes

- Offboarding is frequently **partial and time-pressured**. The person may have already left;
  some gear ships back later; an item is "in a box somewhere". The tool must let the admin
  record reality, not force a clean ending.
- The point of the tool is **accountability and audit**: every assigned item ends in a known,
  recorded state, with a *reason* when it's not a clean return. An issue note is a record.
- **"Done" = everything accounted for**, not everything perfect. Each item is either returned
  (with a condition) or flagged with an explanation. That distinction *is* the completion rule.

## The status model (proposed — confirm in discovery)

```
Pending ──mark returned(condition)──► Returned
Pending ──report issue(note)───────► Issue
```

Open questions to settle (seeded in `active-context.md`):

- **Is Issue terminal?** Reality: an issue often resolves later (item turns up). A senior UX
  lets you move Issue → Returned. Default assumption: Issue is **resolvable**, not a dead end —
  but confirm; the spec doesn't say.
- **Does Issue count as "actioned" for completion?** Default: **yes** — an acknowledged issue
  is an accounted-for item; you can complete with open issues *that were explicitly recorded*.
  Confirm.
- **Worse-than-assigned condition** (assigned Good, returned Damaged): real billing/chargeback
  trigger. Surface it (condition-diff), and consider a soft confirm. Don't bury it.
- **Re-selecting an employee** mid-flow: don't silently lose progress. Either persist per
  employee or warn. Confirm.
- **Empty / loading / error** states for the equipment list — handle them; an admin facing a
  blank screen assumes the tool is broken.

## Edge cases that signal seniority (handle gracefully)

Missing accessory but device fine · device not returned at all (employee gone) · duplicate /
already-returned item · condition mismatch · completing with one item still pending (blocked,
with a clear reason why the button is disabled).

## Anti-patterns

A flow that only works on the happy path · a Complete button that's enabled too early or
disabled with no explanation · destructive actions with no confirm/undo · losing recorded
notes on navigation.
