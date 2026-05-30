# Playbook — Testing (dos & donts)

Consulted by `qa-test-engineer` and `code-reviewer`. The task is explicit: *what* you test and
*why* beats coverage. Reference for the `testing-strategy` skill.

## Pyramid for this app

- **Mostly pure unit tests** on `domain` (status transitions, completion predicate, summary
  counts, condition-diff). Fast, deterministic, no framework.
- **A few store tests** on `application` (set state → assert `computed` signals). Signal stores
  are directly testable — no `TestBed` ceremony needed for pure logic.
- **One or two component behavior tests** on the highest-value interaction (e.g. marking an
  item returned updates the row + summary), via Angular Testing Library.
- **Optional**: one Playwright happy-path e2e *only* if the time box clearly allows.

## Vitest + Angular 21

- Vitest is the v21 default runner (Karma deprecated; Jest/WTR slated for removal in v22). Use
  Nx's Vitest setup; keep tests colocated with the code they test.
- For zoneless components, prefer `ComponentFixture` with explicit `fixture.detectChanges()` or
  ATL's `render` + `await screen.findBy...`. Don't rely on Zone autodetection — there isn't one.

## What makes a test worth keeping

- It pins **behavior or a rule**, and would **fail on a real regression**.
- It survives a refactor that doesn't change behavior.
- It reads as documentation: arrange-act-assert, one reason to fail, a name that states the
  rule ("complete is disabled while any item is pending").

## Query like a user (components)

- ATL: query by **role / label / text**, interact, assert on rendered intent and emitted
  outputs. Never select by CSS class or DOM structure.
- `ng-reflect-*` attributes are **removed in v21** — any test relying on them is dead. Don't
  write new ones.

## Donts

Whole-template snapshots · asserting PrimeNG internals · testing framework/Angular behavior ·
coverage-padding trivial getters · brittle CSS/structure selectors · over-mocking until the
test only proves the mock. A flaky or meaningless test is **negative** value — delete it.

## Deliverable framing

The README states the strategy and the honest gaps ("given the time box, I unit-tested the
domain rules exhaustively and behavior-tested the one critical interaction; I'd add e2e and
more component coverage next"). Owning the gaps reads as senior, not as a hole.
