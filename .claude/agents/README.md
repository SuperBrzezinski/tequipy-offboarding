# Sub-agents

The **orchestrator is the main thread** (driven by the root `CLAUDE.md`) — there is no
`orchestrator.md` here, because the orchestrator *is* the conversation you're in. It plans,
holds context discipline, owns checkpoints/commits, and **delegates specialist work** to the
sub-agents below. Sub-agents run in their own context, do one job well, and report a concise
summary back; they do not manage checkpoints and they do not spawn each other.

| Sub-agent | Owns | Writes to | Tools (least-privilege) |
|-----------|------|-----------|--------------------------|
| `solution-architect` | layering, state, boundaries, routing, perf; architecture ADRs | `docs/`, structural config | read/write + web |
| `frontend-engineer` | Angular 21 + TS features, components, stores, domain, data | `apps/`, `libs/` | read/write/edit/bash |
| `ui-designer` | visual layer & UX defense: hierarchy, spacing, tokens, states | tokens/theme, design notes | read/write/edit + web |
| `code-reviewer` | independent critical review vs the rubric | nothing (reports only) | **read-only** + bash |
| `qa-test-engineer` | test strategy + meaningful tests (Vitest) | `apps/`, `libs/` (tests) | read/write/edit/bash |
| `it-admin-domain-expert` | the user's voice; flows & edge cases | `docs/` | read/write + web |
| `tech-writer` | README, ADRs, walkthrough, rubric map | `docs/`, `README.md` | read/write/edit |
| `devex-engineer` | Nx, lint, format, hooks, commitlint, CI | config/tooling, workspace | read/write/edit/bash/web |

## Delegation rules of thumb

- **Before an epic:** `solution-architect` (structure) and, for any flow ambiguity,
  `it-admin-domain-expert` (UX reality) — *before* code.
- **During an epic:** `frontend-engineer` implements; `qa-test-engineer` covers what matters.
- **Any view:** set visual intent with `ui-designer` before building; `design-review` after.
- **Closing an increment:** spawn `code-reviewer` **fresh** on the diff; route fixes back to
  `frontend-engineer`; then the orchestrator checkpoints.
- **Setup & tooling:** `devex-engineer`.
- **Any doc:** `tech-writer`.

## Invariants every sub-agent respects

1. **Layer separation:** app code only in `apps/`/`libs/`; docs in `docs/`; never write into
   `agent/meta/` (that's META mode only).
2. **Strict TS, clean layers, owned AI output.**
3. **Critical, not compliant:** challenge proposals against layering, the rubric, and the
   2–6h time box; recommend; let the operator decide.
4. Report back briefly; the orchestrator integrates and owns the git checkpoint.
