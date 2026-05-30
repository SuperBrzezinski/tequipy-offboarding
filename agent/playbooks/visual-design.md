# Playbook — Visual design (dos & donts)

Consulted by `ui-designer` and `frontend-engineer`. **Aesthetic = restraint.** The goal is
clean, modern, considered — a UI a senior team would ship — *not* flourish. If a visual
element doesn't improve clarity or trust, it doesn't earn its place. The role grades
implementation fidelity and pixel-level quality, so "tidy enough" is the floor, not the goal.

## Tokens first (no magic values)

- Define a **spacing scale** (e.g. 4 / 8 / 12 / 16 / 24 / 32) and use only those steps. A
  consistent rhythm is 80% of "looks professional".
- Define a **type scale** (a handful of sizes/weights, one font family + a mono for serials).
  Headings, body, captions — no more.
- Define **colour roles**, not colours: surface, surface-muted, border, text, text-muted,
  primary, plus semantic success/warning/danger. Map them to the **PrimeNG theme preset**
  (`providePrimeNG({ theme })`). Change a token, not a component's CSS.
- Radius + elevation: pick one or two values each and stick to them.
- **DON'T** hard-code hex/px in component styles — that's debt; flag it in review.

## Hierarchy & layout

- One clear **primary action per screen** (here: "Complete offboarding"). It is the *only*
  filled/high-emphasis button visible; everything else is secondary/tertiary. Ambiguity about
  "what do I click" is a design failure.
- Establish hierarchy with **space, size, and weight** before reaching for colour or borders.
- Generous whitespace; align to a grid; left-align text and numbers consistently (serials in
  mono read cleanly). Limit line length for readable text.
- Group related things (an equipment row's identity vs its action vs its status) with
  proximity, not boxes-within-boxes.

## State is design (the part juniors skip)

Every view must look intentional in **all** its states, not just "populated and happy":

- **Empty** — employee with no equipment, or none selected yet: a calm, explanatory empty
  state, not a blank void.
- **Loading** — skeletons or a quiet spinner; never layout that jumps when data arrives.
- **Populated** — the normal case.
- **Error** — data failed to load: a clear, recoverable message, not a stack trace.
- **Disabled** — the guarded Complete button looks disabled *and* says why (tooltip/help
  text), so the admin isn't left guessing.
- **Success/confirmation** — completion state reads as a satisfying, unambiguous "done".

Status (Pending/Returned/Issue) and condition-diff must be legible **without colour alone** —
pair colour with a label/icon (accessibility + clarity). See `component-design.md` for a11y.

## Modern, quietly

- Flat, soft surfaces; subtle borders or a hint of elevation to separate planes — not heavy
  shadows. Rounded corners consistent with the token. Comfortable density for a data table.
- Motion only where it clarifies (a gentle state transition, a toast) — **no** decorative
  animation, parallax, or gradients-for-gradient's-sake.
- Responsive: usable from a narrow laptop to wide; the table degrades gracefully (stack or
  scroll, not crush). Test at a couple of widths.

## Donts (the "AI slop" tells to avoid)

Purple-to-blue gradients · emoji as UI icons · three competing accent colours · every card with
a drop shadow · inconsistent spacing/radius · centered body text · multiple primary buttons ·
decorative hero imagery on an internal tool · animations that delay the admin. These read as
generated, not designed.

## README line to earn

> A small token system (spacing/type/colour roles via the PrimeNG theme) drives a deliberately
> restrained UI; every view is designed for its empty, loading, error and disabled states, not
> just the happy path.
