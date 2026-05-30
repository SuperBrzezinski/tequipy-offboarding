# Playbooks — dos & donts and domain knowledge

The agent's hard-won "house rules", consulted during implementation and review. Each
playbook is a focused, opinionated checklist the relevant sub-agent loads on demand.

- `angular-architecture.md` — layering, state placement, signals, zoneless/OnPush, Nx boundaries.
- `typescript.md` — strict-mode patterns, modeling the domain in types (discriminated unions).
- `component-design.md` — scoping, smart/presentational split, signal I/O APIs, a11y.
- `visual-design.md` — the visual layer: tokens, hierarchy, spacing, complete states; restraint.
- `testing.md` — what to test and what not to, with Vitest + Angular Testing Library.
- `primeng-usage.md` — theming/wrapping PrimeNG deliberately as a token system, not raw drops.
- `it-admin-domain.md` — how real offboarding works; the status model; edge cases.
- `git-and-commits.md` — Conventional Commits, dev-/meta- scopes, commitlint, checkpoint discipline.

Stance: **critical, context-aware**. A rule only earns its place if it improves the build
against the layering, the rubric, and the time box.
