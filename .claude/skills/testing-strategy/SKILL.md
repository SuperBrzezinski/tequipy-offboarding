---
name: testing-strategy
description: >
  Decide WHAT to test and WHY, then write meaningful tests with Vitest. USE when planning an
  epic's tests and when writing them. Optimizes for high-signal, refactor-proof tests over
  coverage numbers — the task explicitly grades the reasoning behind your test choices. Feeds
  the testing-strategy ADR and the README's testing section.
---

# Testing strategy

The task says it plainly: they care more about *what* you chose to test and *why* than about
coverage. So lead with reasoning. Spawn `qa-test-engineer`; consult
`agent/playbooks/testing.md`.

## Test the things that carry risk

1. **Domain status state-machine** (pure): legal transitions allowed, illegal rejected. This
   is correctness's core and trivially unit-testable.
2. **Completion predicate**: enabled iff every item is actioned — test the boundary
   (one un-actioned item → disabled; all actioned → enabled), per the agreed completion rule.
3. **Summary counts** derive correctly from item states.
4. **Condition-diff** detection (if that bonus ships).
5. The **chosen bonus's** core logic at unit level.

## Don't waste tests on

Whole-template snapshots, PrimeNG internals, `ng-reflect-*` (gone in v21), framework
behavior, or coverage-chasing trivial accessors. Brittle tests are negative value.

## How

- Pure logic → plain Vitest unit tests. Signal stores are directly testable — set inputs,
  read computed signals; no `TestBed` ceremony unless a component truly needs it.
- Components → Angular Testing Library; query by **role/label**, assert behavior through the
  public interface (inputs → intent → outputs). Never couple to CSS/DOM structure.
- Keep each test arrange-act-assert with one reason to fail.

## Deliverable

A small, pointed suite (the task wants *at least one* meaningful test — give a few, well
chosen) plus a short ADR explaining the strategy and the honest coverage gaps. Run
`pnpm nx test`. Summarize choices for the README.
