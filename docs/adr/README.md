# Architecture Decision Records

Every decision that **interprets an ambiguity** in the task, or commits us to an
architecture / tooling / testing direction, is recorded here as a numbered ADR. Small,
immutable, append-only: we don't rewrite an ADR, we **supersede** it with a new one (and set
the old status to `Superseded by ADR-XXXX`). This makes course-corrections between epics
visible and honest — a feature, not a confession.

- Template: [`0000-template.md`](0000-template.md)
- The README's "Key decisions" section summarizes these for reviewers.

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-tech-stack.md) | Tech stack | Accepted |
| [0002](0002-item-state-machine.md) | Item state machine | Accepted |
| [0003](0003-bonus-feature.md) | Bonus feature choice | Accepted |
| [0004](0004-architecture.md) | Front-end architecture (original) | Superseded by 0006 |
| [0005](0005-employee-list-table-over-cards.md) | Employee list: table over cards | Accepted |
| [0006](0006-feature-library-consolidation.md) | Feature library consolidation | Accepted — supersedes 0004 |
| [0007](0007-repo-as-source-of-truth.md) | Repository as source of truth | Accepted |
