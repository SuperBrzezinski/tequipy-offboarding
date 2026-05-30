---
description: Create a new ADR (or supersede an existing one).
argument-hint: "<short decision title>"
---

Run the `adr` skill to record: $ARGUMENTS

Copy `docs/adr/0000-template.md` to the next number, fill Context→Decision→Rationale→
Consequences→Alternatives, set status, update `docs/adr/README.md` and
`agent/memory/decisions.md`, and write the one-line README summary. To supersede, add a new
ADR and mark the old one `Superseded by ADR-XXXX` (never rewrite).
