# Active context

- **Project phase:** DISCOVERY COMPLETE — spec authoring is next.
- **Mode:** dev
- **Active epic:** none
- **Last checkpoint:** discovery session complete (2026-05-30). All key flow decisions confirmed by operator.
- **Next action:** run `spec-authoring` skill to write `docs/spec.md`. Then architecture ADR.

## Confirmed decisions (see docs/discovery.md for full log)
- Issue is resolvable (Issue → Returned allowed)
- Completion rule: no Pending items + every Issue has a non-empty note
- Complete with open Issues = allowed via soft-confirm dialog (not hard block)
- Condition downgrade = soft confirmation required
- Per-employee session state persists in-memory; unsaved changes warning on navigate away
- Required states: loading, empty-no-equipment, error-load-fail, completed-read-only
- Bonus: AI-assisted note (primary) + condition diff (secondary)

## ADRs to write
- ADR-0002: item state machine
- ADR-0003: bonus feature choice

## Notes
Stack ratified in ADR-0001. Architecture ADR still pending (do it right after spec).
