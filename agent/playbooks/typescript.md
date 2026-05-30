# Playbook — TypeScript (dos & donts)

Consulted by `frontend-engineer` and `code-reviewer`. The rubric grades "Are types meaningful?
Does the shape of the data propagate cleanly?" — so types are design, not decoration.

## Strict by default

- `strict: true` and friends (`noUncheckedIndexedAccess`, `noImplicitOverride`,
  `exactOptionalPropertyTypes` where it helps). The task says: no `any` escapes unless clearly
  justified — so on the rare justified `any`, leave a one-line comment saying why.
- **DON'T** silence the compiler with `as` casts or `!` non-null assertions to "make it
  build". A cast is a claim you're overriding the checker — earn it or fix the type.

## Model the domain in the types

- The item return status is the spine. Model it as a **discriminated union**, not loose flags:

  ```ts
  type ItemStatus =
    | { kind: 'pending' }
    | { kind: 'returned'; condition: ReturnCondition }
    | { kind: 'issue'; note: string };
  ```

  This makes illegal states unrepresentable (you can't be "returned" without a condition, or
  "issue" without a note) and gives exhaustive `switch` checking via `never`.
- `ReturnCondition = 'good' | 'damaged' | 'missing-accessories'` — a union, not a string.
- Keep the **raw mock data** types separate from the **domain** types you derive; map at the
  data-access boundary. Don't let the JSON shape leak into the UI.

## Make the shape propagate

- Define types once in `domain`; import them everywhere else. One source of truth for shape,
  like for state.
- **DO** use generics where they remove duplication with real payoff (e.g. a small
  `Result<T>` if you add async). **DON'T** add generics for cleverness — concrete is clearer.
- Prefer `readonly` arrays/props for state you treat as immutable; update by replacement
  (plays nicely with signals + OnPush).

## Exhaustiveness

- Use a `assertNever(x: never)` helper in `switch` over the status union, so adding a new
  status becomes a compile error everywhere it's handled. This is cheap correctness the
  reviewers will notice.

## Donts

`any` without justification · `as`/`!` to dodge real type problems · stringly-typed status or
condition · duplicating the data shape across layers · `enum` where a string union is simpler
and tree-shakeable.
