# Playbook — Angular architecture (dos & donts)

Consulted by `solution-architect` and `frontend-engineer`. **Stance:** a rule earns its place
only if it serves the layering, the rubric, or the time box. Challenge anything that doesn't.

## The layering (non-negotiable)

```
presentation  → components/pages. Thin. Signals in, events out. No business rules.
application   → feature signal stores + use-cases. Orchestrates flows, holds UI state.
domain        → pure TS: models, the status state-machine, the completion predicate. No Angular.
data-access   → in-memory repository serving the mock dataset behind a domain-owned port.
```

Dependencies point **inward** only. In Nx these are separate libs with tags, and
`@nx/enforce-module-boundaries` makes a violation a lint error. *That* is the headline the
reviewers reward ("state lifted to the right level?").

- **DO** put the offboarding rules (legal status transitions, "is everything actioned?")
  in `domain` as pure functions — trivially testable, framework-free.
- **DO** keep the signal store in `application`; components read its signals and call its
  methods.
- **DON'T** let a component compute business rules inline, or let `domain` import anything
  from Angular/PrimeNG/`application`.

## Reactivity (Angular 21 = zoneless + signals)

- **DO** use `signal()` for state, `computed()` for derived values (summary counts, the
  completion flag, condition-diff). Derive, don't duplicate.
- **DO** default to **OnPush** (it's the v21 default) and lean on signals for change
  detection — there's no Zone.js to lean on, and that's good.
- **USE `effect()` sparingly** — for side-effects (logging, syncing), never to write state you
  could `computed`. Effects that set signals are a smell.
- **DON'T** reach for RxJS for local synchronous state here; signals are simpler and the app
  has no streams worth modeling. (If an async "save" bonus lands, a small `resource()` or a
  promise-in-method is enough.)

## State placement

- The **single source of truth** is the equipment list with each item's status/condition/note
  in the feature store. Everything else (counts, completion-enabled) is `computed` from it.
- Lift state to the **lowest** component that needs it; only promote to the store when two
  siblings or a flow need it. Don't globalize prematurely.

## Forms

- The forms here are tiny (a condition select, an issue note). **Prefer signals + a typed
  reactive form** over template-driven. **Signal Forms are experimental in v21** — note them
  as "next", don't bet the take-home on them.

## Routing & performance

- One primary view; route only if it clarifies (e.g. `/offboarding/:employeeId`). Don't
  build a router cathedral for one screen.
- `@if`/`@for` (with `track`) control flow; `@defer` only if something is genuinely heavy.
- Performance posture for the README: OnPush + signals + esbuild + `track` on lists. Mention
  Core Web Vitals awareness; don't over-optimize a 2-screen app.

## Smell list (stop and rethink)

Business logic in a component · a `domain` file importing Angular · state duplicated instead
of `computed` · an `effect` writing state · a service that's really just global mutable
state · "manager/helper/util" libs with no clear layer.
