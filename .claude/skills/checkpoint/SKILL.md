---
name: checkpoint
description: >
  Produce a checkpoint at every meaningful boundary: persist memory, emit a ready-to-paste git
  block (explicit add + a Conventional Commit with the dev-/meta- scope), and suggest clearing
  the chat to reclaim context. USE at the end of discovery, the spec, each epic/task, and after
  any risky decision. This is ALWAYS the closer of an increment — never let a crash cost more
  than one increment.
---

# Checkpoint

The operator has lost long runs to crashes before. Checkpoints make every increment
recoverable from git + memory alone, and keep the context window lean.

## Procedure

1. **Persist memory** (`memory-manager`): update `agent/memory/active-context.md` (current
   state + the single next action) and append to `agent/memory/progress.md`. Compress if it
   has grown bloated.
2. **Emit the git block** — explicit `git add` of the *exact* files touched (not blanket
   `-A`, except the very first scaffold commit), then a Conventional Commit:

   ```bash
   git add <exact paths>
   git commit -m "<type>(dev-NNN): <imperative summary>"
   ```

   - `type` ∈ `feat | fix | chore | docs | test | refactor | build | ci | style | perf`.
   - **Scope**: `dev-NNN` in DEV mode, `meta-NNN` in META mode. `NNN` increments by one each
     checkpoint within its mode (see the latest in `progress.md` / `meta-journal.md`).
   - Summary: imperative, ≤ ~72 chars, says what changed and why it matters.
   - Examples:
     `feat(dev-006): add equipment-return signal store and completion guard`
     `test(dev-007): cover status state-machine transitions`
     `docs(dev-008): summarize ADR-0003 in README key-decisions`

3. **Suggest clearing the chat**: tell the operator the state is fully captured in git +
   `active-context.md`, so a fresh chat can resume by reading `CLAUDE.md` →
   `active-context.md`. Offer it; don't force it.

## Rules

- Never bundle unrelated changes into one commit. One increment, one coherent commit.
- DEV and META commits never mix in a single commit.
- If a commit would touch both `apps/` and `agent/meta/`, something is wrong — stop and split.
