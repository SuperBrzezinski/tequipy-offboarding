# Playbook — Git & commits (dos & donts)

Consulted by `devex-engineer` and used by the `checkpoint` skill. A clean, conventional commit
history is cheap, high-signal professionalism on a take-home — and it makes the work
reviewable commit-by-commit.

## Conventional Commits + our scope convention

```
<type>(<scope>): <imperative summary>
```

- **type** ∈ `feat | fix | chore | docs | test | refactor | build | ci | style | perf`.
- **scope** = `dev-NNN` (DEV mode) or `meta-NNN` (META mode), where `NNN` increments by one
  per checkpoint within its mode. The scope ties every commit to a mode and an increment,
  which is what keeps DEV and META history legible and separate.
- **summary**: imperative mood, ≤ ~72 chars, says what + why-it-matters.

Examples:
```
feat(dev-006): add equipment-return signal store and completion guard
test(dev-007): cover status state-machine transitions
docs(dev-009): summarize ADR-0003 in README key-decisions
feat(meta-002): tighten code-review skill triggering
```

## commitlint config (devex-setup wires this)

Use `@commitlint/config-conventional`, then allow our scope pattern. Sketch:

```js
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    // accept dev-NNN / meta-NNN; relax the default scope-enum
    'scope-enum': [0],
    'scope-case': [2, 'always', 'lower-case'],
  },
};
```
A `commit-msg` Husky hook runs commitlint; a bad message is rejected (verify it actually is).

## Which scope — agent vs product (the litmus test)

Ask: *am I changing what the agent **is**, or what the product **is**?*

- Subject = **agent** → `meta-NNN`: `CLAUDE.md`, `.claude/**` (skills, agents, commands),
  `agent/playbooks/**`, `agent/meta/**`. Authoring or tuning any skill/agent/playbook is meta —
  including the one-time bootstrap that created the agent layer.
- Subject = **product** → `dev-NNN`: `apps/**`, `libs/**`, tests, product docs in `docs/`
  (spec, ADRs, README, rubric-map), `.devcontainer`, DevEx config, and `agent/memory/**`
  (it logs product progress and is updated during DEV checkpoints).

When a change is genuinely both, it's two commits, not one (see Discipline).

## Discipline

- **One increment, one coherent commit.** Don't bundle unrelated changes.
- **Never mix DEV and META** changes in a single commit. If a commit would touch both `apps/`
  and `agent/meta/`, stop and split — it's a separation violation.
- Stage the **exact files** for the increment (`git add <paths>`), not blanket `-A` (except the
  very first scaffold commit).
- Commit at every checkpoint so a crash never costs more than one increment.

## Donts

`git add -A` out of laziness mid-project · "wip"/"stuff" messages · giant commits spanning
epics · committing generated/`node_modules` (the `.gitignore` covers this) · rewriting pushed
history on a shared submission repo.
