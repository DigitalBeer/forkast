# BMAD Meal Planner - App-wide Story & Task Assessment

**Date:** 2026-05-13  
**Prepared by:** Bob, Scrum Master  
**Scope:** Full `docs/stories` inventory plus implementation evidence from `src`, `supabase`, `e2e`, `tests`, and quality gates.  
**Purpose:** Establish the true state of features built, omitted, partially implemented, or requiring further investigation, broken down by story and task area.

---

## 1. Executive Summary

The project has substantial implementation across core meal management, meal planning, sharing, profile management, subscription/Stripe, recipe scraping, onboarding, image upload, pantry/staples, and shopping list UX.

However, the repo is **not currently production-clean** because CLI quality gates fail:

- `npm run type-check` fails with **7 TypeScript errors** across 4 files.
- `npm test` fails with **1 failed test** out of 239 tests.
- IDE diagnostics reported clean, but CLI validation is authoritative for release readiness.

The main project risk is not lack of implementation everywhere. The main risk is **documentation/status drift**:

1. Some stories are marked `Done` while task checklists remain entirely or partially unchecked.
2. Some stories are not marked `Done` but implementation exists.
3. Some story IDs conflict or duplicate intent, especially around `3.16` / `3.17` shopping-list and drag/drop work.
4. The testing strategy story says legacy test frameworks were removed, but the project currently uses Vitest and has many unit tests.
5. Several features are built enough to exist, but acceptance-level verification is incomplete or failing.

Recommended immediate action: fix the failing quality gates, then run a targeted story-status reconciliation pass before starting new feature work.

---

## 2. Evidence Collected

### 2.1 Story Inventory

Found **44 story files** in `docs/stories`:

- Epic 1 foundation/auth stories
- Epic 2 meal management/recommendation stories
- Epic 3 planning, shopping, sharing, dashboard, profile stories
- Epic 4 subscription/payment/premium stories
- Epic 5 UX/design/onboarding/image stories
- Epic 6 offline support
- Technical stories TECH-002 through TECH-004

### 2.2 Implementation Evidence Areas Checked

Checked implementation evidence in:

- `src/app`
- `src/components`
- `src/lib`
- `src/hooks`
- `src/store`
- `supabase/migrations`
- `supabase/functions`
- `e2e`
- `tests`
- `package.json`

### 2.3 Quality Gate Evidence

`npm run type-check` failed:

| File | Issue Summary |
|---|---|
| `src/app/api/shared/[token]/route.ts` | Shared route accesses `ingredients` and `instructions` on an inferred meal type that does not include those fields. |
| `src/app/page.tsx` | `user` prop is unused and typed through `ReturnType<typeof useAuthStore>['user']`, which currently resolves from `unknown`. |
| `src/app/shared/[token]/page.tsx` | `meal.ingredients` is `unknown`, not assignable to `ReactNode`. |
| `src/components/shopping/MealGroupedView.tsx` | `_items` prop is destructured but not present on props type and unused. |

`npm test` failed:

| Test File | Failed Test |
|---|---|
| `src/lib/data/adapters.test.ts` | `SupabaseAdapter — image upload > should handle image upload during upsert` expects upload path `mock-uuid_photo.jpg`, but implementation uploads to `user-1/mock-uuid.jpg`. |

---

## 3. App-wide Status Classification

Legend:

- **Verified Built**: implementation exists and story/task evidence mostly aligns.
- **Built with Gaps**: implementation exists, but tasks/checks/tests are incomplete or quality gates fail.
- **Status Contradiction**: story status says one thing, task or implementation evidence says another.
- **Omitted / Not Built**: no meaningful implementation evidence found.
- **Needs Investigation**: implementation exists, but behavior cannot be confirmed without targeted runtime/E2E checks.

| Story | Declared Status Evidence | Assessed State | Reason |
|---|---:|---|---|
| 1.1 Project Initialization | Done, 1 unchecked auth setup task | Built with Gaps | Core project exists; unchecked auth task was intentionally deferred to 1.2. Type-check now failing, so foundation quality is not fully clean. |
| 1.2 User Authentication | Done | Verified Built | Auth pages/components/store/middleware exist; E2E auth spec exists. |
| 1.3 Anonymous Data Migration | Done / tasks complete | Needs Investigation | Migration implementation exists in `src/lib/migration/anonymousDataMigration.ts`; verify current signup/onboarding flow still triggers it correctly. |
| 2.1 View Meal Repertoire | Done / tasks complete | Verified Built | `/meals` page and meal card ecosystem exist. |
| 2.2 Add/Edit Meal Form | Done / tasks complete | Verified Built | Meal form exists and is used by add/edit routes. |
| 2.3 Delete Meal | Done / tasks complete | Verified Built | Meal actions and confirmation flow exist. |
| 2.4 Track Meal History | Done but all tasks unchecked | Status Contradiction | Migration and service/test evidence exists, but the story checklist is stale and says all tasks are open. |
| 2.5 Meal Recommendation Engine | Done | Built with Gaps | Recommendation engine/API/function evidence exists; referenced `src/lib/redis.ts` and `src/lib/recommendations/types.ts` are absent, likely superseded. |
| 2.6 Display Meal Suggestions | Done | Verified Built | Suggestion components and E2E spec exist. |
| 2.7 Enhanced Recommendation Filters | Done but weak task evidence | Needs Investigation | Feature likely folded into recommendation/suggestion service; story lacks clear task traceability. |
| 2.8 Recommendation Engine Refactor | Mostly complete, 1 unchecked task | Built with Gaps | Needs confirmation of remaining unchecked technical debt. |
| 3.1 Interactive Meal Planning Page | Done but 4 unchecked tasks | Built with Gaps | Planner exists, but story checklist still has thumbnail/last-prepared-related gaps. Route changed from `/plan` to `/planner`. |
| 3.2 Smart Meal Suggestions | Not Done, partial tasks | Built with Gaps | Suggestion components/function/migrations exist; expected old API routes are missing/superseded. |
| 3.3 Generate Shopping List | Not Done / unclear tasks | Built with Gaps | `ShoppingList.tsx`, aggregation, API route, and docs exist; older expected tests/components missing or superseded. |
| 3.4 Meal Duplication | Not Done, partial tasks | Built with Gaps | Duplicate handling appears in planner/calendar, but expected `DuplicationOverlay` and `useMealDuplication` are missing. |
| 3.5 Accept and Save Meal Plan | Not Done, partial tasks | Built with Gaps | Save plan button/API/table evidence exists, but story task list is not fully complete. |
| 3.6 Read-only Dashboard | Not Done, partial tasks | Superseded / Built with Gaps | Dashboard exists but has been superseded by 3.17 redesign. |
| 3.7 Meal Plan History | Done | Verified Built | History route/components/tests exist. |
| 3.8 Plan Page Layout Refinement | Done but 2 unchecked tasks | Built with Gaps | Layout exists; remaining task checkboxes need reconciliation. |
| 3.9 Meal Form UI Cleanup | Done | Verified Built | Single save-button cleanup verified by story and form evidence. |
| 3.10 Meal Plan Printing | Done | Verified Built | `PrintableMealPlan.tsx` and E2E print spec exist. |
| 3.11 Measurement Conversion | Done | Built with Gaps | Conversion utilities/components exist; referenced `e2e/shopping-list.spec.ts` is missing but likely replaced by shopping-list full-page tests. |
| 3.12 User Profile Management | Done | Built with Gaps | Profile UI/preferences/email flow/migration/tests exist; verify no overlap conflict with 5.3 onboarding preferences. |
| 3.13 Meal Plan Sharing | Done | Built with Gaps | Sharing endpoints/page/modal/migration exist, but current type-check errors directly affect shared-plan route/page. |
| 3.14 Shopping List Sync | Done but 25 unchecked tasks | Status Contradiction / Mostly Omitted | Dedicated planId sync endpoints and DB table are absent. Only generic shopping list API exists. Treat as not implemented until proven otherwise. |
| 3.15 Pantry Inventory / Have It | Done with 6 unchecked tasks | Built with Gaps | Staples API/migration/components/hooks exist; remaining API/integration/accessibility tests are unchecked. |
| 3.16 Drag-and-Drop Polish | Done but 28 unchecked tasks | Status Contradiction / Built with Gaps | `DropConfirmationDialog.tsx` and planner swap handlers exist, but story checklist is entirely stale. Need behavior/E2E verification for undo, keyboard, accessibility. |
| 3.16 Shopping List UX Redesign | Done, implementation record complete | Built with Gaps | Full-page route/components exist; current type-check error in `MealGroupedView.tsx` blocks clean release. Story numbering conflicts with drag/drop story. |
| 3.17 Dashboard Redesign | In Progress, 39 unchecked tasks | Status Contradiction / Built with Gaps | Dashboard rewrite exists per dev record, but checkboxes were not updated. Needs task reconciliation and type-check fix in dashboard page. |
| 3.18 Recommended Meals | Done | Needs Investigation | API routes/function/dismissals migration exist; dashboard widget evidence not fully verified in this pass. |
| 4.1 Subscription Plans & Billing | Done | Verified Built | `/pricing` exists and Stripe checkout CTA is wired. |
| 4.2 Stripe Payment Integration | Done | Verified Built | Checkout/portal endpoints and account UI exist. |
| 4.3 Stripe Webhook Handler | Done | Verified Built | Webhook route exists with signature handling story evidence. |
| 4.4 Premium Dashboard Analytics | Not Done, all tasks unchecked | Omitted / Not Built | No `src/app/api/analytics` or `src/components/analytics` evidence found. Only marketing/account text references analytics. |
| 4.5 Recipe URL Scraping | Done, 1 unchecked E2E task | Built with Gaps | Scraping service/parsers/API/modal/tests exist; E2E import flow remains unchecked. |
| 5.1 Visual Design Enhancements | In Progress, partial tasks | Built with Gaps | Design/theme/icon work exists; accessibility/browser/responsive verification tasks remain unchecked. |
| 5.2 Cook Mode | Done in status block? task list all unchecked; no code evidence | Status Contradiction / Omitted | No `CookMode`, `useWakeLock`, or cook-mode matches found in `src`. Treat as not built. |
| 5.3 Onboarding Wizard | Done but 32 unchecked tasks | Status Contradiction / Built with Gaps | Components, preferences API, migration, E2E/unit tests exist, but task checklist is stale. Needs route-flow verification and status reconciliation. |
| 5.4 Interactive Empty State Sample Pack | Done in visible story status? tasks all unchecked; no code evidence | Omitted / Not Built | No sample pack data/components/API found. |
| 5.5 Meal Image Management | Done but tasks unchecked | Built with Gaps | Upload route, image utilities, upload component, migration, and E2E exist. Unit test currently failing due path expectation mismatch. |
| 6.1 Offline Support | Draft only | Omitted / Not Built | No service worker/offline IndexedDB/sync evidence found. |
| TECH-002 Mocha Migration | Not Done | Needs Decision | Current project uses Vitest, so this story may be obsolete. |
| TECH-003 Pragmatic Testing Strategy | Done but contradicted by repo | Status Contradiction | Story says Vitest/Jest/Mocha removed, but `vitest.config.ts`, Vitest deps, and unit tests exist. Decide whether to close as obsolete or rewrite. |
| TECH-004 Critical Architecture Issues | Not fully assessed | Needs Investigation | Needs separate architecture review; not enough evidence gathered in this pass. |

---

## 4. Story-by-Story Task Assessment

### Epic 1: Foundation & Authentication

#### Story 1.1 - Project Initialization & Static Landing Page

**Task state:** Mostly complete. One setup task remains unchecked: basic authentication configuration.  
**True state:** Built, with the unchecked auth task correctly handled by Story 1.2.  
**Further work:** Re-run type-check after fixes. Update story note to explain auth was completed under Story 1.2.

#### Story 1.2 - User Authentication System

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Run targeted auth E2E before release; verify password reset and protected-route behavior against current middleware.

#### Story 1.3 - Anonymous Data Migration on Sign-up

**Task state:** Complete in story inventory.  
**True state:** Implementation exists.  
**Further work:** Verify current signup + onboarding sequence does not bypass localStorage migration; add/refresh E2E if absent.

---

### Epic 2: Meal Management & Recommendations

#### Story 2.1 - View Meal Repertoire Page

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Verify image placeholder/upload changes from Story 5.5 still render correctly in meal cards.

#### Story 2.2 - Add/Edit Meal Form

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Regression-test with recipe scraping and image upload enabled, because both modify MealForm.

#### Story 2.3 - Delete Meal

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Verify deletion behavior with Supabase RLS and ownership constraints.

#### Story 2.4 - Track Detailed Meal History

**Task state:** All tasks unchecked despite story marked Done.  
**True state:** Status contradiction. Some implementation/test evidence exists, but story artifact is stale.  
**Further work:** Audit actual history coverage: table migration, service, API, view/add/plan/cooked/skipped events, RLS. Then update tasks truthfully.

#### Story 2.5 - Meal Recommendation Engine

**Task state:** Appears complete, with some referenced files missing/superseded.  
**True state:** Built with gaps.  
**Further work:** Confirm current engine uses intended architecture; remove stale Redis/type references or create missing abstractions if still required.

#### Story 2.6 - Display Meal Suggestions

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Verify suggestions still work from `/planner` after route restructuring.

#### Story 2.7 - Enhance Recommendation Logic with Filters

**Task state:** Weak traceability.  
**True state:** Needs investigation.  
**Further work:** Confirm filters exist in UI/API and document exact files/tasks.

#### Story 2.8 - Recommendation Engine Technical Debt Refactor

**Task state:** Mostly complete, one unchecked task.  
**True state:** Built with a remaining gap.  
**Further work:** Identify and close the remaining technical-debt task or explicitly defer it.

---

### Epic 3: Meal Planning, Shopping, Profile, Sharing, Dashboard

#### Story 3.1 - Interactive Meal Planning Page

**Task state:** Mostly complete, but some meal card and save-related tasks remain unchecked.  
**True state:** Built with gaps.  
**Further work:** Verify thumbnails, last-prepared updates, and save side effects. Update route references from `/plan` to `/planner` where relevant.

#### Story 3.2 - Smart Meal Suggestions

**Task state:** Partial.  
**True state:** Built with gaps / possibly superseded implementation.  
**Further work:** Reconcile old expected API routes with current recommendation endpoint/function. Verify E2E path.

#### Story 3.3 - Generate Shopping List

**Task state:** Story task traceability weak.  
**True state:** Built with gaps.  
**Further work:** Confirm whether older side-panel shopping list is deprecated by full-page shopping list. Update story and tests accordingly.

#### Story 3.4 - Meal Duplication

**Task state:** Partial.  
**True state:** Built with gaps.  
**Further work:** Confirm duplication behavior exists without the originally proposed overlay/hook. Add or update E2E.

#### Story 3.5 - Accept and Save Meal Plan

**Task state:** Partial.  
**True state:** Built with gaps.  
**Further work:** Verify plan persistence, redirect behavior, and last-prepared date updates.

#### Story 3.6 - Read-only Dashboard

**Task state:** Partial and likely superseded.  
**True state:** Superseded by dashboard redesign.  
**Further work:** Close or archive this story with a superseded note pointing to 3.17.

#### Story 3.7 - Meal Plan History

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Verify history navigation after `/plan`/`/planner` route split.

#### Story 3.8 - Plan Page Layout Refinement

**Task state:** Mostly complete, two unchecked tasks.  
**True state:** Built with gaps.  
**Further work:** Resolve remaining layout/polish tasks or defer explicitly.

#### Story 3.9 - Meal Form UI Cleanup

**Task state:** Complete.  
**True state:** Built.  
**Further work:** None beyond normal regression coverage.

#### Story 3.10 - Meal Plan Printing

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Verify print styles after dashboard/plan page redesign.

#### Story 3.11 - Measurement Conversion

**Task state:** Complete in story, but one referenced E2E file is absent.  
**True state:** Built with test artifact drift.  
**Further work:** Confirm current E2E coverage lives under another spec; update file references.

#### Story 3.12 - User Profile Management

**Task state:** Complete.  
**True state:** Built with overlap risk.  
**Further work:** Verify preference columns do not conflict with onboarding preference migration. Confirm email update verification behavior manually/E2E.

#### Story 3.13 - Meal Plan Sharing

**Task state:** Complete.  
**True state:** Built but currently broken by type-check errors.  
**Further work:** Fix shared route/page typing. Then run meal sharing E2E, especially anonymous shared page access and revoke behavior.

#### Story 3.14 - Shopping List Sync for Authenticated Users

**Task state:** All tasks unchecked, while story status says Done.  
**True state:** Not implemented as specified.  
**Further work:** Create `shopping_list_items` migration, plan-specific sync endpoints, migration endpoint, realtime/offline logic, and tests—or downgrade story status from Done.

#### Story 3.15 - Pantry Inventory / Have It Check

**Task state:** Core tasks checked; several test/performance/accessibility tasks unchecked.  
**True state:** Built with validation gaps.  
**Further work:** Add API integration tests, large-list test, and accessibility/screen-reader verification.

#### Story 3.16 - Drag-and-Drop Polish

**Task state:** All tasks unchecked, but implementation files exist.  
**True state:** Status contradiction. Built partially or fully, but unverified.  
**Further work:** Verify swap/replace prompt, default swap behavior, replace behavior, visual feedback, keyboard access, and undo. Story claims undo, but evidence for undo stack was not confirmed.

#### Story 3.16 - Shopping List UX Redesign

**Task state:** Dev record says complete.  
**True state:** Built with type-check blocker.  
**Further work:** Fix `MealGroupedView` prop typing, run shopping-list full-page E2E, and resolve duplicate/conflicting story number.

#### Story 3.17 - Dashboard Redesign with Widgets

**Task state:** Story is In Progress with all tasks unchecked, but dev record says many items implemented.  
**True state:** Status contradiction / built with gaps.  
**Further work:** Update task checkboxes to match actual implementation. Fix `src/app/page.tsx` type errors. Verify widget coverage and empty-state behavior.

#### Story 3.18 - Recommended Meals Based on Similar Users

**Task state:** Complete.  
**True state:** Needs investigation.  
**Further work:** Confirm dashboard widget file/evidence and run recommendation display/dismiss/add-to-repertoire flows. API/function evidence exists.

---

### Epic 4: Subscription & Premium Features

#### Story 4.1 - Subscription Plans & Billing

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Verify Premium CTA behavior with current Stripe env/config.

#### Story 4.2 - Stripe Payment Integration

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Verify checkout and portal behavior in test mode.

#### Story 4.3 - Stripe Webhook Handler

**Task state:** Complete.  
**True state:** Built.  
**Further work:** Run webhook signature and event mapping tests if not recently run.

#### Story 4.4 - Premium Dashboard Analytics

**Task state:** All tasks unchecked.  
**True state:** Omitted / not built.  
**Further work:** Build analytics API, calculations, chart components, premium gating, teaser for free users, and tests.

#### Story 4.5 - Recipe URL Scraping

**Task state:** All but E2E import flow complete.  
**True state:** Built with test gap.  
**Further work:** Add E2E for premium/free import flow and verify source URL attribution persistence.

---

### Epic 5: UX, Onboarding, Empty State, Images

#### Story 5.1 - Visual Design Enhancements

**Task state:** Partially complete.  
**True state:** Built with accessibility/test gaps.  
**Further work:** Complete design token documentation, contrast testing, WCAG audit, screen-reader pass, responsive and cross-browser checks.

#### Story 5.2 - Cook Mode

**Task state:** All tasks unchecked.  
**True state:** Omitted / not built.  
**Further work:** Build CookMode component, wake lock hook, meal detail integration, keyboard exit, accessibility, and tests—or downgrade story status.

#### Story 5.3 - Onboarding Taste Profile Wizard

**Task state:** All tasks unchecked, but implementation exists.  
**True state:** Status contradiction / built with gaps.  
**Further work:** Update story tasks, verify signup trigger, skip/complete-later behavior, preference saving, and suggestion filtering.

#### Story 5.4 - Interactive Empty State Sample Pack

**Task state:** All tasks unchecked.  
**True state:** Omitted / not built.  
**Further work:** Build sample data, import API, modal/components, `is_sample` persistence, and once-only import guard.

#### Story 5.5 - Meal Image Management

**Task state:** Story checkboxes stale; dev record says implemented.  
**True state:** Built with failing test.  
**Further work:** Resolve image upload test expectation vs implementation path. Verify crop/resize requirements: upload exists, but cropper evidence was not confirmed.

---

### Epic 6: Offline & Reliability

#### Story 6.1 - Offline Support

**Task state:** Draft only; all tasks unchecked.  
**True state:** Omitted / not built.  
**Further work:** Build service worker, IndexedDB offline cache, queue/sync system, offline indicator, shopping-list offline toggles, and tests.

---

### Technical Stories

#### TECH-002 - Migrate to Mocha

**Task state:** Not done.  
**True state:** Likely obsolete.  
**Further work:** Decide whether to delete/close as superseded. The current project uses Vitest.

#### TECH-003 - Pragmatic Testing Strategy Migration

**Task state:** Mostly complete in story, but contradicted by repo.  
**True state:** Status contradiction.  
**Further work:** Rewrite or close as obsolete. Current repo uses Vitest, has `vitest.config.ts`, `npm test`, and many unit tests.

#### TECH-004 - Critical Architecture Issues

**Task state:** Not fully assessed in this review.  
**True state:** Needs separate architecture pass.  
**Further work:** Run dedicated architecture review after type-check/test fixes.

---

## 5. Highest-priority Further Work

### Priority 0 - Restore Quality Gate Health

1. Fix TypeScript errors in shared plan feature:
   - `src/app/api/shared/[token]/route.ts`
   - `src/app/shared/[token]/page.tsx`
2. Fix dashboard typing/unused prop:
   - `src/app/page.tsx`
3. Fix shopping list prop typing:
   - `src/components/shopping/MealGroupedView.tsx`
4. Fix failing image upload unit test or update expectation to match intended storage path:
   - `src/lib/data/adapters.test.ts`

### Priority 1 - Reconcile Dangerous Status Contradictions

These stories should not remain marked Done without task/evidence reconciliation:

- 2.4 Track Detailed Meal History
- 3.14 Shopping List Sync
- 3.16 Drag-and-Drop Polish
- 3.17 Dashboard Redesign
- 5.2 Cook Mode
- 5.3 Onboarding Wizard
- 5.5 Meal Image Management
- TECH-003 Testing Strategy

### Priority 2 - Confirm High-value Feature Behavior

Run targeted E2E/manual checks for:

- Meal plan sharing anonymous view + revoke flow
- Full-page shopping list route and print flow
- Drag/drop swap vs replace behavior
- Recipe URL import for premium/free users
- Onboarding wizard after signup and preference persistence
- Image upload/replace/delete flows
- Dashboard widget/empty-state behavior

### Priority 3 - Build Clearly Omitted Features if Still Desired

- 4.4 Premium Dashboard Analytics
- 5.2 Cook Mode
- 5.4 Empty State Sample Pack
- 6.1 Offline Support
- 3.14 Shopping List Sync, if still required as specified

---

## 6. Recommended Sprint Recovery Plan

### Step 1: Stabilization Story

Create a single sprint story: **“Restore build/test health and reconcile release blockers.”**

Acceptance criteria:

- `npm run type-check` passes.
- `npm test` passes.
- Current failing shared-plan, dashboard, shopping-list, and image-upload test issues are resolved.
- This report is linked from the sprint record.

### Step 2: Documentation Reconciliation Story

Create a story: **“Reconcile story statuses with implementation evidence.”**

Acceptance criteria:

- Every `Done` story has matching completed tasks or an explicit superseded/deferred note.
- Duplicate/conflicting Story 3.16 / 3.17 numbering is resolved.
- TECH-003 is rewritten or closed as obsolete.
- Omitted features are downgraded from Done where necessary.

### Step 3: Feature Verification Stories

Create focused verification/fix stories for:

1. Shared plan feature verification.
2. Shopping list UX and sync clarification.
3. Drag/drop swap/replace acceptance verification.
4. Onboarding/profile preference consolidation.
5. Image upload end-to-end verification.

---

## 7. Bottom Line

The app is significantly built, but the current status cannot be trusted from story checkboxes alone. The true state is:

- **Core app:** largely built.
- **Premium billing and recipe scraping:** mostly built.
- **Profile, sharing, image upload, onboarding, shopping UX:** built or partially built, but need verification and cleanup.
- **Analytics, cook mode, sample pack, offline support, shopping-list sync:** omitted or not implemented as specified.
- **Release readiness:** blocked until type-check and unit test failures are fixed.

Bob’s recommendation: do not start new feature implementation until the quality gate and story-status reconciliation work is complete.
