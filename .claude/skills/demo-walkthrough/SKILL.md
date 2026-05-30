---
name: demo-walkthrough
description: >
  Produce the 3–5 minute recorded or written walkthrough required for submission. USE near the
  end, once the app runs. Builds a tight script that hits the highest-signal decisions for the
  reviewers and sets up the portfolio deep-dive. Spawn tech-writer.
---

# Demo walkthrough

Submission requires a 3–5 min Loom/Jam or a written walkthrough. Optimize every second for
signal: the reviewers are deciding whether to invite you to the 60-min deep-dive where you
"walk us through 2–3 of your best-built systems".

## Script (≈4 minutes)

1. **Framing (15s)** — what this is, the one constraint you optimized for (clarity + correct
   completion logic under a small time box).
2. **Happy path (45s)** — select employee → mark items returned → summary updates →
   Complete enables → confirmation. Show it feeling real.
3. **One edge case (30s)** — report an issue / a condition mismatch; show it's handled
   gracefully, not ignored. This is "UX judgement" on screen.
4. **Architecture (60s)** — the layers (presentation/application/domain/data), signals +
   the status **state-machine**, and that `@nx/enforce-module-boundaries` makes the layering
   *lintable*. Optionally show a boundary-violation lint error to prove it.
5. **The completion rule + a test (30s)** — show the predicate and the test that pins it.
   This pairs "TypeScript" + "Test reasoning" directly.
6. **The bonus (20s)** — what you chose and why it fit the AI-first product.
7. **AI-tooling honesty (20s)** — how you used AI, where you course-corrected. The role
   grades this; be specific and grounded.
8. **Close (10s)** — what you'd do next.

## Tips

- Rehearse once; cut filler. Show the running app and one passing test, not slides.
- Keep a written version too (some reviewers skim) — it doubles as deep-dive prep.
- Tie each beat back to a rubric dimension (use `rubric-map.md`).
