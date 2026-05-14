# Story 3.20: Drag-and-Drop Test Gaps and Housekeeping

Status: done

## Story

As a developer maintaining the drag-and-drop feature,
I want to close test coverage gaps and verify repository security hygiene,
so that the feature is fully tested and no secrets can be accidentally committed.

## Acceptance Criteria

1. `DropConfirmationDialog.test.tsx` includes a test for closing the dialog by clicking the overlay/backdrop.
2. `DropConfirmationDialog.test.tsx` includes a test for clicking the Cancel button (not just the Esc key).
3. `undo-stack.test.ts` includes a test for calling `restore()` when no snapshot exists (initial `hasSnapshot()` === false state).
4. `.gitignore` includes entries for `e2e/.auth/` and `.env` (or confirms they are already present).
5. Story file `3-16-drag-drop-polish-gaps.md` is updated to status "done".

## Tasks / Subtasks

- [x] Task 1 — Add overlay click close test (AC: 1)
- [x] Task 2 — Add Cancel button click test (AC: 2)
- [x] Task 3 — Add hasSnapshot edge case test (AC: 3)
- [x] Task 4 — Verify .gitignore security (AC: 4)
- [x] Task 5 — Update 3-16 story status (AC: 5)

## Dev Notes

### Radix Dialog overlay click testing
Radix's `Dialog` component renders an `Overlay` component that closes the dialog on click by default (`onInteractOutside` behavior). To test this:
- Query for the overlay by role or data attribute: `screen.getByRole('dialog')` or look for the Radix overlay element
- Alternatively, Radix renders an overlay `div` with `data-state="open"` that can be targeted
- The `onCancel` or `onOpenChange(false)` callback should fire when overlay is clicked

### Undo stack initial state
The `SingleLevelUndoStack` class in `src/lib/meal-plan/undo-stack.ts`:
- `capture(state)` stores a snapshot
- `restore()` returns the snapshot and clears it
- `hasSnapshot()` returns boolean indicating if a snapshot exists
- `clear()` removes the snapshot

On initial construction (before any `capture()` call), `hasSnapshot()` should return `false`. Calling `restore()` in this state should return `null` or throw — write the test to match whatever the actual implementation does.

### .gitignore patterns
Common patterns for Supabase/Next.js projects:
```
.env
.env.*
e2e/.auth/
```

The `e2e/.auth/` directory stores Playwright auth state JSON files containing session tokens. These should never be committed.

## Project Structure Notes

- Files to modify:
  - `src/components/plan/__tests__/DropConfirmationDialog.test.tsx` (add 2 tests)
  - `src/lib/meal-plan/__tests__/undo-stack.test.ts` (add 1 test)
  - `.gitignore` (verify/add entries)
  - `_bmad-output/implementation-artifacts/3-16-drag-drop-polish-gaps.md` (status update)

### References

- [Source: Code Review for Story 3-16] — Approve with minor recommendations
- [Source: `src/components/plan/__tests__/DropConfirmationDialog.test.tsx`] — Existing 9 unit tests
- [Source: `src/lib/meal-plan/__tests__/undo-stack.test.ts`] — Existing 5 unit tests
- [Source: `src/lib/meal-plan/undo-stack.ts`] — SingleLevelUndoStack class
- [Source: `src/components/plan/DropConfirmationDialog.tsx`] — Radix Dialog implementation

## Dev Agent Record

### Agent Model Used

Go: MiniMax M2.7 — Developer Agent.

### Debug Log References

- `npm test -- --run src/components/plan/__tests__/DropConfirmationDialog.test.tsx src/lib/meal-plan/__tests__/undo-stack.test.ts`: 18 tests passed (11 dialog + 7 undo-stack).
- `npm test -- --run`: 284 tests passed across 20 test files.

### Completion Notes List

- Added `clicking overlay/backdrop calls onCancel and closes dialog` test targeting Radix `[data-state="open"]` overlay element.
- Added `clicking Cancel button explicitly calls onCancel (not keyboard)` test — already existed but was duplicated, kept one clean version.
- Added `hasSnapshot returns false on initial state before any capture` and `restore returns null when no snapshot exists (initial state)` to undo-stack.test.ts.
- Added `e2e/.auth/` entry to `.gitignore` (`.env*` was already present).
- Updated `3-16-drag-drop-polish-gaps.md` Status: `in-progress` → `done`.
- Updated `3-20-drag-drop-test-gaps.md` Status: `ready-for-dev` → `done`.


### File List

- `src/components/plan/__tests__/DropConfirmationDialog.test.tsx`
- `src/lib/meal-plan/__tests__/undo-stack.test.ts`
- `.gitignore`
- `_bmad-output/implementation-artifacts/3-16-drag-drop-polish-gaps.md`
- `_bmad-output/implementation-artifacts/3-20-drag-drop-test-gaps.md`