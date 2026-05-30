# .claude — agent mechanics

Claude Code reads this directory. It contains the *machinery*; the agent's *brain* lives in
`/agent` and the orchestration manual is the root `CLAUDE.md`.

- `agents/` — sub-agent definitions (roles the orchestrator delegates to).
- `skills/` — skills (procedures) loaded on demand by name.
- `commands/` — slash commands (e.g. `/meta`, `/checkpoint`).
- `settings.json` — permissions and tool defaults.
