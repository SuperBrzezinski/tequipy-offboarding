# Employee Offboarding — Equipment Return

A production-quality single-page app for IT administrators to manage the equipment-return
step of employee offboarding: pick a departing employee, work through their assigned
devices (return / flag issues), and complete offboarding only when everything is accounted
for.

> Take-home for the **Tequipy — Founding Frontend Engineer** role.
> Stack: **Angular 21 · Nx · PrimeNG · TypeScript (strict) · Vitest**.

---

## Status

🚧 **In progress** — this README grows with the project. Sections marked _TBD_ are filled in
as the corresponding epic lands. See [`agent/memory/progress.md`](agent/memory/progress.md)
for the live build log.

---

## How this was built (and why that matters)

The role asks for AI-assisted development as a *habit*, not a curiosity. So this repo is
itself evidence of that workflow. Alongside the application lives a small, **clearly
separated agent layer** (`.claude/` + `agent/`) that drives the build: an orchestrator that
delegates to specialized sub-agents (architect, frontend engineer, independent code
reviewer, QA, IT-admin domain expert, tech writer, DevEx), captures decisions as **ADRs**,
and manages its own working memory in version-controlled markdown.

This is deliberate. It demonstrates: disciplined decision-making under a time box, clean
separation of concerns (the agent layer never bleeds into the app), and a repeatable,
reviewable way of using AI tools that a team could adopt — exactly the "team norms around
AI-assisted development" the role calls for.

- **What AI did:** scaffolding, boilerplate, test stubs, doc drafting, review passes.
- **What stayed human-owned:** product/UX judgement, architecture sign-off, the final read
  of every diff. Course-corrections are recorded, not hidden.

If you only want the application, ignore `.claude/` and `agent/` — the app is in `apps/` and
`libs/` and stands entirely on its own.

## Quick start

```bash
# Recommended: open in VS Code → "Reopen in Container" (devcontainer ships the toolchain)
pnpm install
pnpm nx serve <app>        # TBD once the app is scaffolded
pnpm nx test  <project>    # Vitest
pnpm nx lint  <project>
```

_Full, copy-pasteable run instructions: **TBD** (added with the Setup epic)._

## What it does

_Feature walkthrough: **TBD**. Planned scope and the reasoning behind each flow live in
[`docs/spec.md`](docs/spec.md) and [`docs/discovery.md`](docs/discovery.md)._

## Architecture at a glance

_**TBD** — agreed during the Architecture step and recorded in [`docs/adr/`](docs/adr/).
Headline: strict layer separation (presentation / application-state / domain / data),
signal-based state, standalone zoneless Angular._

## Key decisions (ADR summary)

The full records are in [`docs/adr/`](docs/adr/). Highlights:

- **[ADR-0001](docs/adr/0001-tech-stack.md)** — Tech stack: Angular 21 + Nx + PrimeNG +
  Vitest + pnpm.
- _more as they are made…_

## Testing strategy

_**TBD** — what we test and **why** (we optimize for meaningful, maintainable tests over
coverage numbers). Recorded in an ADR and summarized here._

## What I'd do next with more time

_**TBD** — honest backlog of cuts and next steps._

---

## Repository layout

```
apps/ libs/      → the Angular application (the actual deliverable)
docs/            → spec, discovery notes, ADRs, rubric map
.claude/ agent/  → the AI agent layer that drove the build (separated from the app)
.devcontainer/   → reproducible dev environment
```

## Repository as a workspace

This repo doubles as a ready-to-use AI engineering workspace. Open it in VS Code with the
Claude extension and the orchestrator (`CLAUDE.md`) picks up from the live state in
`agent/memory/`. New here? Start by reading `CLAUDE.md`.
