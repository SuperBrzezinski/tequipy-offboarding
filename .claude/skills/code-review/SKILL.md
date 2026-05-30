---
name: code-review
description: >
  Run an independent code review of the current diff before every checkpoint. USE after each
  implementation increment, with no exceptions. Spawns the read-only code-reviewer sub-agent
  fresh (genuine outside eyes), scores against the Tequipy rubric, routes fixes back to
  frontend-engineer, and only then allows the checkpoint. The implementer never approves its
  own work.
---

# Code review (independent)

Review is a separate step performed by a fresh agent, not a glance by the author. This is
both good practice and a literal rubric item ("AI tooling: what to review, what to own").

## Procedure

1. Gather the diff for the increment (`git diff` / changed files for the task).
2. Spawn the `code-reviewer` sub-agent **fresh** (do not reuse the implementer's context).
   Hand it the diff scope and the relevant spec/acceptance criteria.
3. It runs the gates itself (`pnpm nx lint`, `pnpm nx test`), reads against the architecture
   and playbooks, and returns findings tagged **[blocker] / [should] / [nit]** with file:line
   + a concrete suggestion, ending in a verdict (APPROVE / APPROVE-WITH-NITS /
   CHANGES-REQUESTED) and a quick rubric read.
4. Route **[blocker]** and agreed **[should]** items back to `frontend-engineer`; apply fixes;
   re-review if a blocker was found. Nits are operator's call under the time box.
5. Only on a passing verdict → proceed to `checkpoint`.

## Rules

- The reviewer is **read-only** — it reports, it doesn't fix. Fixes flow through the
  implementer, keeping the review honest.
- Keep it proportionate to a 2–6h take-home: flag real risk and rubric gaps, don't gold-plate.
- Record any decision that emerges from review (e.g. a layering fix) as an ADR if it changes
  direction.
