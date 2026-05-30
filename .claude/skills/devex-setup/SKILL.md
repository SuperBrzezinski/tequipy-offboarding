---
name: devex-setup
description: >
  Set up the Nx workspace and the full developer experience: Nx libraries that mirror the
  architecture layers, ESLint with module-boundary enforcement, Prettier, Husky + lint-staged
  pre-commit hooks, commitlint (Conventional Commits accepting our dev-/meta- scopes), and a
  CI pipeline. USE for the Setup epic and any tooling change. Verify current tool versions
  live before generating — don't trust memory.
---

# DevEx setup

Make quality enforced by tooling, not vigilance, and make the repo read as mature on first
clone. Spawn `devex-engineer`; consult `agent/playbooks/git-and-commits.md`.

## Ordered procedure

1. **Verify versions** (web): current Nx, Angular 21.x, PrimeNG 21.x, Node. Don't hardcode.
2. **Create workspace** with pnpm, e.g.
   `pnpm dlx create-nx-workspace@latest tequipy --preset=apps --pm=pnpm` then add the Angular
   plugin (`@nx/angular`); generate the app and **libraries that mirror the layers**:
   `feature-offboarding` (presentation), `application` (signal stores/use-cases),
   `domain` (pure TS: models + status state-machine), `data-access` (in-memory repo).
   Tag each lib (`scope:*`, `type:feature|state|domain|data`).
3. **Module boundaries**: configure `@nx/enforce-module-boundaries` so `domain` imports
   nothing app-ish, `application` may use `domain`, `feature` may use `application`+`domain`,
   and nothing imports `feature`. The layering becomes lintable — architecture as code.
4. **Prettier + ESLint**: align with `.editorconfig`; add `format` and `lint` targets;
   strict-TS lint rules on.
5. **Husky + lint-staged**: `pre-commit` runs prettier + `nx affected -t lint` on staged
   files (fast, scoped).
6. **commitlint**: `@commitlint/config-conventional`, with a `commit-msg` hook. Allow our
   scope convention by relaxing/extending `scope-enum` (accept `dev-NNN` / `meta-NNN`), e.g.
   set `scope-empty: [0]` and a custom rule permitting the `dev-`/`meta-` prefix pattern.
7. **CI** (`.github/workflows/ci.yml`): pnpm install (frozen lockfile) → `nx affected`
   lint + test + build, with Nx cache. Keep it lean and green.

## Verify it actually works

- A bad commit message is rejected by `commit-msg`.
- A lint error blocks `pre-commit`.
- `pnpm nx run-many -t lint test build` is green from a clean clone.

## Boundaries

Keep the **agent layer** (`.claude/`, `agent/`) out of the app's lint/test scope. Report the
wired setup; `readme-craft` turns it into the README's run instructions. Checkpoint.
