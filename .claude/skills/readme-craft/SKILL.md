---
name: readme-craft
description: >
  Build and continuously refresh the README as a first-class selling artifact. USE whenever a
  feature or decision lands, and at final polish. Keeps the README truthful, specific, and
  persuasive: working run instructions, architecture-at-a-glance, an ADR-summary of key
  decisions, the testing rationale, an honest "what's next", and a precise AI-tooling note.
  Spawn tech-writer.
---

# README craft

A reviewer decides in minutes. The README must earn trust fast and read as the work of
someone who ships. Truth first — never describe a feature that isn't there.

## Mandatory verification before writing

Run these checks **before** drafting or updating any section. Do not skip even if the
operator has just described the current state verbally — verify in the actual files.

- **ADRs:** `ls docs/adr/` — enumerate every file; note status (Accepted / Superseded /
  Proposed). Only include Accepted ones in the summary table.
- **Test counts:** for each spec file, count `it(` calls AND `it.each(` / programmatic `for`
  loops that generate tests — the runtime count can be much higher than a simple grep.
- **Architecture claims:** read the actual source file (store, routes, key components) — do
  not rely on ADR descriptions of the intended design; the code may have diverged.
- **Quick-start commands:** verify each Nx target exists in `project.json` before writing it.
  Verify `src/` files mentioned exist with `ls`. Never describe a file path or target from
  memory or from conversation context alone.
- **Operator-provided facts:** if the operator describes how something works (e.g. "styles.css
  is generated"), verify it in the code before writing it into the README. Operator memory
  can lag code refactors.

## Sections (keep each tight)

1. **One-line what + status** — what it does, current state.
2. **Quick start** — copy-pasteable, *actually works from a clean clone* (devcontainer or
   pnpm install → serve → test → lint). Verify the commands before writing them.
3. **What it does** — the flow in a few sentences, the completion rule called out.
4. **Architecture at a glance** — the layers, signal state, the status state-machine; why Nx
   boundaries make it lintable. 6–10 lines, not an essay.
5. **Key decisions (ADR summary)** — bullet the ADR "README line" of each accepted ADR, each
   linking to the full record. This is where judgement shows.
6. **Testing strategy** — *what* we tested and *why*; the honest coverage gaps.
7. **What I'd do next with more time** — specific cuts and next steps. Cuts are a strength.
8. **AI-tooling note** — what AI did (scaffold, boilerplate, drafts, review passes), what
   stayed human-owned (UX/architecture/the final read of every diff), and one real
   course-correction. Specific and modest — the role wants habit, not hype.
9. **Repo layout** — incl. the deliberately separated agent layer.

## Principles

- Specifics over adjectives ("status modeled as a discriminated union with a pure transition
  fn" beats "clean code").
- Pull truth from code + ADRs + `progress.md`. Mark TBD honestly.
- Refresh at every checkpoint so README ↔ reality never drift.
