---
name: meta-loop
description: >
  Drive META mode — the agent reflecting on and improving ITSELF. TRIGGERED when a message
  starts with ":::meta" (or via the /meta command). Covers: reflection on recent work, tuning
  and authoring skills/agents, memory compression and coherence, and keeping the whole agent
  layer self-consistent. Operates under strict separation: META records live in agent/meta/,
  META may edit shared machinery, but it NEVER writes app code or DEV deliverable docs.
---

# Meta loop

This is the agent stepping outside the build to improve how it works. It is deliberately
sandboxed so meta-thinking never contaminates product work.

## Separation rules (read first, every time)

- **META records** (reflections, registry, tuning) → `agent/meta/` only. Never write meta
  notes into `agent/memory/`, `docs/`, or the app.
- **Shared machinery is META's mandate.** META *may* edit `.claude/skills/`,
  `.claude/agents/`, `.claude/commands/`, and `CLAUDE.md` — improving these is the whole
  point. Such edits are committed as `feat(meta-NNN)`.
- **DEV memory hygiene only.** META may compress/realign `agent/memory/` *structurally*
  (shrink bloat, fix contradictions) but must not add new DEV content or decisions there.
- **Hands off the product.** META never touches `apps/`, `libs/`, or DEV docs content.
- A `:::meta` turn ends → return to DEV mode. Don't linger.

## The loop

1. **Frame & scope.** State that you're in META mode and what this pass will look at. Read
   `agent/meta/*` and skim `agent/memory/progress.md` + recent commits to ground reflection
   in what actually happened.
2. **Reflect.** Where did the agent stumble? Symptoms to hunt:
   - a skill that **mis-fired or didn't fire** when it should have → fix its `description`;
   - **overlapping** skills/agents doing the same job → merge or sharpen boundaries;
   - a **gap** (a recurring need with no skill) → author a new skill;
   - a **playbook rule** that didn't earn its place → cut or rewrite;
   - **memory drift** or bloat → schedule a hygiene pass.
   Record findings in `agent/meta/meta-journal.md` (append-only).
3. **Tune.** Make the smallest effective edit to a skill/agent/CLAUDE.md. Log the before→after
   intent and the expected effect in `agent/meta/tuning-log.md`; update the health view in
   `agent/meta/skill-registry.md`.
4. **Author (if needed).** New skill → follow the skill format (frontmatter `name` +
   *pushy* `description`; concise procedural body; references for depth). Register it.
5. **Memory hygiene.** If DEV memory is bloated or incoherent, invoke `memory-manager` to
   compress/realign it (structural only). Note it in the journal.
6. **Coherence sweep.** Check that `CLAUDE.md`, skills, agents, playbooks and the indexes
   don't contradict each other (e.g. a skill named in §9 that doesn't exist). Fix drift.
7. **Close.** Summarize the pass in `meta-journal.md`, then checkpoint with a `meta-NNN`
   commit (the `checkpoint` skill, META scope). Suggest clearing the chat. Return to DEV.

## Stance

Improve by subtraction first. The best meta pass often *removes* a redundant rule or tightens
one description — not piles on new machinery. Keep the agent layer lean enough that it stays
an asset, not overhead.
