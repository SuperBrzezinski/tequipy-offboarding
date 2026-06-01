# Rubric Map — Pre-submission Red-Team Audit

**Date:** 2026-06-01 (updated after final implementation)
**Auditor:** independent rubric-alignment pass (read-only; no code written)  
**Checks run:** `pnpm nx run-many --target=test --all` · `pnpm nx run-many --target=lint --all` · `NX_SKIP_SYNC_CHECK=true pnpm nx build shell` · grep for TODO/FIXME/console.log/any

---

## 1. Dimension → Evidence table

| Rubric dimension | Evidenced where | Confidence |
|---|---|---|
| **Component design** — smart/presentational split, state placement, lib boundaries | `OffboardingStore` is the sole injectable state owner; `OffboardingSessionPageComponent` is the only component that calls it; every dumb component uses `input()`/`output()` with no store injection. `@nx/enforce-module-boundaries` `depConstraints` mechanically prevents boundary violations — confirmed clean by `nx lint`. Nested lib split: `offboarding-feature` (feature), `offboarding-feature/domain` (domain), `offboarding-feature/data-access` (data-access). | High — the pattern holds end-to-end and is lint-enforced. |
| **TypeScript** — strict mode, discriminated unions, no `any`, no loose casts | `tsconfig.base.json`: `strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. `ItemStatus` and `ReturnCondition` are string union types in `domain/src/lib/types.ts`. `CONDITION_SEVERITY` is `Record<ReturnCondition, number>`. `assertNever` in `condition.ts` provides exhaustiveness checking in `suggest-note.ts`. Zero `any` in app source files (grep confirmed). | High — strict throughout; no suppression hides a real type hole. |
| **UX judgement** — edge cases (empty, error, loading, completed read-only, condition downgrade, open-issues dialog, unsaved-changes guard) | **Loading:** employee list shows `<p-skeleton>` rows; session page shows `aria-busy="true"` text while resource loads. **Empty (no equipment):** `EquipmentRowComponent` renders an empty-state message. **Error:** both pages show `role=alert` error + Retry button. **Completed read-only:** `readOnly` input propagates to all rows; action buttons absent; `SummaryPanelComponent` shows completed banner with `<time>` timestamp. **Condition downgrade:** `onConfirmReturn` calls `isConditionWorse`, shows PrimeNG `ConfirmDialog` before committing. **Open-issues soft confirm:** `onComplete` lists item names + notes in the dialog. **Unsaved-changes guard:** `canDeactivateSession` guard reads `store.isDirty()`, surfaces a confirmation dialog before navigating away — tested in `offboarding-session.guard.spec.ts`. | High — all 7 UX edge cases fully implemented. |
| **Code clarity** — naming, lint config, no dead code, no unexplained comments | ESLint: `@nx/enforce-module-boundaries` (error), `@angular-eslint/prefer-on-push-component-change-detection` (error), `no-restricted-imports` on domain lib (error). Prettier configured (confirmed by zero lint errors). Naming is consistent: `beginReturn`/`confirmReturn`/`cancelReturn`/`undoReturn` form a matching verb set. No dead imports, no dead component files. | High — clean throughout. |
| **Test reasoning** — tests that catch real bugs, tests that explain why | **Domain (54 tests):** `predicates.spec.ts` covers `canComplete` with empty array, all-Pending, partial notes, whitespace-only notes — each labelled with the business rule it protects. `condition.spec.ts` tests all 9 condition pairs. `suggest-note.spec.ts` includes content spot-checks so the test would fail if the template map were wired wrong. **Data-access (30 tests):** `offboarding.repository.spec.ts` tests all state transitions, reference isolation, and rejection contracts. `offboarding.store.spec.ts` tests guard-level transitions including `Issue → Returned` double-transition and `isDirty` going false after `completeOffboarding`. **Component integration (53 tests):** Angular Testing Library queries by role — tests survive refactors and test observable behaviour. Session page spec captures the full accept-callback path for the condition-downgrade dialog, verifying that the item stays Pending until the modal is explicitly accepted. Guard spec verifies `isDirty` path via Observable. | High — tests explain the why, cover boundary cases, and include content-level spot checks that would catch wiring mistakes. |
| **AI tooling** — evidence of deliberate use, not blind generation | README "AI tooling note" and WALKTHROUGH section 6 document: which decisions were human-owned vs AI-assisted, and name the specific course-corrections (repository-as-source-of-truth refactor, Tailwind v4 PostCSS config). ADR-0003 explicitly distinguishes the template implementation from a real LLM call. The `.claude/` + `agent/` layer is present in the repo as a durable artifact. | High — the evidence is specific, self-critical, and artifact-backed. |

---

## 2. Gaps

### CRITICAL

None. All hard functional requirements from the spec compile, test green, and are architecturally sound.

### RESOLVED before submission

**G1 — Navigation guard (isDirty warning)** — Resolved. `canDeactivateSession` guard wired to `offboarding/:employeeId` route via `canDeactivate: [canDeactivateSession]` in `offboarding-feature.routes.ts`. Guard reads `store.isDirty()` and surfaces a PrimeNG `ConfirmDialog` with Leave/Stay options. Covered by `offboarding-session.guard.spec.ts` (4 tests).

### NITS

**N1 — `employee-list-page.component.ts` defines a local `formatDate` method** instead of importing the shared `../utils/format-date` utility. Used by the offboarding-date column only. Minor DRY gap; no functional impact.

**N2 — ADR-0004 component tree sketch is slightly stale.** ADR-0004 lists `CompleteOffboardingDialogComponent` and `NoteFieldComponent` as separate components in `libs/ui/`. These were not extracted as standalone components — the dialog is handled by PrimeNG's `ConfirmDialog` wired in `OffboardingSessionPageComponent`, and the note field is inline in `EquipmentRowComponent`. The architecture as built is arguably cleaner, but ADR-0004 is explicitly superseded by ADR-0006, so reviewers following the chain will land on the current description.

---

## 3. CI/build checks

| Check | Result |
|---|---|
| `pnpm nx run-many --target=test --all` | **137 tests, all pass** (54 domain + 30 data-access + 53 feature/UI) |
| `pnpm nx run-many --target=lint --all` | **Pass** — 0 errors, 0 warnings |
| `NX_SKIP_SYNC_CHECK=true pnpm nx build shell` | **Pass** — feature chunk lazy-loaded as expected |
| `TODO` / `FIXME` / `console.log` in app source | **None found** |
| `: any` / `as any` in app source | **None found** |

---

## 4. Verdict

**Submission-ready.** All functional requirements are implemented and tested. The navigation guard (G1) is wired. No critical gaps remain.
