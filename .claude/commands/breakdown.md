---
description: Break the SINGLE active epic into JIT tasks with definitions of done.
argument-hint: "[epic name, optional]"
---

Run the `task-breakdown` skill on the active epic ($ARGUMENTS if specified, else the next
epic in `agent/memory/backlog.md`). Decompose into 3–7 small, reviewable tasks, each with a
Definition of Done, write them under the epic, and set the next action in `active-context.md`.
Do not break down any other epic.
