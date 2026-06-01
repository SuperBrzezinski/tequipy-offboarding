# Meta journal

Append-only. Reflections on the agent's own performance and the changes they motivated.

- `feat(meta-000)` — META layer scaffolded and separated from DEV. No reflections yet.

## meta-001 — 2026-06-01: README verification gap

**Trigger:** README review session where the agent repeatedly wrote false claims about the
codebase without reading source files first. Operator had to point out problems three times.

**Root failure:** `readme-craft` skill listed "Pull truth from code" as a soft principle in
its Principles section — easy to skip under conversational pressure (operator just described
the state, so the agent trusted it and wrote it down).

**Specific failures observed:**
- "Global styles" section described `tailwind-input.css` and `prebuild-css` Nx target —
  neither exists; `styles.css` is the committed source file processed by Angular's PostCSS.
- Signal store described as `WritableSignal<Map<employeeId, EmployeeSession>>` — the store
  had been refactored to track only `EditingItem | null`; the README reflected the old ADR.
- Test counts wrong for data-access (11 vs actual 30) and feature+UI (~40 vs actual 53).
- ADR table listed only 4 entries; 7+ ADRs exist in `docs/adr/`.

**Pattern:** Agent trusted operator's verbal description and conversation context instead of
reading files. Operator memory lagged code refactors.

**Fix applied:** Added a mandatory "Verification before writing" pre-step to
`readme-craft/SKILL.md` — explicit checklist (ADRs, test counts, architecture, file paths,
operator-provided facts) that must be completed before drafting any section.
Also saved a persistent feedback memory: `verify-before-writing-docs`.
