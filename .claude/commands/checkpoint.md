---
description: Checkpoint the current increment — persist memory, emit the git block, suggest clearing the chat.
---

Run the `checkpoint` skill (`.claude/skills/checkpoint/SKILL.md`):
1. Update `agent/memory/active-context.md` + `progress.md` via `memory-manager` (compress if bloated).
2. Emit a ready-to-paste git block: explicit `git add <exact paths>` + a Conventional Commit
   with the correct scope (`dev-NNN` in DEV, `meta-NNN` in META), incrementing NNN.
3. Suggest clearing the chat, noting the state is fully recoverable from git + memory.
