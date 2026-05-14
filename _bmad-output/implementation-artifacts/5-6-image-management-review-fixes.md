# Story 5.6: Meal Image Management — Code Review Fixes

Status: done

## Story

As a developer maintaining the meal image feature,
I want to fix security vulnerabilities, resilience gaps, and test coverage issues identified in code review,
so that image deletion is safe, storage is not polluted by orphaned files, and the codebase is well-tested.

## Acceptance Criteria

1. Deleting an image from MealDetail page only clears `image_url` in the DB if the Supabase storage delete succeeds — on failure, the image remains in the DB and a toast error is shown.
2. `deleteImage()` in MealImageUpload is awaited; on failure, a toast error is shown and the UI does not clear the image preview.
3. `getStoragePathFromUrl()` rejects paths containing `..` sequences, and the DELETE endpoint validates paths against traversal attacks.
4. Unit tests exist for `getStoragePathFromUrl()` covering: valid extraction, null on missing marker, rejection of `..` paths, and edge cases.
5. MealDetail page uses `useImageUpload` hook for delete logic instead of duplicating it inline.
6. The process-image "output is WebP format" test either accurately tests WebP conversion or is renamed to reflect actual behavior.
7. The replace flow in MealImageUpload awaits old image deletion (or handles it concurrently with proper error handling).
8. The meal image URL update uses PATCH (not POST) to `/api/meals`.

## Tasks / Subtasks

- [x] Task 1 — Fix storage delete resilience in MealDetail (AC: 1) [HIGH — H1]
- [x] Task 2 — Fix fire-and-forget delete in MealImageUpload (AC: 2) [HIGH — H2]
- [x] Task 3 — Fix path traversal vulnerability (AC: 3) [MEDIUM — M1]
- [x] Task 4 — Add unit tests for getStoragePathFromUrl (AC: 4) [MEDIUM — M2]
- [x] Task 5 — Refactor MealDetail to use useImageUpload hook (AC: 5) [MEDIUM — M3]
- [x] Task 6 — Fix misleading process-image test (AC: 6) [MEDIUM — M4]
- [x] Task 7 — Await old image deletion in replace flow (AC: 7) [LOW — L1]
- [x] Task 8 — Change meal image URL update to PATCH (AC: 8) [LOW — L3]

## Dev Notes

### H1 Fix Pattern — Only update DB on successful storage delete

Current pattern (buggy):

```typescript
await deleteImage(meal.image_url);  // fire-and-forget, may fail silently
await updateMeal(mealId, { image_url: null });  // always clears DB reference
```

Fixed pattern:

```typescript
const deleted = await deleteImage(meal.image_url);
if (!deleted) {
  toast.error("Failed to remove image from storage. Please try again.");
  return;  // Don't clear image_url in DB
}
await updateMeal(mealId, { image_url: null });
toast.success("Image removed");
```

### M1 Fix Pattern — Path traversal validation

In getStoragePathFromUrl():

```typescript
export function getStoragePathFromUrl(publicUrl: string): string | null {
  const marker = "/meal-images/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  const path = publicUrl.slice(idx + marker.length);
  // Path traversal protection
  if (path.includes("..")) return null;
  if (path.startsWith("/")) return null;
  return path;
}
```

In the DELETE endpoint, add server-side validation:

```typescript
// After extracting path from request body:
const normalizedPath = path.replace(/\/+/g, "/").replace(/\.\./g, "");
if (normalizedPath !== path) {
  return NextResponse.json({ error: "Invalid path" }, { status: 400 });
}
if (!path.startsWith(userId + "/")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### M3 Refactor — MealDetail using useImageUpload

Current pattern (duplicated):

```typescript
// In page.tsx — duplicated delete logic
const handleRemoveImage = async () => {
  setRemoving(true);
  const res = await fetch("/api/upload/meal-image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: getStoragePathFromUrl(meal.image_url) }),
  });
  // ...
};
```

Refactored pattern:

```typescript
// In page.tsx — use the hook
const { deleteImage } = useImageUpload();
const handleRemoveImage = async () => {
  setRemoving(true);
  const success = await deleteImage(meal.image_url);
  if (!success) { toast.error("..."); setRemoving(false); return; }
  // ... update meal API ...
};
```

### M4 — Process-image test fix

The test "output is WebP format" currently mocks canvas but doesn't verify WebP encoding. Either:
- Mock `toBlob` to return a blob with `type: 'image/webp'` and assert the output file type
- Or rename to "returns file from canvas processing" if the mock doesn't exercise the real conversion

### L3 — PATCH vs POST

Check `src/app/api/meals/route.ts` for the HTTP methods it handles. A `PATCH` handler was added alongside existing `GET` and `POST`. The MealDetail page now calls `PATCH /api/meals` with `{ id, image_url }` in the body. Note: there is **no** `[id]` dynamic route — the meal ID is passed in the request body.

**Important:** Only send fields that are actually being updated — omitting `name` from the PATCH body avoids a stale-overwrite race if another client changes the meal name between fetch and PATCH.

### Important: Do not break existing functionality

All current tests pass (280 tests after Story 5.5). Ensure no regressions:
- Run `npm test` after each task
- Run `npm run type-check` after changes
- The existing DELETE endpoint, upload flow, and meal detail page all work — only fix the identified issues

## Project Structure Notes

- New test files:
  - `src/hooks/__tests__/useImageUpload.test.ts`
  - `src/components/meals/MealImage.tsx` (image display component, extracted from MealCard)
- Modified files:
  - `src/app/meals/[id]/page.tsx` (H1 fix + M3 refactor + L3 PATCH)
  - `src/components/meals/MealImageUpload.tsx` (H2 fix + L1 await)
  - `src/components/meals/MealCard.tsx` (refactored to use MealImage component)
  - `src/hooks/useImageUpload.ts` (M1 path traversal, query-param stripping, empty-path guard)
  - `src/app/api/upload/meal-image/route.ts` (M1 server-side validation)
  - `src/lib/image/__tests__/process-image.test.ts` (M4 test fix)
  - `src/app/api/meals/route.ts` (L3 PATCH handler)

### References

- [Source: Code Review for Story 5-5] — Adversarial review with 9 findings (2 HIGH, 4 MEDIUM, 3 LOW)
- [Source: `src/app/meals/[id]/page.tsx`] — MealDetail with inline delete logic
- [Source: `src/hooks/useImageUpload.ts`] — `getStoragePathFromUrl` + `deleteImage`
- [Source: `src/components/meals/MealImageUpload.tsx`] — Upload UI with fire-and-forget delete
- [Source: `src/app/api/upload/meal-image/route.ts`] — DELETE endpoint with ownership check
- [Source: `src/lib/image/__tests__/process-image.test.ts`] — Misleading WebP test
- [Source: `src/app/api/meals/route.ts`] — Meals API for `image_url` update

## Dev Agent Record

### Agent Model Used

Go: MiniMax M2.7 — Developer Agent.


### Debug Log References

- `npm test -- --run`: 293 tests passed across 21 test files.
- After code review fix pass: **302 tests passed** across 21 test files (+9 new PATCH + traversal + edge-case tests).
- All 8 tasks completed; no regressions.

### Code Review Fixes Applied (Adversarial Review pass)

- **PATCH now tested** — 5 new unit tests for `PATCH /api/meals` (auth, validation, success, error, idempotency).
- **Path traversal tests added** — 3 new tests covering `..` in middle, end, and multi-dot encoding in DELETE endpoint.
- **`getStoragePathFromUrl` strips query params** — signed URLs no longer leak `?token=` into storage path.
- **`getStoragePathFromUrl` returns null for empty path** — trailing-slash after marker now returns `null` instead of `""`.
- **PATCH body leaner** — `name` removed from `handleRemoveImage` PATCH call to prevent stale-overwrite race.
- **File List expanded** — added `MealCard.tsx`, `MealImage.tsx` and test directories to documentation.


### Completion Notes List

- **H1 (MealDetail delete resilience):** `handleRemoveImage` now awaits `deleteImage()` — only clears DB `image_url` on success; shows `toast.error` on failure.
- **H2 (MealImageUpload fire-and-forget):** `handleRemove` is now `async`, awaits `deleteImage()`, shows `toast.error` on failure, and does NOT clear preview on failure.
- **M1 (Path traversal):** `getStoragePathFromUrl()` now rejects `..` and absolute paths; DELETE endpoint normalizes and validates path before ownership check.
- **M2 (getStoragePathFromUrl tests):** New `src/hooks/__tests__/useImageUpload.test.ts` with 9 tests covering valid extraction, null on missing marker, `..` rejection, empty string, and query params.
- **M3 (MealDetail refactor):** `MealDetail` now uses `useImageUpload()` hook's `deleteImage()` — inline fetch deleted and replaced.
- **M4 (process-image test rename):** Renamed misleading test from "output is WebP format" to "returns original file unchanged when dimensions are below max (small images not resized)".
- **L1 (replace flow await):** `handleFile` now awaits `deleteImage(oldUrl)` after successful upload; logs `console.warn` on failure without blocking.
- **L3 (PATCH vs POST):** Added `PATCH` handler to `src/app/api/meals/route.ts`; `MealDetail` now calls `PATCH /api/meals` (body: `{ id, image_url }`) for URL updates. Only changed fields are sent to avoid race conditions.


### File List

- `src/app/meals/[id]/page.tsx`
- `src/components/meals/MealImageUpload.tsx`
- `src/components/meals/MealCard.tsx`
- `src/components/meals/MealImage.tsx`
- `src/hooks/useImageUpload.ts`
- `src/app/api/upload/meal-image/route.ts`
- `src/app/api/upload/meal-image/__tests__/route.test.ts`
- `src/app/api/meals/route.ts`
- `src/app/api/meals/__tests__/route.test.ts`
- `src/hooks/__tests__/useImageUpload.test.ts`
- `src/lib/image/__tests__/process-image.test.ts`
- `_bmad-output/implementation-artifacts/5-6-image-management-review-fixes.md`
