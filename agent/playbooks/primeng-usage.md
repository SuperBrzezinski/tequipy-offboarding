# Playbook — PrimeNG usage (dos & donts)

Consulted by `frontend-engineer`. The task is explicit: if you use a component library, **show
you understand it** rather than dropping components in raw. The JD also values **token-based
design systems** — so treat PrimeNG as a themed system, not a bag of widgets.

## Set it up deliberately (Angular 21 / PrimeNG 21)

- PrimeNG 21 is **standalone**: import the component class directly (e.g. `Select`, `Dialog`,
  `Table`), not a module. Verify exact import paths at integration time.
- Configure theming centrally via `providePrimeNG({ theme: { preset } })` with a design-token
  preset (Aura-style). This is your **design-token layer** — change tokens, not per-component
  CSS. Mention this in the README to hit the "token-based design systems" criterion.
- Add `ToastModule`/`MessageService` for feedback, `ConfirmDialog`/`ConfirmationService` for
  destructive confirmations (e.g. completing offboarding, or returning worse-than-assigned).

## Use it well

- **Wrap, don't leak.** Put PrimeNG controls behind your own presentational components, so the
  app depends on *your* `<app-condition-select>` interface, not PrimeNG's API. Swapping
  Material later becomes a one-file change. This is the understanding they're probing.
- **PassThrough (`pt`)** for targeted structural/aria tweaks on a single instance; reach for it
  instead of `::ng-deep`. **Unstyled mode** is the escape hatch if you want to drive everything
  from your own tokens — only if time allows.
- Pick components that fit the data: a **Table** for the equipment list (sortable, accessible
  rows), a **Select** for return condition, a **Tag/Badge** for status, **Dialog** for the
  issue note, **Toast** for confirmation.

## Donts

- **DON'T** `::ng-deep` to fight component styles — use tokens or `pt`.
- **DON'T** scatter raw PrimeNG components across smart and dumb layers; wrap them.
- **DON'T** over-import — tree-shake to what you use.
- **DON'T** rely on color-only status (PrimeNG severities) for meaning; pair with text.

## README line to earn

> PrimeNG configured as a token-based theme and wrapped behind app-level presentational
> components, so the UI depends on our interface — not the library's — and restyles via tokens.
