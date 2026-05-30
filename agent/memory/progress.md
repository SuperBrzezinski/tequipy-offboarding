# Build log

Append-only. Newest at the top. One line per shipped increment, referencing the commit scope.

- `feat(meta-006)` — add design layer: `ui-designer` sub-agent, `visual-design` playbook,
  `design-review` skill + command; wired into roster, indexes, primeng-usage, rubric-map.

- `build(dev-006)` — EPIC: Setup complete. Nx 22.7.5 + Angular 21 workspace scaffolded;
  apps/offboarding-shell (zoneless, OnPush, strict TS, withComponentInputBinding); four libs
  (domain/data-access/feature-offboarding/ui) with boundary tags; @nx/enforce-module-boundaries
  + no-restricted-imports on domain (zero Angular imports enforced); @angular-eslint/prefer-on-push
  as error; Prettier (singleQuote, printWidth 100); Husky pre-commit (lint-staged) + commit-msg
  (commitlint, custom dev-NNN/meta-NNN scopes); CI (.github/workflows/ci.yml, lint+test+build).
  All gates green: lint 5/5, test 5/5, build 5/5. Next: EPIC: Domain core.

- `docs(dev-005)` — ADR-0004 written: Nx lib split (domain/data-access/feature-offboarding/ui),
  plain signal store, OnPush+zoneless, smart/dumb contract, lazy routing; backlog updated
  (epic 1 complete, epics 2–7 sharpened). Next: EPIC Setup (devex-engineer).

- `docs(dev-004)` — spec v1.1 signed off: state machine (incl. Returned→Pending undo),
  completion predicate, all edge flows, bonus ACs; ADR-0002 + ADR-0003 written.
  Next: architecture ADR (ADR-0004) → backlog.

- `feat(dev-003)` — agent layer complete: 7 sub-agents, 14 skills, 7 commands, DEV+META
  memory, 7 playbooks, rubric-map. **Application build not started** — next is the
  Discovery+Spec+Architecture epic.

- `chore(dev-000)` — repo skeleton, layer separation, devcontainer, CLAUDE.md, README v0,
  ADR-0001 (tech stack). Application not yet scaffolded.
