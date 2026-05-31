# ADR-0006: Feature Library Consolidation — Nested Nx Sub-libraries

- **Date:** 2026-05-31
- **Status:** Accepted
- **Supersedes:** ADR-0004 (replaces the four-flat-library layout)

## Context

ADR-0004 established a flat four-library layout:
`domain` / `data-access` / `feature-offboarding` / `ui` — each a top-level Nx project.
After building through DEV-012, two structural problems became apparent:

1. **Scattered cohesion.** All four libraries belong to a single feature/domain
   (equipment offboarding). There is no second feature that would ever share `domain`,
   `data-access`, or `ui` across a feature boundary. The flat structure communicates
   shared infrastructure that doesn't exist.

2. **Over-exposed public API.** The app shell (`offboarding-shell`) could legally import
   directly from `@org/data-access` or `@org/domain` — and did (the store was moved
   there specifically to serve the app-shell guard). A clean feature library should
   expose exactly one entry point to the outside world.

3. **Store scoping.** `OffboardingStore` was `providedIn: 'root'`, meaning it lived for
   the entire app lifetime. For a single active offboarding session this is harmless,
   but it is semantically wrong — the store should be scoped to the feature route.

## Decision

Consolidate into one directory tree rooted at `libs/offboarding-feature/` with three
nested Nx sub-projects:

```
libs/
  offboarding-feature/           @org/offboarding-feature        type:feature
    data-access/                 @org/offboarding-feature/data-access  type:data-access
    domain/                      @org/offboarding-feature/domain       type:domain

apps/
  shell/                         (renamed from offboarding-shell)
```

The `ui` library is dissolved: its presentational components are feature-specific and
have no cross-feature consumers, so they move into
`offboarding-feature/src/lib/components/`.

### Public API surface

`libs/offboarding-feature/src/index.ts` exports exactly two symbols:
- `OffboardingFeatureComponent` — the root component (renders `<router-outlet>`).
- `OFFBOARDING_FEATURE_ROUTES` — the routes array consumed by the app shell via
  `loadChildren`.

No other library is directly importable by the app shell.

### Store & repository scoping

`OffboardingStore` loses `providedIn: 'root'`.
`OFFBOARDING_REPO` token loses its `providedIn` factory.
Both are provided in `OFFBOARDING_FEATURE_ROUTES[0].providers` (route-level environment
injector). This means:

- The store is created when the feature route activates and destroyed when it leaves.
- The `canDeactivateSession` guard (moved into the feature lib) can still
  `inject(OffboardingStore)` because child-route guards share the parent route's
  environment injector.
- The app shell `app.config.ts` no longer registers any offboarding services.

### Module boundary rules (tightened)

| Source tag | May depend on |
|---|---|
| `type:domain` | _(nothing)_ |
| `type:data-access` | `type:domain` |
| `type:feature` | `type:data-access`, `type:domain` |
| `type:app` | `type:feature` ← **was also data-access, domain, ui** |

The app can no longer reach sub-libraries directly.

### Naming

- Library directory: `libs/offboarding-feature/` (was `feature-offboarding`) —
  `{domain}-{type}` order aligns with Nx convention.
- App: `apps/shell/` (was `apps/offboarding-shell/`) — shorter, unambiguous in a
  single-app workspace.
- Path aliases use nested style: `@org/offboarding-feature/domain` communicates
  ownership without a redundant `offboarding-` prefix on every import.

## Consequences

**Good:**
- Single directory owns all offboarding code; easy to locate everything.
- App shell has one import path; internal layers are invisible to it.
- Store lifetime matches feature lifetime.
- Nx boundary enforcement preserved via per-sub-project `project.json` + tags.

**Trade-off:**
- `tsconfig.json` in sub-projects uses `../../../tsconfig.base.json` (one level deeper).
  Acceptable — it's a one-time setup detail.
- Nx generators default to flat layout; new sub-libs must be scaffolded manually or
  with explicit `--directory` flags. Acceptable for a single-domain workspace.
