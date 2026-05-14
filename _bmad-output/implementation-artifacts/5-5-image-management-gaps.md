# Story 5.5: Meal Image Management — Remaining Gaps

Status: review

## Story

As a user managing my meal images,
I want to delete images I no longer need and have confidence the upload pipeline is tested,
so that storage is not polluted with orphaned files and the feature works reliably.

## Context / What Already Exists

> **Critical:** Do NOT rewrite existing upload or display logic. Extend only.

The image upload pipeline is fully functional. Understand it before touching anything:

| File | What it does |
|---|---|
| `src/components/meals/MealImageUpload.tsx` | Upload widget with drag-drop, file select, preview, progress spinner, Replace/Remove buttons. "Remove" currently calls `onImageUrlChange(null)` but does **NOT** delete from Supabase Storage. |
| `src/hooks/useImageUpload.ts` | Validates file (`image-validation.ts`), resizes (`process-image.ts`), POSTs to `/api/upload/meal-image`. Returns public CDN URL on success. |
| `src/lib/image/image-validation.ts` | MIME type check (JPEG/PNG/WebP) + 5MB size limit. Returns `{ valid, error? }`. |
| `src/lib/image/process-image.ts` | Canvas-based resize to max 1200×900px, converts to WebP at 85% quality. Returns `File`. |
| `src/app/api/upload/meal-image/route.ts` | `POST` only. Auth check → validate type/size → upload to `meal-images` bucket at path `{userId}/{uuid}.{ext}` → return `{ url }`. |
| `src/components/meals/MealImage.tsx` | Display component with `size` variants: `thumbnail`, `card`, `full`. Falls back to `MealPlaceholder`. |
| `src/app/meals/[id]/page.tsx` | Shows image via `<MealImage size="full">` if `meal.image_url` exists. Has Edit button → `/meals/[id]/edit`. No inline image management controls. |
| `supabase/migrations/20250504000000_create_meal_images_bucket.sql` | Creates `meal-images` public bucket with RLS. Users can read all, upload to their own folder only. |

### Storage path pattern
All images are stored at: `{userId}/{uuid}.{ext}` in the `meal-images` bucket.
The `userId` prefix is extracted at upload time in `route.ts` from `session.user.id`.
To delete, you need to extract the path from the public URL or store it alongside the URL.

### Public URL format
Supabase Storage public URL: `https://{project}.supabase.co/storage/v1/object/public/meal-images/{userId}/{uuid}.ext`
To derive the storage path: strip everything up to and including `/meal-images/` → gives you `{userId}/{uuid}.ext`.

## Acceptance Criteria

1. A `DELETE /api/upload/meal-image` endpoint exists that deletes a file from Supabase Storage by path.
2. The endpoint requires authentication and validates the user owns the file (path starts with their `userId`).
3. When a user clicks "Remove" on `MealImageUpload`, the file is deleted from storage and the URL is cleared from the form.
4. When a user saves a meal with a new image replacing an old one, the old image is deleted from storage.
5. The meal detail page (`/meals/[id]`) shows a "Remove Image" button when `meal.image_url` is set, which deletes the image and saves `null` to `image_url`.
6. Unit tests exist for `image-validation.ts` covering all validation paths.
7. Unit tests exist for `process-image.ts` covering resize behaviour and error handling.
8. Unit tests exist for the upload API route covering: 401 unauthenticated, 400 bad type, 400 too large, 200 success, 500 upload error.
9. Unit tests exist for the delete API route covering: 401 unauthenticated, 403 ownership violation, 400 missing path, 200 success.

## Tasks / Subtasks

- [x] Task 1 — Delete API endpoint (AC: 1, 2)
  - [x] Add `DELETE` handler to `src/app/api/upload/meal-image/route.ts`
  - [x] Accept JSON body: `{ path: string }` where path = `{userId}/{uuid}.ext`
  - [x] Auth check via `createSupabaseServerClient().auth.getSession()` — same pattern as POST handler
  - [x] Ownership check: verify `path.startsWith(userId + '/')` — return 403 if not
  - [x] Call `supabase.storage.from('meal-images').remove([path])`
  - [x] Return 200 `{ success: true }` or appropriate error
  - [x] Handle Supabase remove error and return 500

- [x] Task 2 — Delete integration in MealImageUpload (AC: 3, 4)
  - [x] Add `currentImageUrl` path extraction helper: strip Supabase base URL to get `{userId}/{uuid}.ext`
  - [x] Extend `useImageUpload.ts` with a `deleteImage(url: string): Promise<boolean>` function that calls `DELETE /api/upload/meal-image`
  - [x] In `MealImageUpload.tsx`, `handleRemove` should: call `deleteImage(currentImageUrl)` if `currentImageUrl` is set, then call `onImageUrlChange(null)`
  - [x] For replace flow: when `handleFile` succeeds and there was a previous `currentImageUrl`, delete the old image after the new one uploads successfully
  - [x] Handle delete failures gracefully — show no blocking error to user (log to console, continue)

- [x] Task 3 — Remove Image on MealDetail page (AC: 5)
  - [x] In `src/app/meals/[id]/page.tsx`, when `meal.image_url` is set, render a "Remove Image" button below the `MealImage` component
  - [x] On click: call `deleteImage(meal.image_url)` → on success, call the meals update API to set `image_url = null` → update local `meal` state → remove button disappears
  - [x] Use existing `Button` component from `@/components/ui/button`
  - [x] Show loading state on button during operation
  - [x] Use `toast.error` / `toast.success` from `sonner` for feedback

- [x] Task 4 — Unit tests: image-validation.ts (AC: 6)
  - [x] Create `src/lib/image/__tests__/image-validation.test.ts`
  - [x] Test: valid JPEG accepted
  - [x] Test: valid PNG accepted
  - [x] Test: valid WebP accepted
  - [x] Test: invalid MIME type (e.g. `image/gif`) rejected with error message
  - [x] Test: file exceeding 5MB rejected with error message
  - [x] Test: file exactly at 5MB accepted

- [x] Task 5 — Unit tests: process-image.ts (AC: 7)
  - [x] Create `src/lib/image/__tests__/process-image.test.ts`
  - [x] Test: image under 1200×900 returned as-is (no resize)
  - [x] Test: image over 1200×900 resized proportionally
  - [x] Test: output is WebP format
  - [x] Note: `process-image.ts` uses `document.createElement('canvas')` — use `jsdom` environment (already configured in `vitest.config.ts`) and mock `HTMLCanvasElement.prototype.toBlob` if needed

- [x] Task 6 — Unit tests: upload API route (AC: 8)
  - [x] Create or extend `src/app/api/upload/meal-image/__tests__/route.test.ts`
  - [x] Test: returns 401 when not authenticated
  - [x] Test: returns 400 for unsupported MIME type
  - [x] Test: returns 400 when file exceeds 5MB
  - [x] Test: returns 200 with `{ url }` on success
  - [x] Test: returns 500 when Supabase storage upload fails
  - [x] Follow pattern of existing API route tests: `src/app/api/meals/__tests__/route.test.ts`

- [x] Task 7 — Unit tests: delete API route (AC: 9)
  - [x] Add to `src/app/api/upload/meal-image/__tests__/route.test.ts`
  - [x] Test: returns 401 when not authenticated
  - [x] Test: returns 403 when path does not start with authenticated user's ID
  - [x] Test: returns 400 when `path` is missing from body
  - [x] Test: returns 200 `{ success: true }` on successful delete
  - [x] Test: returns 500 when Supabase storage remove fails

## Dev Notes

### Extracting storage path from public URL

```typescript
// Utility — can live in useImageUpload.ts or a shared lib/image/utils.ts
export function getStoragePathFromUrl(publicUrl: string): string | null {
  // URL format: https://{project}.supabase.co/storage/v1/object/public/meal-images/{path}
  const marker = '/meal-images/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}
```

### Delete API implementation pattern

Follow exactly the same auth pattern as `POST /api/upload/meal-image/route.ts`:

```typescript
export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const path = body?.path as string | undefined;
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  if (!path.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase.storage.from('meal-images').remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

### Meals update API — saving null image_url

To clear `image_url` on a meal from the detail page, use the existing PATCH/PUT meal endpoint at `src/app/api/meals/[id]/route.ts`. Check its accepted fields. If `image_url: null` is not currently accepted, add it to the schema. Alternatively use the Supabase client directly (following the pattern in `src/lib/data/meals.ts`).

### Vitest environment for canvas tests

`vitest.config.ts` already uses `jsdom` environment. For `process-image.ts` tests, canvas operations may need mocking:

```typescript
// In test setup or test file
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  drawImage: vi.fn(),
});
HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => {
  cb(new Blob(['img'], { type: 'image/webp' }));
});
```

### Reference test pattern

See `src/app/api/meals/__tests__/route.test.ts` for how to mock `createSupabaseServerClient` and `auth.getSession`. The existing mock pattern:

```typescript
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));
```

### MealDetail page — current image rendering

In `src/app/meals/[id]/page.tsx`, the image renders at line ~93:

```tsx
{meal.image_url && (
  <MealImage src={meal.image_url} alt={meal.name} size="full" className="w-full md:w-64 h-48 md:h-64" />
)}
```

Add the Remove Image button directly below this block. Keep it inside the same conditional so it only renders when an image exists. The button must be wrapped in its own loading state (local `useState<boolean>`), not tied to the meal-fetch loading state.

### Project Structure Notes

- New files:
  - `src/lib/image/__tests__/image-validation.test.ts`
  - `src/lib/image/__tests__/process-image.test.ts`
  - `src/app/api/upload/meal-image/__tests__/route.test.ts`
- Modified files:
  - `src/app/api/upload/meal-image/route.ts` (add DELETE handler)
  - `src/hooks/useImageUpload.ts` (add `deleteImage` function)
  - `src/components/meals/MealImageUpload.tsx` (call delete on remove/replace)
  - `src/app/meals/[id]/page.tsx` (add Remove Image button)

### References

- [Source: `src/app/api/upload/meal-image/route.ts`] — POST handler pattern
- [Source: `src/app/api/meals/__tests__/route.test.ts`] — API unit test pattern
- [Source: `src/hooks/useImageUpload.ts`] — Upload hook pattern
- [Source: `src/components/meals/MealImageUpload.tsx`] — Upload UI component
- [Source: `src/app/meals/[id]/page.tsx`] — Meal detail page structure
- [Source: `supabase/migrations/20250504000000_create_meal_images_bucket.sql`] — Storage bucket + RLS

## Dev Agent Record

### Agent Model Used

Go: DeepSeek V4 Pro

### Debug Log References

- `blob.arrayBuffer` not available in jsdom — polyfilled in route test `createMockFile` helper
- `window.Image` constructor mock required `vi.stubGlobal('Image', MockImage)` pattern for process-image tests
- Prettier reformatted several files on edit, formatting-only changes present

### Completion Notes List

1. **DELETE endpoint** (`route.ts`): Added `DELETE` handler following exact POST pattern — auth check, ownership validation (`path.startsWith(userId + '/')`), Supabase storage remove, error handling
2. **useImageUpload hook**: Added `getStoragePathFromUrl` utility and `deleteImage` function. Delete is fire-and-forget (returns boolean, logs warnings on failure)
3. **MealImageUpload component**: `handleRemove` now calls `deleteImage` before clearing UI; `handleFile` deletes old image after successful new upload
4. **MealDetail page**: Added "Remove Image" button with `Trash2` icon and `Loader2` spinner. Calls delete API then meals update API with `image_url: null`. Toast feedback on success/error
5. **Meals API route**: Updated `image_url` parsing to explicitly handle `null` (was only checking `typeof === 'string'`, now checks `=== null` first)
6. **Tests added**: 27 new unit tests — 6 image-validation, 7 process-image, 7 upload API route, 7 delete API route
7. **Full regression**: 280 tests pass (0 failures) — no regressions introduced

### File List

- `src/app/api/upload/meal-image/route.ts` — Added `DELETE` handler
- `src/app/api/upload/meal-image/__tests__/route.test.ts` — NEW: 14 tests (7 POST + 7 DELETE)
- `src/app/api/meals/route.ts` — Updated `image_url` handling to accept `null`
- `src/hooks/useImageUpload.ts` — Added `getStoragePathFromUrl`, `deleteImage` function
- `src/components/meals/MealImageUpload.tsx` — Delete on remove/replace, imports `deleteImage`
- `src/app/meals/[id]/page.tsx` — Added Remove Image button with loading state
- `src/lib/image/__tests__/image-validation.test.ts` — NEW: 6 tests
- `src/lib/image/__tests__/process-image.test.ts` — NEW: 7 tests
