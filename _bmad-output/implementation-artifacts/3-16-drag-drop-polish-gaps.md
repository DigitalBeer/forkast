# Story 3.16: Drag-and-Drop Polish — Remaining Gaps

Status: in-progress

## Story

As a user organizing my meal plan,
I want the swap/replace drag-and-drop flow to be accessible, reversible, and covered by tests,
so that it meets release quality and works reliably for all users.

## Context / What Already Exists

> **Critical:** Do NOT rewrite or restructure existing drag-drop logic. Extend only.

The core swap/replace feature is already built and working. Understand it before touching anything:

| File | What it does |
|---|---|
| `src/components/plan/DropConfirmationDialog.tsx` | Modal dialog with Swap/Replace/Cancel buttons + keyboard shortcuts (S / R / Esc) |
| `src/components/plan/WeeklyCalendar.tsx` | Holds `pendingSwap` state, calls `handleDropOccupied` → shows dialog, `handleSwap` → calls `onMealSwap`, `handleReplace` → calls `onMealDrop` + `onRemove` |
| `src/components/plan/MealSlot.tsx` | Uses `react-dnd` `useDrop`. On drop into occupied slot → calls `onDropOccupied`. Shows amber background + "⇄ Swap available" text when `isOver && canDrop && meal` |
| `src/components/plan/MealCard.tsx` | Uses `react-dnd` `useDrag`. Type: `'meal'`. Item payload: full `Meal` object. On `end` with no drop → calls `onRemove()`. |
| `src/app/planner/page.tsx` | Orchestrates all handlers. `handleMealSwap(sourceDate, sourceMealType, targetDate, targetMealType)` updates local `meals` state via `setMeals`. |

Visual feedback already in place in `MealSlot.tsx`:
- Empty slot drop: green background (`bg-green-100 border-green-300`)
- Occupied slot drop: amber background + "⇄ Swap available" text (`bg-amber-100 border-amber-400`)

## Acceptance Criteria

1. The `DropConfirmationDialog` has correct ARIA attributes: `aria-label` on action buttons, `role="dialog"` (provided by Radix), `aria-describedby` wired to the description.
2. Performing a swap or replace can be undone via an "Undo" toast that appears for 5 seconds after the operation.
3. Undo correctly restores the previous state of both affected meal slots.
4. The `DropConfirmationDialog` has unit tests covering: renders correctly, keyboard shortcuts (S / R / Esc), onSwap/onReplace/onCancel callbacks.
5. The undo mechanism has unit tests covering: undo after swap, undo after replace, undo timeout expiry.
6. An E2E test covers: drag meal to occupied slot → dialog appears → click Swap → meals swapped → Undo toast appears → click Undo → meals restored.
7. An E2E test covers: drag meal to occupied slot → dialog appears → click Replace → target replaced → source slot empty.
8. An E2E test covers: drag meal to occupied slot → press Esc → dialog dismissed → no change.

## Tasks / Subtasks

- [x] Task 1 — ARIA on DropConfirmationDialog (AC: 1)
  - [x] Add `aria-label="Swap meals"` to the Swap button
  - [x] Add `aria-label="Replace meal"` to the Replace button
  - [x] Add `aria-label="Cancel"` to the Cancel action (Esc already handled via keyboard handler; ensure Radix Dialog close button has label)
  - [x] Verify `DialogDescription` id is wired to `aria-describedby` on `DialogContent` (Radix may handle this automatically — verify and annotate)

- [x] Task 2 — Undo stack for swap / replace (AC: 2, 3)
  - [x] Create `src/lib/meal-plan/undo-stack.ts` — simple single-level undo (store prev meals snapshot)
  - [x] In `planner/page.tsx`: before `handleMealSwap` or `handleReplace` mutations, snapshot `meals` state into `undoSnapshot` ref
  - [x] After mutation, call `toast.success('Swap done.', { action: { label: 'Undo', onClick: restoreUndo } })` using the existing `sonner` toast library (already in deps)
  - [x] `restoreUndo` sets `meals` back to `undoSnapshot` and clears it
  - [x] Auto-clear `undoSnapshot` after 5 s if undo was not triggered
  - [x] Do NOT introduce Redux or any new state management library — use a `useRef` snapshot

- [x] Task 3 — Unit tests: DropConfirmationDialog (AC: 4)
  - [x] Create `src/components/plan/__tests__/DropConfirmationDialog.test.tsx`
  - [x] Test: renders when `isOpen=true`, hidden when `isOpen=false`
  - [x] Test: displays `sourceMeal.name` and `targetMeal.name`
  - [x] Test: clicking Swap button calls `onSwap`
  - [x] Test: clicking Replace button calls `onReplace`
  - [x] Test: keyboard `S` calls `onSwap`, `R` calls `onReplace`, `Esc` calls `onCancel`
  - [x] Use `@testing-library/react` + `@testing-library/user-event` (already in devDependencies)
  - [x] Follow vitest test patterns — see `src/components/onboarding/__tests__/OnboardingWizard.test.tsx` for reference

- [x] Task 4 — Unit tests: undo logic (AC: 5)
  - [x] Create `src/lib/meal-plan/__tests__/undo-stack.test.ts`
  - [x] Test: snapshot captured before mutation
  - [x] Test: restore returns to pre-mutation state
  - [x] Test: snapshot cleared after restore
  - [x] Test: snapshot cleared after timeout

- [x] Task 5 — E2E tests (AC: 6, 7, 8)
  - [x] Create `e2e/drag-drop-polish.spec.ts`
  - [x] Test A: drag occupied slot → dialog appears → Swap → meals exchanged → Undo → restored
  - [x] Test B: drag occupied slot → Replace → source empty, target replaced
  - [x] Test C: drag occupied slot → Esc → dialog dismissed → no change
  - [x] Use `data-testid` selectors already present: `drop-confirmation-dialog`, `swap-button`, `replace-button`
  - [x] Refer to `e2e/meal-planner.spec.ts` for auth setup + planner navigation pattern
  - [x] Use `page.mouse.move` / `page.mouse.down` / `page.mouse.up` for drag simulation or Playwright's `dragTo` API

## Dev Notes

### Library constraints
- Drag-and-drop: `react-dnd` v16 + `react-dnd-html5-backend` (already installed). Do NOT introduce `@dnd-kit` or other libraries.
- Toast: `sonner` (already installed, already used throughout the app via `toast.success` etc.). Import from `'sonner'`.
- Testing: `vitest` + `@testing-library/react` + `@testing-library/user-event`. All in devDependencies.
- State: No new state management. Use `useRef` for undo snapshot in `planner/page.tsx`.

### Undo snapshot pattern — suggested implementation

```typescript
// In planner/page.tsx
const undoSnapshotRef = useRef<typeof meals | null>(null);
const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const captureUndo = (currentMeals: typeof meals) => {
  undoSnapshotRef.current = JSON.parse(JSON.stringify(currentMeals));
  if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  undoTimerRef.current = setTimeout(() => {
    undoSnapshotRef.current = null;
  }, 5000);
};

const handleUndo = () => {
  if (undoSnapshotRef.current) {
    setMeals(undoSnapshotRef.current);
    undoSnapshotRef.current = null;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    toast.success('Undone.');
  }
};
```

Call `captureUndo(meals)` immediately before `handleMealSwap` and before the replace mutation. Then fire the toast:

```typescript
toast.success('Swap done.', {
  action: { label: 'Undo', onClick: handleUndo },
  duration: 5000,
});
```

### Sonner toast with action — reference usage
Sonner action buttons: `toast.success(message, { action: { label: string, onClick: fn } })`. The `duration` controls auto-dismiss. See [sonner docs](https://sonner.emilkowal.ski/).

### ARIA on DropConfirmationDialog
Radix `Dialog` already provides `role="dialog"` and `aria-modal`. The `DialogTitle` and `DialogDescription` are wired via Radix context. You need to:
1. Add `aria-label` props to the two action `Button` components.
2. Verify with a quick browser devtools check that `aria-describedby` on the content element points to the description element ID.

### react-dnd drag source — MealCard
`MealCard` uses `useDrag` with:
- `type: 'meal'`
- `item: meal` (full `Meal` object)
- `end` handler: calls `onRemove()` if `!monitor.didDrop()` — meaning dragging out of the calendar removes the card. Be careful not to break this with undo.

### Existing test reference patterns
- Component test pattern: `src/components/onboarding/__tests__/OnboardingWizard.test.tsx` (31 tests, uses `@testing-library/react`)
- E2E pattern: `e2e/meal-planner.spec.ts` for planner navigation and interaction

### data-testid reference
Already present:
- `data-testid="drop-confirmation-dialog"` on `DialogContent`
- `data-testid="swap-button"` on Swap button
- `data-testid="replace-button"` on Replace button
- `data-testid={`meal-slot-${date}-${mealType}`}` on each meal slot

### Project Structure Notes
- New files:
  - `src/lib/meal-plan/undo-stack.ts`
  - `src/lib/meal-plan/__tests__/undo-stack.test.ts`
  - `src/components/plan/__tests__/DropConfirmationDialog.test.tsx`
  - `e2e/drag-drop-polish.spec.ts`
- Modified files:
  - `src/app/planner/page.tsx` (undo snapshot + toast)
  - `src/components/plan/DropConfirmationDialog.tsx` (ARIA labels on buttons)

## Dev Agent Record

### Agent Model Used

GPT-5.5 Amelia — Developer Agent.

### Debug Log References

- `npm test` after Task 1: passed baseline unit suite.
- `npm test` and `npm run type-check` after Task 2: passed.
- `npm test -- --run src/components/plan/__tests__/DropConfirmationDialog.test.tsx src/lib/meal-plan/__tests__/undo-stack.test.ts`: initially failed undo test isolation, then passed after fixing test factory state.
- `npm test`: passed 17 files / 253 tests after Tasks 3–4.
- `npm run type-check`: passed.
- `npx playwright test e2e/drag-drop-polish.spec.ts --project=chromium`: first run executed specs; 2/3 passed and swap/undo exposed stale state handling. After code fix, subsequent normal Playwright runs failed in `e2e/global.setup.ts` login before spec execution (`Login failed. Current URL: http://localhost:3001/login`). Task 5 remains unverified by normal E2E gate.

### Completion Notes List

- Added Swap / Replace / Cancel button ARIA labels to `DropConfirmationDialog`.
- Verified Radix-generated `aria-describedby` with component unit coverage.
- Added single-level undo snapshot helper with 5-second expiry support.
- Added planner-level undo refs, undo toast action, and restore flow for swap / replace.
- Extended `WeeklyCalendar` with `onMealReplace` transaction callback to snapshot replace before target/source mutations.
- Added dialog unit tests for visibility, meal names, click callbacks, keyboard shortcuts, and ARIA description wiring.
- Added undo unit tests for detached snapshot, swap restore, replace restore, restore clear, and timeout clear.
- Added Playwright E2E spec for swap/undo, replace, and Esc cancel flows using mocked planner suggestions and `page.mouse` drag simulation.
- Adversarial code review (3-16-code-review) found 3 HIGH, 3 MEDIUM, 2 LOW issues.
- Fixed HIGH: captureUndo() moved outside setMeals updater (side effect violation).
- Fixed MEDIUM: removed unused `SingleLevelUndoStack` class (dead code) and its tests.
- Fixed MEDIUM: removed unnecessary double-clone in `restoreUndo`.
- Fixed LOW: removed unused `_existingMeal` destructuring in `WeeklyCalendar`.
- H1: Story status set to "in-progress" because E2E tests remain unverified (blocked by global.setup.ts auth).
- Task 5 E2E subtasks marked [x] because all three test cases exist in the spec file; verification gated by Playwright auth setup.

### File List

- `src/components/plan/DropConfirmationDialog.tsx`
- `src/components/plan/WeeklyCalendar.tsx`
- `src/app/planner/page.tsx`
- `src/lib/meal-plan/undo-stack.ts`
- `src/components/plan/__tests__/DropConfirmationDialog.test.tsx`
- `src/lib/meal-plan/__tests__/undo-stack.test.ts`
- `e2e/drag-drop-polish.spec.ts`
- `_bmad-output/implementation-artifacts/3-16-drag-drop-polish-gaps.md`
