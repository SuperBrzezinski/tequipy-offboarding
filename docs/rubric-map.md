# Rubric Map — Pre-submission Red-Team Audit

**Date:** 2026-05-30  
**Auditor:** independent rubric-alignment pass (read-only; no code written)  
**Checks run:** `pnpm nx run-many --target=test --all` · `pnpm nx run-many --target=lint --all` · `NX_SKIP_SYNC_CHECK=true pnpm nx build offboarding-shell` · grep for TODO/FIXME/console.log/any

---

## 1. Dimension → Evidence table

| Rubric dimension | Evidenced where | Confidence |
|---|---|---|
| **Component design** — smart/presentational split, state placement, lib boundaries | `OffboardingStore` is the sole injectable state owner; `OffboardingSessionPageComponent` is the only component that calls it (feature-offboarding, line 38); every `libs/ui/` component uses `input()`/`output()` with no store injection. `@nx/enforce-module-boundaries` `depConstraints` (root `eslint.config.mjs`) mechanically prevents boundary violations — confirmed clean by `nx lint`. Four-lib split: `domain / data-access / feature-offboarding / ui`. | High — the pattern holds end-to-end and is lint-enforced. |
| **TypeScript** — strict mode, discriminated unions, no `any`, no loose casts | `tsconfig.base.json`: `strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. `ItemStatus` and `ReturnCondition` are string union types in `libs/domain/src/lib/types.ts`. `CONDITION_SEVERITY` is `Record<ReturnCondition, number>` (`constants.ts:3`). `assertNever` in `condition.ts:4` provides exhaustiveness checking in `suggest-note.ts:53`. Zero `any` in app source files (grep confirmed). Four `eslint-disable @typescript-eslint/no-unused-vars` suppressions in `offboarding.store.ts:187–203` for intentionally unused `_employeeId`/`_itemId` params — each has a comment explaining the symmetric API contract; no suppression hides a real type hole. | High — strict throughout; the suppressions are justified and visible. |
| **UX judgement** — edge cases (empty, error, loading, completed read-only, condition downgrade, open-issues dialog) | **Loading:** employee list shows 3 `<p-skeleton>` cards (`employee-list-page.component.html:9`); session page shows `aria-busy="true"` text while resource loads (`offboarding-session-page.component.html:8`). **Empty (no equipment):** `EquipmentListComponent` renders "No equipment assigned to this employee" (`equipment-row.component.spec.ts:336–343` tests it). **Error:** both list and session pages show role=alert error message + Retry button. **Completed read-only:** `readOnly` input propagates to all rows; action buttons absent; `SummaryPanelComponent` replaces the button panel with a completed banner and `<time>` timestamp. **Condition downgrade:** `onConfirmReturn` in smart page (`offboarding-session-page.component.ts:172`) calls `isConditionWorse`, shows a PrimeNG ConfirmDialog before committing. **Open-issues soft confirm:** `onComplete` (`line 140`) lists item names + notes in the dialog, HTML-escaped. **isDirty computed signal** is implemented and exposed; however the navigation-away warning from spec Flow A ("unsaved changes warning when navigating to a different employee") is **not wired** — see Gaps. | Medium-High — 6 of 7 UX edge cases fully implemented; 1 (nav guard) is a gap. |
| **Code clarity** — naming, lint config, no dead code, no unexplained comments | ESLint: `@nx/enforce-module-boundaries` (error), `@angular-eslint/prefer-on-push-component-change-detection` (error), `no-restricted-imports` on domain lib (error). Prettier configured (confirmed by zero lint errors). `pnpm nx run-many --target=lint --all` passes with 0 errors (3 warnings in `offboarding.store.spec.ts:324,442,447` — non-null assertions in test helpers; low risk). Naming is consistent: `beginReturn`/`confirmReturn`/`cancelReturn`/`undoReturn` form a matching verb set. No dead imports, no dead component files. Comments throughout the store explain _why_ decisions were made, not just what the code does (`offboarding.store.ts:27–26`, `beginReturn:111`, `cancelReturn:184`). | High — clean throughout. The 3 warnings in spec files are a nit. |
| **Test reasoning** — tests that catch real bugs, tests that explain why | **Domain (54 tests):** `predicates.spec.ts` covers `canComplete` with empty array, all-Pending, partial notes, whitespace-only notes — each labelled with the business rule it protects. `condition.spec.ts` tests all 9 condition pairs. `suggest-note.spec.ts` includes content spot-checks (`contains('inspect before reassignment')`) so the test would fail if the template map were wired wrong. **Store (26 tests):** `offboarding.store.spec.ts:110–125` tests idempotency of `loadSession` — catching a navigation-back regression that would silently reset an admin's work. `offboarding.store.spec.ts:169–189` tests `Issue → Returned` double-transition — catching a guard bug that only appears on the second action. `offboarding.store.spec.ts:366–381` tests that `isDirty` goes false even when `completeOffboarding` is called while an edit panel is open. **Component integration (40 tests in ui, 48 in feature-offboarding):** Angular Testing Library queries by role and aria-label — tests survive refactors, test observable behavior. `offboarding-session-page.component.spec.ts:120–138` captures the full accept-callback path for the condition-downgrade dialog, verifying that the item stays Pending until the modal is explicitly accepted. `equipment-row.component.spec.ts:220–238` tests the effect that clears local state when `isEditing` flips to false — catching a stale-state bug if the effect were removed. | High — tests explain the why, cover boundary cases, and include content-level spot checks that would catch wiring mistakes. |
| **AI tooling** — evidence of deliberate use, not blind generation | README "AI tooling note" section documents: which decisions were human-owned vs AI-generated, names the specific course-correction made to `isDirty` semantics (initial draft would have triggered false navigation warnings), and states that every code increment went through an independent code-review sub-agent pass. The `.claude/` + `agent/` layer is present in the repo as a durable artifact. ADR-0003 explicitly distinguishes the template implementation from a claimed real LLM call ("honest about the implementation"). | High — the evidence is specific, self-critical, and artifact-backed. Not just claimed. |

---

## 2. Gaps — skeptical reviewer findings

### CRITICAL

None. All hard functional requirements from the spec compile, test green, and are architecturally sound.

### SHOULD-FIX

**G1 — Navigation guard (isDirty warning) not wired — Severity: should-fix**

Spec Flow A (spec.md line 177): "Given `session.isDirty === true`… When admin clicks a different employee… Then an unsaved-changes warning is shown." The store exposes `isDirty` correctly (`offboarding.store.ts:43`) and the README claims this feature. However, `employee-list-page.component.ts:23` calls `router.navigate` directly with no `isDirty` check, no ConfirmDialog, and there is no `canDeactivate` guard on the `offboarding/:employeeId` route (`app.routes.ts`). A senior reviewer who walks through the app will immediately notice they can navigate away from an open note field with no warning — the opposite of what the spec and README both describe.

**Fix options (choose one):**
- Add a `canDeactivate: [() => inject(OffboardingStore).isDirty() ? confirm('Discard?') : true]` function guard to the `offboarding/:employeeId` route in `app.routes.ts`. This covers the browser-back case too.
- Or: on `OffboardingSessionPageComponent`, intercept the `goBack()` call — but this does not cover all navigation paths.

The store already has everything needed; the wiring is a ~10-line addition.

**G2 — Session page loading state is text-only, no skeleton — Severity: should-fix (nit-adjacent)**

The employee list page uses `<p-skeleton>` cards during load (good). The session page shows `"Loading…"` plain text (`offboarding-session-page.component.html:8`). The spec (§4, Flow G) says "Skeleton / spinner; no content flicker". This is a minor visual inconsistency that a detail-oriented reviewer will catch.

### NITS

**N1 — Three `@typescript-eslint/no-non-null-assertion` warnings in `offboarding.store.spec.ts:324,442,447`**

Lint passes, but warnings are visible. Lines 442/447 could use the already-present `assertSession()` helper (defined at line 12 of the same file) instead of `!`. Cosmetic but inconsistent with the file's own pattern.

**N2 — `eslint-disable @typescript-eslint/no-unused-vars` on cancel methods**

`offboarding.store.ts:187–203`: `cancelReturn` and `cancelIssue` take `_employeeId` and `_itemId` purely for signature symmetry. The rationale is clear from the comment. An alternative is to remove the parameters (the current callers pass them but neither is used). As-is, the suppressions are visible and explained — not a code smell, just worth noting.

**N3 — `formatDate` is duplicated in two places**

`employee-list-page.component.ts:27` defines a local `formatDate` that is nearly identical to the exported `formatDate` in `libs/ui/src/lib/utils/format-date.ts`. The session page correctly uses the shared one. A reviewer looking for DRY violations will spot this.

**N4 — ADR-0004 component tree sketch is slightly stale**

ADR-0004 (architecture.md line 146–153) lists `CompleteOffboardingDialogComponent` and `NoteFieldComponent` as separate components in `libs/ui/`. These were not extracted as standalone components — the dialog is handled by PrimeNG's `ConfirmDialog` wired directly in `OffboardingSessionPageComponent`, and the note field is inline in `EquipmentRowComponent`. The architecture as built is arguably cleaner, but the ADR reads like it promises components that don't exist. A reviewer cross-referencing the ADR against the code will see the discrepancy.

**N5 — `suggestNote` tests verify non-empty output but not all content spot-checks cover downgrade path**

`suggest-note.spec.ts` has 3 content spot-checks but they all test the `Damaged` or `Missing accessories` templates, not that the `Good` fallback ("No visible damage") is correctly distinct. Minor coverage gap — not a functional risk.

---

## 3. CI/build checks

| Check | Result |
|---|---|
| `pnpm nx run-many --target=test --all` | **155 tests, all pass** (54 domain + 12 data-access + 40 ui + 48 feature-offboarding + 1 shell) |
| `pnpm nx run-many --target=lint --all` | **Pass** — 0 errors, 3 warnings (non-null assertions in spec file only) |
| `NX_SKIP_SYNC_CHECK=true pnpm nx build offboarding-shell` | **Pass** — initial bundle 428 kB / 98 kB gzipped; feature chunk lazy-loaded as expected |
| `TODO` / `FIXME` / `console.log` in app source | **None found** |
| `: any` / `as any` in app source | **None found** (one false-positive hit was in a comment) |

---

## 4. Verdict

**Fix G1 (navigation guard wiring) before sending.** The infrastructure is built — `isDirty` is computed, documented, and tested in the store. The 10-line route guard to consume it is absent. Given that the README and spec both describe this feature, a reviewer who demos the app and notices the missing behavior will reasonably question whether other described features are also partially implemented.

G2 (session page loading skeleton) is a visible-but-minor polish gap; fix if < 15 minutes remain.

Everything else (N1–N5) is submission-acceptable — all nits, none would reduce a rubric score.

**Once G1 is fixed: submission-ready.**
