# Skills — procedures

Each skill is a *procedure* the agent loads on demand by trigger (the `description` in its
frontmatter). Skills tell the agent **how** to do a recurring task; reference *knowledge*
(dos & donts) lives in `agent/playbooks/`. The flow they support, end to end:

```
discovery-session → spec-authoring → (adr) → backlog-planning →
   [ per epic: task-breakdown → implement → testing-strategy → code-review + design-review → checkpoint ]
final: readme-craft → demo-walkthrough → rubric-alignment (red-team) → submit
```

| Skill | When it fires |
|-------|---------------|
| `discovery-session` | first; resolve ambiguous flows + pick the bonus |
| `spec-authoring` | after discovery; precise requirements + acceptance criteria |
| `adr` | any decision that interprets the task or commits a direction |
| `backlog-planning` | after spec+architecture; milestones/epics (not tasks) |
| `task-breakdown` | JIT, when picking up one epic |
| `testing-strategy` | planning/writing meaningful tests |
| `code-review` | after every increment, before checkpoint (spawns reviewer) |
| `design-review` | after any increment that ships a view (spawns ui-designer) |
| `devex-setup` | the Setup epic; Nx + lint boundaries + hooks + commitlint + CI |
| `checkpoint` | closes every increment: memory + git block + context-clear |
| `readme-craft` | whenever a feature/decision lands; final polish |
| `demo-walkthrough` | near the end; the 3–5 min submission walkthrough |
| `rubric-alignment` | bonus choice, mid-build coverage check, pre-submission red-team |

Infrastructure / META skills:

| Skill | When it fires |
|-------|---------------|
| `memory-manager` | every checkpoint, or when memory is heavy/out of sync (both modes) |
| `meta-loop` | a message prefixed `:::meta` (or `/meta`) — improve the agent itself |
