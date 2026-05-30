---
description: Independent code review of the current diff before checkpoint.
---

Run the `code-review` skill. Spawn the read-only `code-reviewer` sub-agent **fresh** on the
current diff; it runs `pnpm nx lint` + `pnpm nx test`, reports findings tagged
[blocker]/[should]/[nit] with file:line, and gives a verdict + rubric read. Route fixes back
to `frontend-engineer`; only checkpoint on a passing verdict.
