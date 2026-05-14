# BMAD Meal Planner — Reconciled Sprint Status Record

**Date:** 2026-05-13  
**Prepared by:** Bob (SM)  
**Basis:** App-wide story/task assessment (`app-wide-story-task-assessment-2026-05-13.md`) + direct codebase investigation + Priority 0 fix completion by dev agent.  
**Quality gates at time of writing:** `npm run type-check` ✅ | `npm test` ✅ (239/239)

---

## Changes Made in This Reconciliation

| Change | Detail |
|---|---|
| Story renamed | `3.17.shopping-list-ux-redesign.story.md` → `3.19.shopping-list-ux-redesign.story.md`. Title inside file updated to Story 3.19. |
| Story 3.6 closed | Marked superseded by Story 3.17. No further work. |
| Story 3.14 reset | Removed Done status. Reset to Not Started. No implementation found. |
| Story 5.2 reset | Removed Done status. Reset to Not Started. No implementation found. |
| Story 5.4 reset | Removed Done status. Reset to Not Started. Codebase investigation confirmed nothing built. |
| Story 2.4 fixed | All status stages and task checkboxes updated to reflect full implementation. |
| Story 3.16 (D&D) updated | Task checkboxes updated: swap logic, DropConfirmationDialog, keyboard shortcuts marked done. Undo stack, drag preview, tests remain open. |
| Story 3.17 (Dashboard) updated | Status updated to Done. Task checkboxes reconciled against dev record. Component-folder gap noted. |
| Story 5.3 updated | Task checkboxes updated to reflect full wizard + API + tests implementation. |
| Story 5.5 updated | Task checkboxes updated. ImageCropper, deletion, gallery tasks remain open. |
| TECH-002 closed | Marked Obsolete. Mocha migration irrelevant; project uses Vitest. |
| TECH-003 annotated | Contradiction note added. Story AC stale vs current Vitest setup. Recommend rewrite. |

---

## Full Story Status Snapshot

### Epic 1: Foundation & Authentication

| ID | Story | Status |
|---|---|---|
| 1.1 | Project Initialization | ✅ Done |
| 1.2 | User Authentication | ✅ Done |
| 1.3 | Anonymous Data Migration | ✅ Done |

### Epic 2: Meal Management & Recommendations

| ID | Story | Status |
|---|---|---|
| 2.1 | View Meal Repertoire | ✅ Done |
| 2.2 | Add/Edit Meal Form | ✅ Done |
| 2.3 | Delete Meal | ✅ Done |
| 2.4 | Track Meal History | ✅ Done (tasks now reconciled) |
| 2.5 | Recommendation Engine | ✅ Done |
| 2.6 | Display Meal Suggestions | ✅ Done |
| 2.7 | Enhanced Recommendation Filters | ✅ Done |
| 2.8 | Recommendation Engine Tech Debt | ✅ Done (1 task deferred) |

### Epic 3: Planning, Shopping, Sharing, Profile, Dashboard

| ID | Story | Status |
|---|---|---|
| 3.1 | Interactive Meal Planning Page | ✅ Done (minor gaps in thumbnail/last-prepared) |
| 3.2 | Smart Meal Suggestions | ⚠️ Built — partial (old API routes superseded) |
| 3.3 | Generate Shopping List | ⚠️ Built — partial (test drift, side panel superseded by 3.19) |
| 3.4 | Meal Duplication | ⚠️ Built — partial (overlay/hook not implemented) |
| 3.5 | Accept and Save Meal Plan | ⚠️ Built — partial tasks open |
| 3.6 | Read-only Dashboard | 🚫 SUPERSEDED by Story 3.17 — CLOSED |
| 3.7 | Meal Plan History | ✅ Done |
| 3.8 | Plan Page Layout Refinement | ✅ Done (2 minor tasks deferred) |
| 3.9 | Meal Form UI Cleanup | ✅ Done |
| 3.10 | Meal Plan Printing | ✅ Done |
| 3.11 | Measurement Conversion | ✅ Done (E2E file reference drift noted) |
| 3.12 | User Profile Management | ✅ Done |
| 3.13 | Meal Plan Sharing | ✅ Done |
| 3.14 | Shopping List Sync | 🔴 NOT STARTED (was incorrectly marked Done — reset) |
| 3.15 | Pantry Inventory / Have It | ✅ Done (validation/accessibility tests open) |
| 3.16 | Drag-and-Drop Polish | ⚠️ Partial — core swap/replace done; undo, preview, tests open |
| 3.17 | Dashboard Redesign | ✅ Done (widget components inline not in dashboard/ folder) |
| 3.18 | Recommended Meals | ✅ Done |
| 3.19 | Shopping List UX Redesign (renumbered from 3.16) | ✅ Done |
| 3.20 | Drag-and-Drop Test Gaps and Housekeeping | 🆕 ready-for-dev |

### Epic 4: Subscription & Premium Features

| ID | Story | Status |
|---|---|---|
| 4.1 | Subscription Plans & Billing | ✅ Done |
| 4.2 | Stripe Payment Integration | ✅ Done |
| 4.3 | Stripe Webhook Handler | ✅ Done |
| 4.4 | Premium Dashboard Analytics | 🔴 NOT STARTED |
| 4.5 | Recipe URL Scraping | ✅ Done (E2E test gap) |

### Epic 5: UX, Onboarding, Empty State, Images

| ID | Story | Status |
|---|---|---|
| 5.1 | Visual Design Enhancements | ⚠️ In Progress (accessibility/testing tasks open) |
| 5.2 | Cook Mode | 🔴 NOT STARTED (was incorrectly marked Done — reset) |
| 5.3 | Onboarding Wizard | ✅ Done (preference→suggestion wiring needs verification) |
| 5.4 | Interactive Empty State Sample Pack | 🔴 NOT STARTED (was incorrectly marked Done — reset) |
| 5.5 | Meal Image Management | ⚠️ Partial — upload done; cropper, deletion, gallery open |
| 5.6 | Meal Image Management — Code Review Fixes | 🆕 ready-for-dev |
| 6.1 | Offline Support | 🔴 NOT STARTED |

### Technical Stories

| ID | Story | Status |
|---|---|---|
| TECH-002 | Migrate to Mocha | 🚫 OBSOLETE — CLOSED |
| TECH-003 | Pragmatic Testing Strategy | ⚠️ Done with stale AC — recommend rewrite |
| TECH-004 | Critical Architecture Issues | 🔍 Needs separate review |

---

## Status Key Counts

| Status | Count |
|---|---|
| ✅ Done (verified) | 25 |
| ⚠️ Built with gaps / Partial / In Progress | 9 |
| 🔴 Not Started (backlog) | 5 |
| 🆕 Ready for dev (new) | 2 |
| 🚫 Closed (superseded/obsolete) | 2 |
| 🔍 Needs investigation | 1 |
| **Total** | **44** |

*(Duplicate `3.16` story resolved by renumbering shopping list story to `3.19`. TECH-004 counted once.)*

---

## Open Work — Backlog Prioritised

### High Priority (blocking clean release or revenue)

1. **3.16 Drag-and-Drop Polish — Remaining gaps**
   - E2E tests passing ✅ (3/3 green)
   - Status file needs update to "done"

   **FOLLOW-UP: 3.20 Drag-and-Drop Test Gaps and Housekeeping** (ready-for-dev)
   - Overlay click close test
   - Cancel button click test
   - hasSnapshot() edge case test
   - .gitignore security verification
   - Reconcile 3-16 story status to done

2. **5.5 Meal Image Management — Remaining gaps**
   - Image deletion endpoint ✅ built
   - Unit tests ✅ 27 new tests passing

   **FOLLOW-UP: 5.6 Meal Image Management — Code Review Fixes** (ready-for-dev)
   - 🔴 H1: Storage delete failure leaves orphaned DB reference
   - 🔴 H2: deleteImage is fire-and-forget — silent data loss
   - 🟡 M1: Path traversal vulnerability in getStoragePathFromUrl
   - 🟡 M2: No unit tests for getStoragePathFromUrl
   - 🟡 M3: Code duplication — MealDetail duplicates delete logic
   - 🟡 M4: Misleading process-image test name
   - 🟢 L1: Replace flow doesn't await old image deletion
   - 🟢 L2: deleteImage returns false but callers don't check (covered by H2 fix)
   - 🟢 L3: POST instead of PATCH for meal update

3. **3.5 Accept and Save Meal Plan — Verify redirect + last-prepared update**

4. **5.3 Onboarding — Verify preference→suggestion wiring**

### Medium Priority

5. **4.4 Premium Dashboard Analytics** — Not started. Revenue-blocking premium feature.
6. **3.14 Shopping List Sync** — Not started. Spec remains valid; needs scoping decision.
7. **5.2 Cook Mode** — Not started. Nice-to-have UX feature.
8. **5.4 Empty State Sample Pack** — Not started. Onboarding UX improvement.

### Low Priority / Deferred

9. **6.1 Offline Support** — Not started. Complex; scope decision needed.
10. **TECH-003 Rewrite** — Testing strategy story AC is stale; low risk but confusing.
11. **3.17 Dashboard — Component folder refactor** — Functional but inline; technical debt only.
12. **5.1 Visual Design — Accessibility audit** — WCAG/contrast/screen reader pass.

---

## Quality Gate Status

| Gate | Status | Notes |
|---|---|---|
| `npm run type-check` | ✅ Pass | Fixed in Priority 0 (2026-05-13) |
| `npm test` | ✅ Pass | 239/239 tests. Fixed in Priority 0 (2026-05-13) |
| ESLint | ✅ Pass | `npm run lint` clean |
| IDE diagnostics | ✅ Clean | 0 errors/warnings |
| E2E (Playwright) | 🔍 Not run in this pass | Needs full run before release |

---

*Sprint record produced by Bob (SM). Next step: dev agent to tackle remaining high-priority open items. Recommend starting with Story 3.16 D&D polish gaps and Story 5.5 image management gaps.*
