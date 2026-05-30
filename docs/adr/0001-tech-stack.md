# ADR-0001 — Tech stack

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** orchestrator + solution-architect + operator
- **Mode:** dev
- **Tags:** tooling, architecture

## Context

We need a stack for a small but production-quality offboarding SPA, built under a 2–6h time
box, that signals senior judgement to the reviewers. The role explicitly lists **Angular**
as one of its core frameworks and the take-home pins the stack to **TypeScript + Angular**.
The operator proposed Angular 21 + Nx + PrimeNG; this ADR ratifies it after verifying
current versions and compatibility (verified 2026-05-29).

## Decision

- **Angular 21** — standalone components, **zoneless** change detection (default in v21),
  **OnPush** as the default strategy, signals for state. esbuild is the default builder.
- **Nx 22.3+** — monorepo tooling: enforced module boundaries, project graph, caching,
  fast targets. Generates zoneless Angular apps by default and aligns with Angular 21.
- **PrimeNG 21** — Angular-21-compatible component library; standalone-component imports,
  PassThrough + Unstyled mode for design-system control. Used **deliberately** (themed,
  wrapped), not dropped in raw — the task explicitly rewards understanding over decoration.
- **TypeScript (strict)** — `strict: true`, no unjustified `any`.
- **Vitest** — Angular 21's recommended/stable test runner (Karma deprecated; Jest/WTR
  slated for removal in v22). Playwright reserved as an option for one e2e happy-path if the
  time box allows.
- **pnpm** — fast, disk-efficient, strict node_modules; lockfile committed.
- **Node 24** (≥ 24.13.1) in the devcontainer — Angular 21's required runtime.

## Rationale

Choosing the *current* generation of each tool is itself a signal: the reviewers are
Revolut alumni building an AI-first product and value people who track the ecosystem.
Zoneless + signals is the modern Angular reactivity model and pairs naturally with a clean,
testable state layer (no Zone.js magic to reason around). Nx gives us **enforceable layer
boundaries** — the single most important thing the rubric probes ("is state lifted to the
right level?", "are components well-scoped?") — for nearly free. PrimeNG covers tables,
selects, dialogs and toasts so we spend our hours on flow and architecture, not on
reinventing a `<select>`.

## Consequences

- **Positive:** modern, fast feedback loop; module boundaries lintable; signals make state
  obvious and tests simple; PrimeNG accelerates UI without hand-rolling primitives.
- **Negative / cost:** Angular 21 + Nx is heavyweight for a tiny app — must be justified in
  the README so it reads as deliberate, not over-engineering. Zoneless + PrimeNG 21 is new
  enough that some recipes online are stale; rely on official docs, verify at scaffold time.
- **Follow-ups:** ADR on application architecture/layering; ADR on the testing strategy;
  Setup epic to scaffold the workspace and wire DevEx (lint/format/hooks/CI).

## Alternatives considered

- **Plain Angular CLI (no Nx).** Lighter, but loses enforced boundaries and caching; weaker
  architecture signal. Rejected — boundary enforcement is core to the rubric.
- **React/Vue.** The role accepts them, but Angular is the operator's strength and the
  take-home names TS + Angular. Playing to strength under a time box is the right call.
- **Angular Material instead of PrimeNG.** Equally valid (design uses Material too). PrimeNG
  chosen for breadth of data components; if Material fits a flow better we'll note it.
- **Karma/Jest.** Off the modern path for v21. Rejected in favor of Vitest.

## README line

> Angular 21 (standalone, zoneless, signals) on an Nx monorepo with PrimeNG and Vitest —
> the current Angular generation, chosen to make clean layering and meaningful tests cheap.
