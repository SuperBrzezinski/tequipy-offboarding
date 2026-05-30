---
name: memory-manager
description: >
  Keep the agent's markdown memory healthy: persist current state, append progress, compress
  when a file grows bloated, and keep facts coherent (no duplication, no contradiction). USE
  at every checkpoint and whenever memory feels heavy or out of sync. Respects mode
  separation — in DEV it writes agent/memory/, in META it writes agent/meta/ (and may perform
  structural hygiene on agent/memory/).
---

# Memory manager

Memory is markdown on disk, not the context window. That's what makes a crash or a cleared
chat survivable. Keep it small, current, and truthful.

## The files (DEV)

| File | Discipline |
|------|-----------|
| `active-context.md` | **Small.** Current phase, active epic, last checkpoint, the *single* next action, live open questions. Overwrite, don't accrete. |
| `progress.md` | **Append-only**, newest on top. One line per shipped increment, tagged with its commit scope. |
| `backlog.md` | Milestones/epics; tasks only under the active epic (JIT). |
| `decisions.md` | Thin pointer index into `docs/adr/`. |

(META mirrors this in `agent/meta/`: `meta-journal.md`, `skill-registry.md`, `tuning-log.md`.)

## Core rules

1. **Single source of truth.** A fact lives in exactly one file. ADRs are the home of
   decisions; `decisions.md` only points. Don't restate the spec in memory.
2. **Read before you act.** Start each turn by reading `active-context.md`.
3. **Write at every checkpoint.** Update `active-context.md` (state + next action) and append
   to `progress.md`. This is non-negotiable — it's the recovery point.
4. **Compress when bloated.** When a file gets heavy (e.g. `progress.md` long, or
   `active-context.md` accreting stale notes): keep the last few entries verbose, collapse
   older ones to one-liners, and move any long-form detail to its real home (ADR / spec /
   archive). A reader should grasp current state in under a minute.
5. **Coherence.** No file may contradict another or the code. On any drift, fix it and note
   the correction. If `active-context.md` and reality disagree, reality wins.

## Procedure (at checkpoint)

1. Reconcile `active-context.md` with what actually happened; rewrite it tightly.
2. Prepend a one-line entry to `progress.md` with the commit scope.
3. Update `backlog.md` / `decisions.md` if epics or ADRs changed.
4. If any file is bloated, compress now (don't defer).
5. Hand control back to `checkpoint` for the git block.

## Separation

DEV writes `agent/memory/`. META writes `agent/meta/` for its own records, and may perform
*structural hygiene only* (compression/coherence) on `agent/memory/` — never adding new DEV
content or decisions there. Neither mode writes the other's records.
