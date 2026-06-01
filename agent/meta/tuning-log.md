# Tuning log

Append-only record of concrete edits to skills/agents made in META mode and their effect.

## meta-001 — 2026-06-01

**File:** `.claude/skills/readme-craft/SKILL.md`
**Before:** "Pull truth from code" was a soft principle buried in the Principles section.
**After:** Added a mandatory "Verification before writing" section at the top of the
procedure — explicit checklist for ADRs, test counts, architecture source files, Nx targets,
and operator-provided facts. Framed as MUST-DO, not guidance.
**Expected effect:** Agent reads source files before making claims in documentation, instead
of relying on conversation context. Operator stops having to point out stale README content.
