# Playbook — Component design (dos & donts)

Consulted by `frontend-engineer` and `code-reviewer`. Rubric: "Are components well-scoped? Is
state lifted to the right level?"

## Scoping & smart/presentational split

- **Presentational** components: take `input()`s, emit `output()`s, render. No store, no
  data-access, no business rules. The equipment **row** and the **summary panel** are
  presentational — they receive data and emit intents (`return`, `reportIssue`).
- **Smart** (container) components: inject the feature store, wire intents to store methods,
  pass signals down. The **offboarding page** is the one smart component here.
- Keep components small and single-purpose. If a template has three responsibilities, it's
  three components.

## Angular 21 signal APIs

- Inputs: `name = input.required<string>()` / `input<T>(default)`. Outputs: `done =
  output<void>()`. Two-way only when it truly fits: `model<T>()`.
- Use `inject()` over constructor params for services/stores — cleaner, works in functions.
- Templates use `@if`, `@for (x of items; track x.id)`, `@switch`. Always `track` lists by a
  stable id (equipment `id`), never by index for mutable lists.
- OnPush is the default; never mutate inputs — replace.

## Accessibility (part of "done", not a later pass)

- Every interactive control has an accessible name (label or `aria-label`). Status is conveyed
  by text/role, not color alone (condition-diff must not be red-only).
- Logical focus order; visible focus; dialogs trap focus and restore it on close.
- Use semantic elements (`<button>` for actions, real headings); a table for the equipment
  list reads well to screen readers and matches the data.
- The completion button's disabled state must be programmatically disabled, not just styled.

## Donts

A component that fetches/derives and renders and decides (split it) · `@for` tracked by index
· color-only status signaling · inputs mutated in place · dialogs you can't reach or escape by
keyboard · presentational components importing the store.

## Note on PrimeNG

Wrap PrimeNG controls behind your presentational components so the app depends on *your*
interface, not PrimeNG's. See `primeng-usage.md`.
