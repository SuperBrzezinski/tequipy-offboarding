---
name: backlog-planning
description: >
  Shape milestones and epics in agent/memory/backlog.md after spec + architecture are agreed.
  USE to plan the build at EPIC granularity only — vertical, shippable slices sequenced by
  risk and value under the 2–6h time box. Do NOT break epics into tasks here; that happens
  just-in-time via task-breakdown when an epic is actually picked up.
---

# Backlog planning

Plan in epics, not tasks. Detailed task plans written up front rot before they're used; we
defer that detail until the last responsible moment.

## Procedure

1. Read the spec and architecture ADR.
2. Express the work as **vertical slices** — each epic delivers something demoable end to end
   (UI + state + domain), not a horizontal layer. A reviewer should be able to *see* progress
   after each epic.
3. Sequence by **risk × value** within the time box: de-risk the completion-rule + state
   machine early (they're the core), defer polish and the bonus to last.
4. For each epic note a one-line **"epic done" definition** (what's demoable).
5. Write to `agent/memory/backlog.md` under the right milestone. Keep it living — re-order as
   facts change (and record material re-scopes as ADRs).

## Suggested epic shape for this task

- **Setup** (devex-engineer): workspace, libs-per-layer, lint boundaries, hooks, CI.
- **Domain core**: status state-machine + models + the completion predicate (pure, tested).
- **Equipment & employee data**: in-memory repo + employee selection loads equipment.
- **Return actions**: mark-returned (condition) + report-issue (note), wired to the store.
- **Summary & completion**: counts + guarded Complete + confirmation state.
- **Bonus + polish**: the one chosen bonus, a11y/responsive pass, README + tests round-out.

## Anti-pattern

Do not enumerate tasks for epics you aren't about to build. Leave them as one-liners.

## Gate

Backlog agreed → pick the first epic → `task-breakdown`. Checkpoint.
