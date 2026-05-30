# Active context

- **Project phase:** NOT STARTED — agent layer scaffolded, application not begun.
- **Mode:** dev
- **Active epic:** none
- **Last checkpoint:** agent layer COMPLETE (sub-agents, skills, commands, memory, META, playbooks, rubric-map).
- **Next action:** run the `discovery-session` skill with the operator to resolve ambiguous
  offboarding flows, *before* writing the spec. Do NOT scaffold code yet.

## Open questions to resolve in discovery
(seeded — confirm/expand with the operator)
- Can an employee be offboarded with an unrecovered ("Issue") item, or must everything reach
  a terminal state? What does "all items actioned" mean exactly?
- Is "Report an issue" a terminal status, or can an item move issue → returned later?
- Should returning a device in a worse condition than at assignment require confirmation?
- One employee at a time, or a queue? Re-selecting an employee mid-flow — keep or reset state?
- Which single bonus feature do we commit to? (recommendation: AI-assisted note.)

## Notes
Stack ratified in ADR-0001. Architecture ADR still pending (do it right after spec).
