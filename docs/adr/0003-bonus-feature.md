# ADR-0003 — Bonus feature selection

- **Status:** Accepted
- **Date:** 2026-05-30
- **Deciders:** orchestrator + it-admin-domain-expert + operator
- **Mode:** dev
- **Tags:** ux, scope, ai-tooling

## Context

The task spec invites one bonus feature from: AI-assisted note, condition diff, optimistic
UI, keyboard navigation. Time box is 2–6h total; we have already spent ~0.5h on
discovery/spec. We must pick the combination that maximises assessment signal within the
remaining budget.

The assessment rubric explicitly scores "AI tooling" as a dimension. The role is Founding
Frontend Engineer at an AI-first product company. The bonus therefore needs to demonstrate
AI integration awareness, not just frontend craft.

## Decision

**Primary bonus:** AI-assisted note — a "Suggest note" button on the issue-note field.
Implemented as a local template engine (`suggestNote(type, condition) → string`) in the
domain layer. No LLM API call required for the core; the function signature is designed as a
named extension point for a real LLM call (Claude API) if time allows.

**Secondary bonus:** Condition diff visual — a badge/chip on any item whose `returnCondition`
differs from `assignedCondition`, showing "Was: Good → Now: Damaged" with a warning colour
token when condition has worsened.

## Rationale

**AI note wins on signal:** Demonstrates AI-integration thinking (the "Suggest" pattern,
prompt-like inputs, editable suggestions) without requiring a live API key or network. The
template approach is honest about the implementation; claiming a real LLM call we didn't
make would be worse than a well-reasoned template. The extension-point design shows
architectural awareness.

**Condition diff is low-cost, high-UX-signal:** Takes < 30 min to implement, embeds
naturally in the item row, and directly surfaces a real admin risk (charging an employee
for undeclared damage). It demonstrates UX judgement, not just code volume.

**Optimistic UI ruled out:** Adds complexity (rollback, error handling, loading state
coordination) without a real async layer to justify it. Would be over-engineering in a
mock-data SPA.

**Keyboard navigation ruled out:** Risk of under-delivery under time pressure. Focus
management on dialogs is already a quality bar; full keyboard navigation would dilute effort
from higher-signal work.

## Consequences

- **Positive:** AI dimension of rubric is directly addressed. Condition diff is essentially
  free (derived from existing data). Both bonuses integrate cleanly into existing flows.
- **Negative / cost:** The `suggestNote` function requires a template per item-type ×
  condition combination. Must be comprehensive for the mock dataset — a partially-covered
  template engine looks worse than no bonus.
- **Follow-ups:** `suggestNote` lives in `libs/domain`; export it as a pure function for
  easy unit testing. Document the LLM extension point in the README's "What's next" section.

## Alternatives considered

- **Optimistic UI:** Higher implementation risk, no real async layer to showcase against. Ruled out.
- **Keyboard navigation:** A11y signal is already covered by WCAG 2.1 AA baseline; full
  nav is high-effort for marginal extra signal. Ruled out.
- **Real LLM call (Claude API) as core:** Requires API key management + network in a
  frontend-only SPA. Adds complexity and a runtime dependency. The template approach is
  more honest and equally demonstrates the pattern. Ruled out as core; retained as
  extension point.

## README line

> The bonus "AI-assisted note" feature uses a local template engine to suggest issue notes based on device type and condition — designed as an extension point for a real LLM call, demonstrating AI integration awareness without runtime API dependencies.
