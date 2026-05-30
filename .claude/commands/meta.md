---
description: Enter META mode (alias for the ":::meta" prefix) — reflect on and improve the agent itself.
---

Enter **META mode**. Load `.claude/skills/meta-loop/SKILL.md` and follow it.

Operate under META separation rules: write META records only in `agent/meta/`; you may edit
shared machinery (`.claude/skills`, `.claude/agents`, `.claude/commands`, `CLAUDE.md`) and
perform structural hygiene on `agent/memory/`, but never touch `apps/`, `libs/`, or DEV docs
content. Close with a `feat(meta-NNN)` checkpoint and return to DEV mode.

Focus for this pass (optional): $ARGUMENTS
