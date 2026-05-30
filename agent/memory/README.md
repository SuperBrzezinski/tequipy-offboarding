# DEV working memory

This is the agent's brain for **DEV mode**. Plain markdown, version-controlled, so a crash
or a cleared chat never loses state. The `memory-manager` skill owns the hygiene rules
(compress when bloated, keep coherent, never duplicate a fact across files).

| File | Purpose | Read when | Write when |
|------|---------|-----------|------------|
| `active-context.md` | The *current* state + the single next action. Small by design. | Start of every turn | Every checkpoint |
| `progress.md` | Append-only build log (what shipped, per epic/task). | Need history | After each task/epic |
| `backlog.md` | Milestones & epics; tasks added JIT per epic. | Planning / picking next work | Backlog changes |
| `decisions.md` | Lightweight index/pointer to `docs/adr/`. | Reviewing rationale | New ADR added |

**Separation rule:** META mode never writes here. See `agent/meta/`.
