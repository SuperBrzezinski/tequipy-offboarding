# META layer (separated)

This is the agent's brain for **META mode**, triggered by a message starting with `:::meta`
(or the `/meta` command). META is the agent reflecting on *itself* — tuning skills, authoring
new ones, and keeping memory healthy. Its separation rules:

- **META records** (reflections, registry, tuning) live **only here**, in `agent/meta/`.
  Never write meta notes into `agent/memory/`, `docs/`, or the app.
- **Shared machinery is META's mandate:** it *may* edit `.claude/skills/`, `.claude/agents/`,
  `.claude/commands/`, and `CLAUDE.md` — improving them is the point of META.
- **DEV-memory hygiene only:** META may compress/realign `agent/memory/` *structurally*
  (shrink bloat, fix contradictions) but never adds new DEV content or decisions there.
- **Hands off the product:** META never touches `apps/`, `libs/`, or DEV docs content.
- META commits use the `feat(meta-NNN): …` scope; DEV uses `feat(dev-NNN): …`.
- When a `:::meta` turn ends, the agent returns to DEV mode.

| File | Purpose |
|------|---------|
| `meta-journal.md` | Append-only log of reflections, what was changed and why. |
| `skill-registry.md` | Inventory of skills with health notes (triggering, overlaps, gaps). |
| `tuning-log.md` | Specific edits to skills/agents and their observed effect. |

The `meta-loop` skill (`.claude/skills/meta-loop/`) drives this layer, including memory
**compression** and **coherence** checks across both brains (it may *read* DEV memory to
assess health, but only *writes* here).
