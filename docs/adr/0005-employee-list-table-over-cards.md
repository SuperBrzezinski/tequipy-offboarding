# ADR-0005 — Employee list: p-table with sorting and filtering over card list

- **Status:** Accepted (supersedes implicit card-list decision from dev-008)
- **Date:** 2026-05-30
- **Deciders:** orchestrator + operator
- **Mode:** dev
- **Tags:** ux, architecture, scope

## Context

The initial employee list (shipped in dev-008) rendered employees as a vertically stacked
card list (`ul > li[role=button]`). The decision was made implicitly — no ADR exists for it.

During a post-completion review, the operator challenged the approach on three grounds:

1. **Scalability.** Real IT admin environments have 50–200+ employees. A card wall without
   any scan axis (columns, sort order) is slow to navigate at that scale.
2. **Workflow fit.** The primary admin task is "who is leaving soonest?" — sorting by
   offboarding date is a first-class need, not an edge case.
3. **Discoverability.** Finding a specific person requires visual scanning of every card;
   per-column filters on a table reduce this to a single keystroke per axis.

The card list was defensible for a 6-item demo but does not reflect production thinking.
Changing to a table demonstrates product maturity and domain awareness.

## Decision

Replace the card list with a PrimeNG `p-table` that has:
- Sortable columns: Name, Department, Offboarding Date, Status.
- Per-column filters in `filterDisplay="row"` mode (PrimeNG basic filters).
- Clickable rows navigating to `/offboarding/:id`.
- Default sort: Offboarding Date ascending (soonest first — matches admin workflow).

## Rationale

`p-table` is the right primitive when data has multiple scan axes and the user needs to
locate a specific record. The admin's mental model is "find + act", not "browse". Sorting
by date surfaces urgency; the filter handles name lookup. Clickable rows preserve the
single-action-per-row UX.

Cards remain defensible only at small, static, icon-heavy lists where visual identity
carries more weight than column structure — not applicable here.

PrimeNG's `p-table` provides sort, filter, pagination, and keyboard navigation out of the
box, so the implementation cost is low.

## Consequences

- **Positive:** scales to 100+ employees without UX degradation; default date sort matches
  real admin workflow; search eliminates manual scanning; column headers clarify data model.
- **Negative / cost:** skeleton loading state is harder to represent cleanly in a table
  (replaced with `p-skeleton` rows inside a table body); tests need updating to query by
  column header text and row cells rather than card roles.
- **Follow-ups:** update `EmployeeListPageComponent` template + TS + SCSS; update spec tests.

## Alternatives considered

- **Keep cards, add sort/filter externally** — a filter input above a card list is an
  anti-pattern (mixing paradigms); sort on cards has no visual anchor.
- **Keep cards, add pagination** — pagination without sort still forces date-blind navigation.

## README line

> Employee list uses `p-table` with sortable columns and per-column filters (`filterDisplay="row"`) — the default sort (offboarding date ascending) surfaces urgency without any interaction.
