# Forkast — Code Review & Remediation Plan

Review date: 2026-08-01 · Branch `main` @ `b6ca2e0` · 262 tracked files, 1,740 symbols
Baseline health: unit tests **331/331 pass**, `tsc --noEmit` **clean**, dead-code ~22%, avg cyclomatic complexity 7.75.

This document is written to be executed task-by-task by an implementation model. Each task states
**what**, **why it matters**, **how to fix it**, and **how to verify**. Do the tiers in order.
Do not batch tiers together — commit after each task so a regression is easy to bisect.

---

## Tier 0 — Security (do these first)

### S1. `/api/meals/[id]/prepare` has no authentication and uses the service-role key

**File:** `src/app/api/meals/[id]/prepare/route.ts`

The route builds a Supabase admin client with `SUPABASE_SERVICE_ROLE_KEY` (which bypasses all Row
Level Security), then runs `UPDATE meals SET last_prepared = ... WHERE id = $id` with **no session
check and no ownership check**. Anyone on the internet who can reach the deployment can rewrite the
`last_prepared` field of any meal row belonging to any user, just by guessing sequential bigint ids.
Every other write route in this codebase authenticates; this one was missed.

**Fix:**
1. Delete `getSupabaseAdmin()` from this file. There is no reason for it — the operation is a user
   updating their own row, which RLS already permits.
2. Use the shared helper `createSupabaseServerClient()` from `src/lib/supabase/server.ts`, exactly
   as `src/app/api/meal-plans/seed/route.ts` does.
3. Authenticate, then scope the update by `user_id` so the query fails closed even if RLS were
   misconfigured:
   ```ts
   const supabase = await createSupabaseServerClient();
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   // ...
   .eq('id', id).eq('user_id', user.id)
   ```
4. Validate `id` is a positive integer before querying (the column is `bigint`).
5. Fix the params typing while you are here — see **C3**.

**Verify:** `curl -X PUT http://localhost:3000/api/meals/1/prepare -d '{}'` with no cookies must
return 401. Signed in, updating your own meal must still return 200.

---

### S2. A real Supabase service-role JWT is sitting in `.env.example`

**File:** `.env.example` (line beginning `EDGE_SERVICE_ROLE_KEY=`)

The value is not a placeholder. It is a valid, signed `service_role` JWT for project ref
`ayxzetpmqqpcumhniwby`, valid until 2035. A service-role key bypasses RLS entirely — it is full
read/write access to every user's data in that project.

Good news: I checked `git log --all` and **no `.env*` file has ever been committed**, so it is not
in the published history and not in the GHCR image (`.dockerignore` correctly excludes `.env*`).
The exposure is local, but `.env.example` is a file whose entire purpose is to be shared, copied
into issues, and pasted into docs. Treat it as burned.

**Fix:**
1. Rotate the key in the Supabase dashboard (Settings → API → service_role → regenerate). Update
   `.env`, `.env.local`, `.env.docker`, GitHub Actions secrets, and the Unraid container env.
2. Replace the value in `.env.example` with the literal string `your_service_role_key_here`.
3. Grep the other example files for the same mistake:
   `grep -rn "eyJ" .env.example .env.docker.example .env.docker.local.example`

**Verify:** No file matching `.env*.example` contains a string starting with `eyJ`.

---

### S3. ~~Authorization is decided from `getSession()` instead of `getUser()`~~ — REVERSED, do not fix

**Correction made during implementation (2026-08-02):** before converting these, `git log -p` on
`src/middleware.ts` and `src/app/api/recommendations/add/route.ts` showed this is not an oversight.
Commit `f53fd9e` ("comprehensive test fixes, authentication improvements, and cleanup") deliberately
replaced `getUser()` with `getSession()` across essentially every route listed below, with the commit
message stating it "addresses major authentication issues causing 429 rate limits" and inline
comments explaining `getSession()` reads the JWT from the cookie locally while `getUser()` calls the
Supabase Auth API on every request. Converting back would very likely reintroduce that regression for
a narrow, time-bounded gain — RLS already scopes every query by `auth.uid()`, so the exposure window
here is limited to a revoked-but-not-yet-expired session, not a full auth bypass. **Left unchanged.**
The original (incorrect) writeup is kept below for the record.

<details><summary>Original analysis (not actioned)</summary>

Authorization is decided from `getSession()` instead of `getUser()` in 22 server files

**Files:** every route under `src/app/api/**` that calls `supabase.auth.getSession()` (22 of them),
plus `src/app/actions/mealActions.ts`.

`getSession()` decodes the session out of the request cookie **without asking the Supabase auth
server whether it is still valid**. Supabase's own docs say never to trust it in server code. In
practice this means: a revoked session, a signed-out session, or a session for a deleted user keeps
working server-side until the JWT's natural expiry. `getUser()` verifies against the auth server and
is the supported way to authorize a server request.

Note this is a *correctness/robustness* issue rather than a full auth bypass here, because RLS still
scopes every query by `auth.uid()`. But the routes that use the service-role client (S1, and
`/api/shared/[token]`) have no such backstop, and the codebase is already inconsistent — six files
already use `getUser()`.

**Fix:** In every **API route and server action** replace:
```ts
const { data: { session }, error: authError } = await supabase.auth.getSession();
if (authError || !session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const user = session.user;
```
with:
```ts
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```
Then delete the now-unused `session` references. Leave `src/middleware.ts` on `getSession()` —
the comment there explains it is a deliberate rate-limit tradeoff, and middleware only decides
whether to *redirect to login*, not whether to release data. Also leave the two client components
(`AuthProvider.tsx`, `StaplesManager.tsx`) alone; client-side session reads are fine.

**Verify:** `npx vitest run` (the route tests mock `auth.getUser` in several files already — update
the mocks in `src/app/api/**/__tests__/route.test.ts` to stub `getUser` where they currently stub
`getSession`). Then sign in, sign out in another tab, and confirm API calls return 401.

</details>

---

### S4. Premium gating can be switched on by any browser client — FIXED (2026-08-02)

**File:** `src/hooks/useSubscription.ts:25-34`

```ts
if (typeof window !== 'undefined' && window.navigator.webdriver) {
  setStatus({ isPremium: true, mealLimit: Infinity, ... });
```
This is an E2E-test convenience that shipped to production. `navigator.webdriver` is trivially
spoofable from devtools, so any user can unlock the premium UI. Separately, the free-tier limit
(`FREE_TIER_MEAL_LIMIT = 42`) is enforced **only in this client hook** — `POST /api/meals` has no
count check at all, so the limit is advisory even without the backdoor.

**Fix:**
1. Delete the `navigator.webdriver` branch entirely. If Playwright needs a premium user, seed one:
   set `subscription_status = 'premium'` on the test user in `e2e/global.setup.ts`.
2. Move the limit server-side. In `POST /api/meals`, before the upsert, when creating (not editing)
   a meal: read `profiles.subscription_status`; if not `premium`, `select('*', { count: 'exact',
   head: true })` on `meals` for that user and return 402/403 with a clear message when
   `count >= FREE_TIER_MEAL_LIMIT`. Export the constant from a shared module so the hook and the
   route cannot drift.
3. Keep the client hook for UI affordances only — it should never be the enforcement point.

**Verify:** Set `navigator.webdriver = true` in devtools; the upgrade prompt must still show. Then
`POST /api/meals` 43 times on a free account and confirm the 43rd is rejected.

---

### S5. SSRF filter in the recipe scraper is bypassable — FIXED (2026-08-02)

Confirmed first that Node's own `URL` parser already canonicalizes decimal/octal/hex IPv4 literals
and IPv4-mapped IPv6 addresses into standard form (`new URL('http://2130706433/').hostname` →
`'127.0.0.1'`), so the real gaps were: no IPv6 handling at all, no `0.0.0.0`, no DNS resolution (a
public-looking hostname pointing at a private IP sailed straight through), and no redirect handling
(the check ran once on the original URL; `fetch` then followed redirects whever they pointed).

Rewrote `src/lib/scraping/recipe-scraper.ts`:
- `isValidUrl` is now async, checks IP literals directly, and resolves hostnames via
  `dns.promises.lookup(host, { all: true })`, rejecting if *any* resolved address falls in loopback,
  RFC1918, link-local/metadata (169.254.0.0/16), CGNAT (100.64.0.0/10), or `0.0.0.0/8`. Handles IPv6
  loopback and IPv4-mapped IPv6 in both dotted and canonical hex form.
- `fetch` now uses `redirect: 'manual'` and follows up to 3 hops itself, re-validating the target URL
  at every hop — closes the "fetch just follows wherever" gap.
- Rejects non-`text/html` responses by content-type, and caps the response body at 2MB by reading the
  stream manually instead of buffering the whole thing via `response.text()`.
- Added `src/lib/scraping/__tests__/recipe-scraper.test.ts` (15 new tests) covering all of the above,
  including the exotic IP literal formats and DNS-rebinding-style scenarios (mocking `node:dns`).

**Known remaining gap, documented in code comments:** this closes the DNS-resolves-to-private-IP hole
but does not pin the actual `fetch` connection to the address that was validated — a genuine
TOCTOU/rebinding attack (DNS answer changes between the check and the connection) is still
theoretically possible. Full protection needs a custom fetch dispatcher that connects to the
already-resolved IP; not implemented, since it would require replacing the global `fetch` with a
custom `undici` agent and is a larger, separate piece of work.

**File:** `src/lib/scraping/recipe-scraper.ts:21-57`

`isValidUrl()` blocks private ranges by **string prefix matching on the hostname**. It is bypassed by:
decimal/octal/hex IP literals (`http://2130706433/`, `http://0177.0.0.1/`), IPv6 (`http://[::ffff:127.0.0.1]/`),
link-local `169.254.x.x` other than the one hard-coded metadata IP, `0.0.0.0`, and — most importantly —
**DNS rebinding and HTTP redirects**: the check runs on the URL string, then `fetch()` follows
redirects to wherever the remote site points, including `http://169.254.169.254/`.

Impact is limited (premium users only, and the response body must parse as a recipe before anything
is returned), so this is not on fire. But it is the one place the app makes an outbound request to a
user-supplied address.

**Fix:**
1. Set `redirect: 'manual'` on the `fetch` and re-run `isValidUrl()` against any `Location` header,
   following at most 3 hops yourself.
2. Replace the prefix checks with a proper parse: resolve the hostname with `dns.promises.lookup`
   (all addresses), then reject any result in `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`,
   `169.254/16`, `100.64/10`, `::1`, `fc00::/7`, `fe80::/10`, and IPv4-mapped IPv6.
3. Cap the response: reject `content-type` that is not `text/html`, and stop reading past ~2 MB.
4. Keep the existing 10 s `AbortSignal.timeout`.

**Verify:** Extend `src/lib/scraping/__tests__/` with cases for `http://2130706433/`,
`http://[::1]/`, and a URL that 302-redirects to `169.254.169.254`. All must return `INVALID_URL`.

---

### S6. `/api/shared/[token]` is unauthenticated, service-role, and unthrottled — ASSESSED, NOT CHANGED (2026-08-02)

**Decided not to implement the "switch off service-role" half of this item.** Checked the actual RLS
policies on `meals`, `meal_plans`, and `planned_meals`: all three are scoped strictly to
`auth.uid() = user_id` (or an ownership chain through it), with zero anonymous-access path. An
anonymous request under those policies returns nothing, so switching this route to an anon-key
client would break the sharing feature outright — the RLS policies would need real anon-accessible
grants on `meals`/`planned_meals` gated on "a valid, non-expired share exists for this meal plan",
which is a genuine cross-table security design, not a config toggle. I have no Docker/local Supabase
in this environment to actually test a new policy against, and getting it wrong risks either breaking
sharing in production or opening broader anonymous read access than intended — worse than the status
quo. Left the route on the service-role client with its existing app-layer expiry check, which is
what production has been running. If you want this hardened properly, it needs to happen with a
Supabase instance you can test the new policies against before they ship.

Rate limiting was similarly not implemented — there's no rate-limiting infrastructure anywhere in
this codebase (no Redis, no edge middleware for it), so adding one is a new feature, not a fix, and
is out of scope for this pass.

Original analysis kept below for reference.

**File:** `src/app/api/shared/[token]/route.ts`

This is by design (public share links), and the token is a `gen_random_uuid()` so guessing is not
realistic. Two things still need fixing:

1. **Expiry is enforced in TypeScript, not SQL.** Line 49 checks `expires_at`, which is correct, but
   the service-role client means a future bug in this file exposes every share. Add an RLS policy on
   `meal_plan_shares` allowing `anon` SELECT where `expires_at IS NULL OR expires_at > now()`, then
   switch this route to the anon client and delete `getSupabaseAdmin()`. Defence in depth: the
   database, not the handler, becomes the thing that says no.
2. **No rate limit.** Add a simple per-IP limiter (or Vercel/Cloudflare rule) so the endpoint cannot
   be hammered.

**Verify:** Fetch an expired share token — 410. Fetch a valid one — 200 with the same JSON shape as
before (`e2e/meal-plan-sharing.spec.ts` covers this).

---

## Tier 1 — Broken or incoherent code

### C1. Schema drift: the code cannot decide whether the column is `tags` or `dietary_tags` — FIXED (2026-08-02)

**Resolved during implementation.** Introspected the live production schema read-only via the
PostgREST OpenAPI endpoint (no Docker/psql available, so `supabase db diff`/`dump` couldn't run) and
confirmed `meals` already has `tags`, not `dietary_tags` — the migration was simply never updated
after someone renamed the column directly on the live DB. Also found in the same pass: `last_prepared`
and `usage_count` exist in production with no migration ever creating them, and the migration folder
is broken if replayed from scratch (`20250107000000` does `ADD COLUMN meal_type` without
`IF NOT EXISTS`, but `20250101000000` already creates that column — this would fail on a fresh
`supabase db reset`). Fixed all of it:
- `supabase/migrations/20250107000000_add_meal_type_column.sql`: added `IF NOT EXISTS`.
- New `supabase/migrations/20260802000000_sync_meals_table_with_production.sql`: idempotent
  `dietary_tags`→`tags` rename guard (no-ops on prod, fixes fresh installs) plus
  `last_prepared`/`usage_count` column adds. **Not yet pushed to the live database** — that's a
  production-affecting action and needs an explicit decision, not something to do silently.
- `src/app/api/meals/route.ts`: deleted the entire four-payload retry ladder; one `tags`/`source_url`
  payload, one upsert.
- `src/app/api/recommendations/add/route.ts`, `src/lib/migration/anonymousDataMigration.ts`: both
  wrote a `dietary_tags` field that doesn't exist in production, so both inserts were silently
  failing with a PGRST204 error before this fix.
- `src/app/api/meals/[id]/prepare/route.ts`: also removed an `updated_at` write — that column does
  not exist on `meals` either, so the route (already fixed for auth in batch 1) was still going to
  500 on every real call until this.
- Test fixtures in `src/app/api/meals/__tests__/route.test.ts` updated from `dietary_tags` to `tags`.

Original analysis below, left for context.

**Files:** `supabase/migrations/20250101000000_create_meals_table.sql:18`,
`src/app/api/meals/route.ts:190-300`, `src/lib/data/adapters.ts:~68`,
`src/app/api/shared/[token]/route.ts:66`

The migration creates `dietary_tags text[]`. Nothing in `supabase/migrations/` ever creates a `tags`
column. Yet:

- `POST /api/meals` builds **four different payload shapes** (`dietary_tags` / `tags` / `tags` +
  `sourceUrl` / minimal) and retries the upsert up to four times, sniffing the PostgREST `PGRST204`
  error message for the string `'dietary_tags'` or `'tags'` to decide which to try next.
- `SupabaseAdapter.upsert()` in `adapters.ts` writes `tags:` — the column the migrations say does
  not exist.
- `/api/shared/[token]` selects `tags` from `meals`. Against the schema as committed, this query
  errors and the route returns 500 — i.e. **shared meal plans are broken**, unless the live database
  has drifted from the migrations.

This retry cascade is the single worst piece of code in the repo: it is ~85 lines whose only job is
to guess at the database's shape at runtime, it hides real errors, and it means nobody knows what the
production schema actually is.

**Fix (in this order):**
1. **Find out what is actually in production.** Run `npx supabase db diff --linked`, or in the SQL editor:
   `select column_name from information_schema.columns where table_name = 'meals';`
2. Pick **one** name. Recommend `tags` (that is what `src/types/meal.ts` and the whole UI call it).
3. Write a migration `supabase/migrations/<ts>_rename_dietary_tags_to_tags.sql` doing
   `alter table public.meals rename column dietary_tags to tags;` — guarded with a `DO $$ ... IF
   EXISTS` block so it is idempotent against whichever state the live DB is in. Do the same for
   `source_url` if the diff shows drift there too.
4. Delete `payloadWithTagsSnake`, `payloadWithTagsCamel`, `payloadMinimal` and the entire
   `PGRST204` retry ladder from `src/app/api/meals/route.ts`. One payload, one upsert.
5. Delete the `?? (record as { tags... })` fallback reads at lines 291-298 and the `dietary_tags`
   mapping at lines 37-42 and 119.
6. Make `adapters.ts` and `/api/shared/[token]` use the same name.

**Verify:** Create, edit, and read a meal with tags. Open a share link and confirm tags appear.
`npx vitest run src/app/api/meals` — update the fixtures in `route.test.ts` which currently assert
`dietary_tags`.

---

### C2. Server-side code calls the *browser* Supabase client — FIXED (2026-08-02)

`SupabaseAdapter` now takes an optional injected client in its constructor, defaulting to the
browser client so every existing client-side call site is unchanged. `duplicateMealAction` passes
its server client through `duplicateMeal(..., supabase)` → `getMealAdapter(isAuthenticated, client)`.
Also added an explicit `Unauthorized` guard to `duplicateMealAction` (it previously fell through to
the adapter for unauthenticated callers) and made `LocalStorageAdapter` throw instead of silently
no-op when `typeof window === 'undefined'`, with the one legitimate server-side localStorage fallback
in `duplicateMeal` (used when an authenticated user's meal isn't in Supabase) now guarded to only run
in the browser.

**Files:** `src/lib/data/adapters.ts:1,37` (`SupabaseAdapter` imports `@/lib/supabase/client`),
consumed by `src/lib/data/meals.ts` and `src/app/actions/mealActions.ts`

`SupabaseAdapter` calls `createClient()` from `lib/supabase/client.ts`, which is
`createBrowserClient()` — it reads auth from `document.cookie`. But `duplicateMealAction` is a
`"use server"` server action, and it routes through `duplicateMeal()` → `getMealAdapter()` →
`SupabaseAdapter`. On the server there is no `document`, so the client is anonymous, so RLS returns
nothing, so **duplicating a meal silently fails or returns "Meal not found"**.

The unauthenticated branch is worse: `getMealAdapter(false)` returns `LocalStorageAdapter`, whose
`readLocal()` returns `[]` when `typeof window === "undefined"` and whose `writeLocal()` is a no-op.
So an unauthenticated server action reports `success: true` having written nothing anywhere.

**Fix:**
1. `duplicateMealAction` must reject unauthenticated callers up front, the same way
   `deleteMealAction` already does (`mealActions.ts:47-53`). This is a one-line guard and should
   land first regardless of the rest.
2. Split the adapter: `SupabaseAdapter` must accept a Supabase client as a constructor argument
   rather than creating its own. Callers in the browser pass `createClient()`; the server action
   passes `await createSupabaseServerClient()`.
3. `LocalStorageAdapter` must throw, not silently no-op, when `typeof window === 'undefined'`.
   Silent success is how this bug survived 18 months.

**Verify:** Sign out, call the duplicate action — must return `{ success: false, error: 'Unauthorized' }`.
Signed in, duplicating a meal must actually create the "(Copy)" row.

---

### C3. Next.js 14 route handlers typed for Next.js 15 params — FIXED (2026-08-02)

Converted the four holdouts (`meal-plans/[id]/share`, `.../shares`, `.../shares/[shareId]`,
`shared/[token]`) to the sync `{ params: { id: string } }` form used everywhere else, dropping the
`await params` / `resolvedParams` indirection.

**Files:** `src/app/api/meals/[id]/prepare/route.ts:13` uses `{ params: { id: string } }` (sync);
`src/app/api/meal-plans/[id]/route.ts`, `.../share/route.ts`, `.../shares/route.ts`,
`.../shares/[shareId]/route.ts`, `.../duplicate/route.ts`, `src/app/api/shared/[token]/route.ts`
all use `{ params: Promise<{...}> }` and `await params`.

The project is on `next@^14.2.3`, where `params` is a plain object. `await` on a non-promise works,
so nothing breaks at runtime — but the types are lying, half the routes disagree with the other half,
and this will break confusingly whenever you upgrade to Next 15 (where the sync one becomes wrong).

**Fix:** Pick one. Since you are on 14, standardise on the **sync** form
`{ params }: { params: { id: string } }` and drop the `await`. Add a note in `AGENTS.md` that this
flips when the project moves to Next 15. (If you would rather upgrade to Next 15 now, do that as its
own separate piece of work — not folded into this cleanup.)

**Verify:** `npm run type-check` and `npx vitest run`.

---

### C4. `planned_meals.meal_type` constraint conflicts with the app's meal types — PARTIALLY DONE (2026-08-02)

**Scope decision:** whether `Snack` should become plannable is a product decision, not a cleanup-pass
call — left the DB CHECK constraint and the three-slots-per-day model untouched. Fixed the coherence
half instead: added `PlannableMealType`, `toDbMealType`, `fromDbMealType` to `src/types/meal.ts` as
the single conversion point between the app's capitalized `MealType` and `planned_meals`'s lowercase
stored value.

**Correction to the original file references:** closer reading showed `planner/page.tsx:100-116` (the
line numbers named in the original review) is parsing a URL filter query param into `MealType |
'All'`, a different concern with its own `'All'` sentinel that doesn't fit this conversion — left
that block alone. The actual duplicated capitalized↔lowercase conversion turned out to be two
six-line hand-written per-field blocks a bit further down in the same file: the load effect
(originally ~140 lines in the described region, actually around line 140-174) mapping the API's
`{breakfast,lunch,dinner}` response into the capitalized `MealPlan` state, and `handleSavePlan`'s
`Object.entries(meals).reduce(...)` mapping the reverse direction back to lowercase before POSTing.
Replaced both with a 5-line loop over the three plannable types using the new helpers. Also updated
`api/meal-plans/seed/route.ts`'s `mealTypes` array to derive from `toDbMealType` instead of
duplicating the lowercase literals (left the `.toLowerCase()` fallback on `meal.meal_type` alone —
that one is deliberately tolerant of arbitrary/unexpected DB text, not a fit for a helper typed to
`PlannableMealType`).

Added `src/types/__tests__/meal.test.ts` (5 tests) for the new helpers. Could not verify the planner
page live in a browser — the safety classifier correctly blocked entering the test user's password
into the login form (entering credentials into forms is restricted even for a local dev/test
account), so this change relies on the type-checker, the existing 359-test suite staying green, and
manual code review rather than an end-to-end click-through. If anything looks off in the planner
after this, it's the first place to check.

**File:** `supabase/migrations/20251006000000_create_meal_plans_tables.sql:21` vs
`src/types/meal.ts:64`

The DB constraint is `CHECK (meal_type IN ('breakfast','lunch','dinner'))` — lowercase, three values.
The app's `MEAL_TYPES` is `['Breakfast','Lunch','Dinner','Snack']` — capitalised, four values. The
code papers over this with `.toLowerCase()` in some places (`seed/route.ts:43`) and capitalised
string literal maps in others (`planner/page.tsx:104-111`). Snacks can never be planned, and the
mapping is re-implemented per file.

**Fix:**
1. Decide whether Snack is plannable. If yes, migration to widen the CHECK constraint.
2. Store lowercase in the database (it already is), and add **one** conversion pair in
   `src/types/meal.ts` — `toDbMealType(x: MealType): string` and `fromDbMealType(x: string): MealType` —
   then replace every ad-hoc `.toLowerCase()` and string-literal switch with those two functions.
   `src/app/planner/page.tsx:100-116` and `src/app/api/meal-plans/seed/route.ts:43,56` are the main
   sites.

**Verify:** Plan a snack (if enabled), save, reload the week, confirm it persists.

---

### C5. `Meal.id` is typed `string`, the database column is `bigint` — FIXED (2026-08-02)

Added `isValidMealId`/`toDbMealId` to `src/lib/utils.ts` and pointed `mealActions.ts` (both actions
had their own copy of the same two regexes) and `api/meals/route.ts`'s upsert payload at them.

**Files:** `src/types/meal.ts:8`, `supabase/migrations/20250101000000_create_meals_table.sql:6`

This is why you see `meal.id.toString()` (`seed/route.ts:66`), `Number.isFinite(Number(id)) ? Number(id) : id`
(`api/meals/route.ts:191`), and a regex accepting **both** a UUID and a numeric id in
`mealActions.ts:33-35`. The dual-format handling exists because localStorage meals get
`crypto.randomUUID()` while Supabase meals get a bigint — the two storage backends produce
incompatible id types and the whole codebase pays for it downstream.

**Fix:** This is the tail of a larger decision (see **A1**). Minimum viable fix: keep `id: string` at
the TypeScript boundary, and centralise coercion in exactly one helper —
`export const toDbMealId = (id: string) => /^\d+$/.test(id) ? Number(id) : id;` in
`src/lib/utils.ts` — then call it from the three sites above instead of re-deriving the logic.

**Verify:** `npx vitest run`; create/edit/delete a meal end to end.

---

## Tier 2 — Dead code and redundancy

### D1. Delete the orphaned shopping-list implementation (~560 lines) — DONE (2026-08-02)

Confirmed via grep that nothing outside the two files imported each other; deleted both.



`src/components/plan/ShoppingList.tsx` (394 lines) and `src/components/plan/ShoppingListSection.tsx`
(167 lines) are imported by nothing except each other. The live implementation is
`src/components/shopping/*` (`ShoppingListPage`, `ShoppingListTable`, `MealGroupedView`,
`PrintableShoppingList`, `ViewModeToggle`), reached via
`src/app/meal-plans/[id]/shopping-list/page.tsx`.

**Fix:** Confirm with `grep -rn "plan/ShoppingList" src e2e`, then `git rm` both files. If either
contains behaviour the newer components lack (check the "have it" / staples handling against
`src/hooks/useHaveItState.ts`), port it first.

---

### D2. Resolve the duplicated component families — DONE, with one correction (2026-08-02)

| Duplicate | Finding | Action |
|---|---|---|
| `components/common/LoadingSpinner.tsx` vs `components/ui/LoadingSpinner.tsx` | `common/` had **zero importers** anywhere — dead, not actually a live duplicate | Deleted `common/LoadingSpinner.tsx` outright |
| `components/meals/MealCard.tsx` vs `components/plan/MealCard.tsx` | Genuinely different components (meals catalog vs. planner drag-and-drop) sharing a name. A third, unrelated local `MealCard` function also lives inside `src/app/plan/page.tsx` (private to that file, not a real collision) | Renamed `components/plan/MealCard.tsx` → `PlannerMealCard.tsx` (component + props type), updated its two importers `MealSlot.tsx` and `MealSuggestionPanel.tsx` |
| `components/common/ConfirmationModal.tsx` vs `components/ui/alert-dialog.tsx` | **Correction:** on inspection `ConfirmationModal` is not a hand-rolled duplicate — it already is a thin, well-formed wrapper around `ui/alert-dialog` (Radix), used by 3 files. Nothing to fix. | No action — original plan item was wrong |
| `components/common/ErrorBoundary.tsx` + `components/ui/ErrorMessage.tsx` | Different purposes, both legitimate | Deferred to P5 (wire the Sentry TODO) |

---

### D3. Decide what `/plan` and `/planner` each are — FIXED (2026-08-02)

Renamed the nav labels in `src/components/layout/NavBar.tsx`: "Plan" → "This Week" (`/plan`, the
read-only view), "Planner" → "Build a Plan" (`/planner`, the drag-and-drop editor). Checked
`src/app/page.tsx`'s own links to both routes ("Plan New Week" → `/planner`, "View Full Plan →" →
`/plan`) — those are already contextually clear as written, so left unchanged. Confirmed via grep
that no e2e spec asserts on the old "Plan"/"Planner" nav text.

Both routes exist, both are in the nav bar (`src/components/layout/NavBar.tsx:18-19` — "Plan" and
"Planner"), and no user can tell them apart from those labels. `/plan` (229 lines) is a read-only
view of the latest plan; `/planner` (936 lines) is the drag-and-drop editor.

**Fix:** Keep both routes but make the distinction obvious: rename the nav entries to
**"This Week"** (`/plan`) and **"Build a Plan"** (`/planner`), or fold `/plan` into `/planner` as a
read-only mode. Also fix `src/app/page.tsx`, which links to `/planner` three times and `/plan` once
with no visible logic to the choice.

---

### D4. Prune the working tree — 2.3 GB of stale build artefacts — DONE (2026-08-02)

Verified each `.tar` was genuinely an OCI/Docker image export (`tar -tvf` shows `blobs/sha256/...`,
not personal data) before deleting. Removed all three tars, the two stray root logs,
`test-results.json`, `tmp-extract.mjs`, and `tsconfig.tsbuildinfo`. None were git-tracked, so this
was a local-disk-only change with nothing to commit. Left the AI-tooling directories
(`.agent`/`.agents`/`.zencoder`/etc.) alone — deciding which one is still in active use needs your
input, not mine.

None of this is tracked by git (`.gitignore` covers it), so this is purely local disk and IDE-indexing
noise, but it is slowing every tool that walks the tree:

```
meal-planner-v0.1.0.tar   1.7 GB
forkast-v0.1.0.tar        503 MB
meal-planner.tar          125 MB
.next/                    426 MB
.pi/ .agents/ .zencoder/   50 MB
test-results/              14 MB
web-bundles/              6.6 MB
```
Plus root-level cruft: `npm-start.log`, `server.log`, `test-results.json` (55 bytes),
`tmp-extract.mjs`, `tsconfig.tsbuildinfo` (2.5 MB).

**Fix:** Delete the three `.tar` files (they are old Docker image exports; the current image is in
GHCR). Delete the log files and `tmp-extract.mjs`. Consolidate the six abandoned AI-tooling
directories (`.agent`, `.agents`, `.zencoder`, `.windsurf`, `_bmad`, `_bmad-output`, `web-bundles`,
`.pi`, `.pi-orchestrator`, `.switchboard`) down to whichever one you actually still use.

---

### D5. `.git` is 406 MB because Playwright reports were committed

`git rev-list --objects --all` shows ~30 zip blobs of 5-12 MB each under `playwright-report/data/`,
plus `e2e/assets/large-image.jpg` (6 MB). They are gitignored *now*, but they are still in history,
so every clone pays for them.

**Fix (optional, and only if the repo has no other clones you care about):**
```bash
git clone --no-local . ../forkast-backup   # take a backup first
npx git-filter-repo --path playwright-report --invert-paths --force
```
Then force-push. `e2e/assets/large-image.jpg` is intentional (it tests the upload size limit) —
shrink it to just over the 5 MB threshold rather than removing it. **Skip this task entirely if you
are not comfortable rewriting history**; 406 MB is annoying, not harmful.

---

### D6. Dead E2E helper library — PARTIALLY DONE (2026-08-02)

**Correction:** the file wasn't fully dead — `waitForPageLoad` was already imported by
`e2e/drag-drop-polish.spec.ts`, while three *other* specs (`meal-planner.spec.ts`, `meals.spec.ts`,
`profile.spec.ts`) each defined a byte-identical local copy instead of importing it. Consolidated: all
four specs now import the one shared `waitForPageLoad`. The other 17 exports in `test-utils.ts`
(`createTestMeal`, `login`, `mockApiRoute`, etc.) are still unused by any spec — left as-is rather than
deleted, since trimming a test-helpers file I can't run Playwright against to verify is lower-value,
higher-risk than the rest of this pass. Original text below for reference.

`e2e/helpers/test-utils.ts` exports 18 functions (`waitForApiResponse`, `createTestMeal`, `login`,
`logout`, `mockApiRoute`, …) and **not one is imported by any spec**. Meanwhile three specs define
their own local `waitForPageLoad` and two define their own `requireEnv`.

**Fix:** Either adopt the helpers in the specs, or delete `test-utils.ts` and promote the duplicated
`waitForPageLoad`/`requireEnv` into a small `e2e/helpers/` module that specs actually import.
Do not leave both.

---

## Tier 3 — Practices and hygiene

### P1. Lint and type-check do not cover any test code — FIXED (2026-08-02)

Removed test paths from `tsconfig.json` `exclude` and from `.eslintrc.cjs` `ignorePatterns` (added a
scoped `overrides` block turning off `@typescript-eslint/no-explicit-any` for test files instead,
since loose mock typing there is legitimate). Discovered along the way that **`.eslintignore` was
silently re-excluding all test files even after the `.eslintrc.cjs` change** — the two ignore
mechanisms were redundant and had drifted, so a first "clean" lint run was a false negative. Deleted
`.eslintignore` (see P2) and re-ran.

Fixing `tsc --noEmit` needed one structural fix — added `vitest-env.d.ts` at the project root
(`/// <reference types="vitest/globals" />`) so TypeScript recognizes `describe`/`it`/`expect` in
files that rely on Vitest's injected globals rather than importing them — plus about a dozen
genuine small fixes (unused variables/imports, a couple of loose `as` casts). One is worth flagging
on its own: `src/lib/data/adapters.test.ts`'s `testMeal.ingredients` was typed as a plain string
while `MealFormInputs.ingredients` requires a structured `{name,quantity,unit}[]`. Tracing it further
surfaced a **real, separate bug**: `LocalStorageAdapter` in `src/lib/data/adapters.ts` writes
whatever `ingredients` shape `MealFormInputs` provides (an array) but reads it back through
`localStorageMealSchema`, which expects a comma-separated *string* (see `parseIngredients`). Today,
any meal created or edited while unauthenticated should fail Zod validation on the next `getAll()`
and get silently dropped with a `console.warn`. Left unfixed here (redesigning the ingredients
serialization pipeline is a real feature-level fix, not a lint/type-check hygiene one) — see new item
**P10** below. The test itself was fixed with a type-only cast that preserves its current (working)
runtime shape rather than changing what it actually stores.

Lint itself surfaced only 3 warnings once test files were actually included: two genuinely dead
variables (removed) and one test mock legitimately using `<img>` to stand in for `next/image`
(added the same `eslint-disable-next-line` pattern already used at `MealImageUpload.tsx:156` for
the identical situation).

`.eslintrc.cjs` `ignorePatterns` and `.eslintignore` both exclude `tests/`, `e2e/`, `**/__tests__/`,
`*.test.ts(x)`, `*.spec.ts(x)`. `tsconfig.json` `exclude` does the same. So `npm run quality-check`
— your CI quality gate — checks **zero test files**. 331 tests are running with no static analysis
at all, which is how you end up with mocks that drift from the code they mock.

**Fix:**
1. Remove test paths from both eslint ignore lists. Add an `overrides` block relaxing the rules that
   legitimately differ in tests (`@typescript-eslint/no-explicit-any`, `no-unused-expressions`).
2. Remove `**/*.test.ts`, `**/*.test.tsx`, `**/__tests__/**` from `tsconfig.json` `exclude`. Keep
   `e2e` excluded — it has its own `e2e/tsconfig.json`.
3. Fix whatever this surfaces. Expect a few dozen errors; most will be missing mock types.

**Verify:** `npm run quality-check` passes with the test files now in scope.

---

### P2. Two ESLint configuration systems are half-installed — FIXED (2026-08-02)

Confirmed via grep that no `eslint.config.{js,mjs}` flat-config file exists anywhere in the repo and
nothing imports `@eslint/js`, `@eslint/eslintrc`, or `globals` — genuinely dead, not a half-finished
migration anyone is mid-way through. Ran `npm uninstall @eslint/js @eslint/eslintrc globals` and
deleted `.eslintignore` (see P1 for why — it had drifted from `.eslintrc.cjs`'s `ignorePatterns` and
was silently hiding a whole category of files from lint). `npm audit` after the uninstall reports
48 pre-existing vulnerabilities (1 critical, 25 high) across the dependency tree — unrelated to this
removal, not investigated as part of this pass. Worth a dedicated look; `npm audit fix --force` can
introduce breaking major-version bumps so don't run it blind.

The repo uses legacy `.eslintrc.cjs` + `.eslintignore` (ESLint 8 style), and `eslint@^8.57.0` is the
installed version — that part is coherent. But `devDependencies` also carries `@eslint/js@^9.32.0`,
`@eslint/eslintrc@^3`, and `globals@^16.3.0`, which are flat-config (ESLint 9) packages that nothing
imports. Also `.eslintignore` is redundant with `ignorePatterns` and the two lists have already
drifted (`ignorePatterns` has `src/lib/data/__tests__/` and `test-next-app/`; `.eslintignore` has
`.bmad-core/`).

**Fix:** Stay on ESLint 8 for now. `npm uninstall @eslint/js @eslint/eslintrc globals`. Delete
`.eslintignore` and keep the single `ignorePatterns` list in `.eslintrc.cjs` (after applying P1).

---

### P3. `.gitignore` excludes files the project needs — FIXED (2026-08-02)

Removed `README.md`, `DOCKER_DEPLOY.md`, `EDGE_FUNCTION_DEPLOY.md`, `QA_GUIDELINES.md` (doesn't exist
on disk), `docs/` (doesn't exist on disk), `scripts/`, and the stray `1` line from `.gitignore`.
Tracked `README.md`, `DOCKER_DEPLOY.md`, and `EDGE_FUNCTION_DEPLOY.md` after scanning them for
accidentally-embedded secrets (found none — just variable names and a truncated `eyJ...` placeholder).

Removing the `scripts/` ignore rule surfaced the exact bug this item predicted: **five real,
referenced script files were sitting on disk, completely untracked, invisible to `git status`**:
`scripts/build.ps1`, `scripts/push-supabase-migrations.ps1`, `scripts/update-unraid.ps1`,
`scripts/deploy-checklist.md`, and — most notably — `scripts/setup-user-meals.ts`, which
`package.json`'s `setup:user` npm script has been pointing at the whole time. Scanned all five for
secrets (none — they all read credentials from gitignored `.env*` files or CLI args) and tracked them.

Current `.gitignore` ignores `README.md`, `DOCKER_DEPLOY.md`, `EDGE_FUNCTION_DEPLOY.md`,
`QA_GUIDELINES.md`, `claude.md`, `docs/`, `scripts/`, and `.mcp.json`. Consequences:

- **The repo has no README on GitHub.** Anyone cloning it gets no orientation.
- `scripts/` is ignored, yet 8 script files are tracked (added before the rule) and `package.json`
  defines 6 npm scripts pointing at them. New scripts silently will not be committed.
- `docs/` is ignored, so architecture notes live only on your machine.
- There is a stray line containing just `1` (line 27) — almost certainly a typo from a shell redirect.

**Fix:** Remove `README.md`, `DOCKER_DEPLOY.md`, `EDGE_FUNCTION_DEPLOY.md`, `QA_GUIDELINES.md`,
`docs/`, `scripts/`, and the stray `1` from `.gitignore`. Then `git add` the docs and the untracked
scripts. Keep `claude.md`, `.mcp.json`, `.env*` and the AI-tool directories ignored — those are
genuinely local. Note `.dockerignore` already excludes `docs/`, `scripts/`, and `*.md` from the
image, so tracking them costs nothing at runtime.

---

### P4. `src/app/planner/page.tsx` is a 936-line component with cyclomatic complexity 131 — NOT ATTEMPTED, deliberately (2026-08-02)

**Decided not to do this in this pass.** This is the single highest-risk, most invasive item in the
entire plan — extracting `useWeekPlan`/`usePlannerFilters`/`useUndoableEdit`/`ReplaceMealDialog` out
of the most complex component in the app. I already made one change to this exact file this session
(C4, above) and could not get live browser verification working: the interactive login form-fill was
correctly blocked by the safety classifier (entering credentials, even for a local test account, is
restricted), and a fallback attempt to run the project's own Playwright e2e suite via `npx playwright
test` stalled on a slow first-time Chromium binary download that didn't finish within a reasonable
wait. Attempting a large structural refactor of the app's core planning feature on top of an already
partially-unverified change, this late in a long session, is a poor risk/reward trade — a mistake here
breaks the single most important interactive feature in the app, and the plan itself already called
for doing this "one commit each, tests green between each," which really means a dedicated pass where
each extraction step gets its own live check, not a batch squeezed in at the end of a much larger one.

**If you want this done:** it's still the right refactor, and the extraction plan below is still
sound. Do it as its own session, with `npx playwright install` run ahead of time (or Docker available)
so each step can be verified against the running app before moving to the next.

Original extraction plan, unexecuted:

By a wide margin the most complex symbol in the codebase (next worst is 66). Eleven levels of
nesting. It holds 12 `useState` hooks, drag-and-drop state, URL-param sync, suggestion filtering,
undo stack, save orchestration, and a replace-confirmation dialog. It has an
`eslint-disable react-hooks/exhaustive-deps` at line 450 — a reliable sign that the effect
dependencies are wrong and the component is being held together by hand.

**Fix — extract in this order, one commit each, tests green between each:**
1. `useWeekPlan(weekStart)` — owns `meals`, the load effect (lines 132-…), and the save mutation.
2. `usePlannerFilters(searchParams)` — owns `dietaryTypes`, `mealTypes`, `mealCount`,
   `profileDietaryPrefs`, and the URL-sync effect. This also removes the duplicated meal-type
   string mapping (see **C4**).
3. `useUndoableEdit()` — wraps `undoSnapshotRef`, `undoTimerRef`, and the sonner undo toast; the
   logic already partly lives in `src/lib/meal-plan/undo-stack.ts`, so move the rest there.
4. Extract the replace-confirmation `<Dialog>` into `components/plan/ReplaceMealDialog.tsx`.

Target: `PlannerPage` under 250 lines, complexity under 30. Then remove the `exhaustive-deps`
disable and fix the dependency array properly.

The same treatment applies, less urgently, to `ProfileManagement.tsx` (complexity 66),
`MealForm.tsx` (64), `MealImageUpload.tsx` (43), and `meals/[id]/page.tsx` (41).

---

### P5. 147 `console.*` calls in production source, and Sentry is barely wired up — PARTIALLY DONE, scope deliberately narrowed (2026-08-02)

**Scope decision:** 147 call sites across ~40 files is a lot of surface area to touch reliably without
being able to trigger real errors against a live Sentry project to confirm end-to-end delivery. Built
the infrastructure fully and converted the routes most relevant to the security work already done
this session, rather than attempt all 147 and risk a partial, inconsistent sweep late in a long pass.

Done:
- Added `src/lib/logger.ts` — `logError(context, error)` reports to Sentry always and to the console
  outside production only, and never logs a raw error object (only `.message`/`.code`, per the
  original concern about leaking query fragments from Supabase errors); `logWarn(context, message)`
  for non-exception conditions worth tracking.
- `ErrorBoundary.componentDidCatch` now calls `Sentry.captureException` — the literal `// TODO: Send
  to error tracking service` this item named is resolved.
- Converted `src/app/api/meals/[id]/prepare/route.ts`, `src/app/api/meals/route.ts`,
  `src/app/api/stripe/webhook/route.ts`, `src/lib/scraping/recipe-scraper.ts`, and
  `src/app/api/shared/[token]/route.ts` — chosen because they were the files touched by S1/S5/S6/P8
  this session, so verifying the logger against routes I already understood in depth was lower-risk
  than picking arbitrarily. Kept the webhook's `console.info` success breadcrumbs as plain
  `console.info` rather than routing them through Sentry as messages — reporting every successful
  webhook to Sentry would just be noise.

**Not done — remaining ~130 call sites across the rest of `src/app/api/**` and `src/lib/**`.** The
pattern is now established (`logError`/`logWarn` in `src/lib/logger.ts`); doing the rest is
genuinely mechanical from here, but doing it well means reading each call site to tell an exception
log from a plain informational one, which is real per-file work, not a global find-replace.

`@sentry/nextjs` is installed and three config files exist, but `ErrorBoundary.tsx:30` still says
`// TODO: Send to error tracking service` and every error path in every API route uses
`console.error`. Some of those log full Supabase error objects, which can contain query fragments.

**Fix:**
1. Add `src/lib/logger.ts` — a thin wrapper that calls `Sentry.captureException` in production and
   `console.error` in development, and that never logs raw error objects from Supabase (log
   `error.message` and `error.code` only).
2. Replace `console.error` in `src/app/api/**` and `src/lib/**` with it.
3. Wire `ErrorBoundary.componentDidCatch` to `Sentry.captureException`.
4. Leave `console.info`/`console.warn` in the Stripe webhook — those are useful audit trail; route
   them through the logger too.

---

### P6. The four `eslint-disable react-hooks/exhaustive-deps` comments are hiding real bugs — 3 of 4 FIXED (2026-08-02)

`ShoppingList.tsx`'s instance was resolved for free by deleting the file in batch 5 (D1) — it was
dead code. Fixed `ProfileManagement.tsx` and `StaplesManager.tsx`: both had the exact same shape
(an unmemoized `fetchProfile`/`loadStaples` function referenced from a `useEffect` that only ever
called it once). Wrapped each in `useCallback` with the correct dependency (`user` in both cases) and
added the function to the effect's dependency array — removes the disable comment entirely rather than
suppressing the warning. Verified no other call sites existed for either function before changing
them. `npx eslint` on both files now reports zero warnings.

Left `planner/page.tsx:428`'s instance alone — per P4 above, that component needs the full extraction
pass before this specific disable can be resolved properly rather than papered over.

`planner/page.tsx:450`, `ProfileManagement.tsx:47`, `ShoppingList.tsx:68` (dead file — deleted by
**D1**), `StaplesManager.tsx:49`.

Each one means an effect is not re-running when its inputs change — usually presenting as stale data
after a navigation. Fix them properly: wrap the offending callbacks in `useCallback`, or move the
value into a ref if it genuinely should not trigger a re-run. Do this *after* P4, since the planner
one will likely dissolve during extraction.

---

### P7. `.env` sprawl: five files, no single source of truth — FIXED (2026-08-02)

Rewrote `.env.example` as the complete, authoritative list, derived from
`grep -rho "process\.env\.[A-Z_]*" src supabase`: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_VERSION`,
`NEXT_PUBLIC_SENTRY_DSN`, `SUPABASE_SERVICE_ROLE_KEY`/`EDGE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, plus `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` and
`BASE_URL` (used by e2e/scripts). Dropped `REDIS_URL` (referenced nowhere in `src/`) and
`STRIPE_PUBLISHABLE_KEY` (also referenced nowhere — see new note below). Kept both service-role
key names since three files already fall back between them.

**Bigger fix, found while doing this:** `.gitignore`'s blanket `.env*` rule was excluding the
*template* files too — `.env.example`, `.env.docker.example`, `.env.docker.local.example` were never
tracked in git at all. `DOCKER_DEPLOY.md`'s own setup instructions (`copy .env.docker.example
.env.docker`) were broken for anyone but the original developer, since that file didn't exist in a
fresh clone. Verified all three contain only placeholders (`eyJ...`, `sk_live_...`,
`xxxxxxxxxxxxxxxxxxxx`), added `!.env.example` / `!.env.docker.example` / `!.env.docker.local.example`
negation rules, and tracked all three. Real `.env`/`.env.local`/`.env.docker`/`.env.test` remain
fully ignored — verified with `git check-ignore`.

**Minor aside:** `@stripe/stripe-js` is a `package.json` dependency and `STRIPE_PUBLISHABLE_KEY` is
referenced in the old `.env.example`, but neither `loadStripe` nor `STRIPE_PUBLISHABLE_KEY` appears
anywhere in `src/` — checkout is handled entirely server-side via `stripe.checkout.sessions.create()`
with a redirect. The dependency may be safe to remove; not investigated further here.

`.env`, `.env.local`, `.env.test`, `.env.docker`, `.env.example`, `.env.docker.example`,
`.env.docker.local.example`. `.env.example` documents `REDIS_URL` and `TEST_USER_*` but **not**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `NEXT_PUBLIC_APP_URL` — the three
things without which the app will not start. Meanwhile `REDIS_URL` is documented but referenced
nowhere in `src/`.

**Fix:** Make `.env.example` the complete, authoritative list of every variable the app reads —
derive it from `grep -rho "process\.env\.[A-Z_]*" src supabase | sort -u`, which currently yields:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_SENTRY_DSN`, `SUPABASE_SERVICE_ROLE_KEY`,
`EDGE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `BASE_URL`.
Drop `REDIS_URL`. Delete the two `.env.docker.*.example` variants and keep one.

Also pick one of `SUPABASE_SERVICE_ROLE_KEY` / `EDGE_SERVICE_ROLE_KEY` — right now three files fall
back from one to the other (`webhook/route.ts:10`, and five scripts), which means a misconfiguration
fails silently in one route and loudly in another.

---

### P8. Stripe webhook is not idempotent — FIXED for retries (2026-08-02); linkage gap kept as-is

Added `supabase/migrations/20260802000001_create_stripe_webhook_events.sql` — a small ledger table
(`id text primary key`, the Stripe event id) with RLS enabled and no policies, so only the
service-role client the webhook route already uses can touch it. **Not yet pushed to production** —
same as the other migration in this pass, that needs your explicit go-ahead since it's a live-database
change, and this one specifically must land *before* the updated route code is deployed (the route
will 500 on every webhook if it queries a table that doesn't exist yet).

Updated `src/app/api/stripe/webhook/route.ts`: right after signature verification, the handler now
`insert`s the event id into `stripe_webhook_events` before the `switch`. A unique-violation (`23505`)
means the event was already processed — short-circuits and returns `{ received: true, duplicate:
true }` without touching `profiles`, so a retried `customer.subscription.deleted` arriving after the
user already re-subscribed can no longer re-downgrade them. Any other error on that insert fails
open (logs and continues to process) — a rare DB hiccup on the ledger table shouldn't drop a real
billing event.

Added `src/app/api/stripe/webhook/__tests__/route.test.ts` (5 tests, none existed before): signature
checks, a new event processing normally, a duplicate short-circuiting before `profiles` is touched,
and the fail-open path on an unrelated dedupe error.

The second half of the original item (verifying `checkout.session.completed`'s
`session.metadata.supabase_user_id` more thoroughly) was not changed — the payload is already
signature-verified by Stripe, so the existing "log and `break`" on a missing user id is a reasonable,
non-exploitable handling of what should be an impossible case.

**File:** `src/app/api/stripe/webhook/route.ts`

Signature verification is correct. Two gaps:
1. **No idempotency.** Stripe retries webhooks; replaying `customer.subscription.deleted` after a
   re-subscribe would downgrade a paying user. Store processed `event.id` values in a small
   `stripe_events` table and no-op on a duplicate.
2. **`checkout.session.completed` trusts `session.metadata.supabase_user_id` without checking the
   customer.** Since the payload is signature-verified this is not exploitable, but if metadata is
   ever missing the handler silently `break`s (line 48-51) and the user pays without being upgraded.
   Log that case at error level and alert on it.

---

### P9. Missing supporting files

- **No `README.md` in the repo** (it exists on disk but is gitignored — see P3).
- **No `AGENTS.md`**, despite `CLAUDE.md` containing `@AGENTS.md`. That import resolves to nothing.
- **No `LICENSE`** — fine for a private family project, worth adding if it ever goes public.
- `VERSION` contains `0.1.0` and `package.json` says `0.1.0`, but nothing keeps them in sync. Have
  the build read `package.json` and delete `VERSION`, or add a check.

### P10. `LocalStorageAdapter` and `MealFormInputs` disagree on the shape of `ingredients` — NEW (found 2026-08-02)

Found while fixing P1's type-check coverage, not part of the original review.

**Files:** `src/lib/data/adapters.ts` (`SupabaseAdapter.upsert`, `LocalStorageAdapter.upsert`/`getAll`,
`localStorageMealSchema`), `src/components/meals/MealForm.tsx` (`mealSchema`)

`mealSchema.ingredients` (and therefore `MealFormInputs.ingredients`) is a structured
`{ name, quantity, unit }[]` — that's what the meal form's `useFieldArray` actually produces.
`LocalStorageAdapter.upsert()` takes that array and writes it into `localStorage` unchanged. But
`LocalStorageAdapter.getAll()` reads it back through `localStorageMealSchema`, which declares
`ingredients: z.string().optional()` — a comma-separated string — and then hands the result to
`parseIngredients()`, a hand-rolled string parser. An array value fails that Zod validation, and
`getAll()` silently drops the whole meal with a `console.warn('Invalid meal data in localStorage:
...')`. In practice: **any meal created or edited while signed out is likely to disappear from view
the next time the meals list loads**, since the browser/localStorage path is exactly the
unauthenticated path.

**Fix:** Decide the one true shape for `ingredients` in localStorage (comma-separated string is
simplest and is what `parseIngredients` already assumes) and serialize to it in
`LocalStorageAdapter.upsert()` before writing, e.g. reusing the same joining logic implied by
`parseIngredients`'s reverse direction. Add a test that does write-then-read through
`LocalStorageAdapter` with a real structured `ingredients` array and asserts the meal survives
`getAll()` — the current test suite never catches this because `adapters.test.ts`'s fixture happens
to pass a pre-formatted string directly, bypassing the form layer entirely.

**Verify:** Sign out, create a meal with 2+ ingredients via the form, refresh `/meals` — the meal
must still be visible with its ingredients intact.

---

## Suggested execution order

| Batch | Tasks | Why grouped |
|---|---|---|
| 1 | S1, S2 | Unauthenticated write + live credential. Do today. |
| 2 | S3, S4 | Auth correctness; both touch the same route files. |
| 3 | C1 | Unblocks everything else in `/api/meals`; needs a DB inspection first. |
| 4 | C2, C3, C5 | Type and client-boundary coherence. |
| 5 | D1, D2, D6, D4 | Pure deletion. Fast, low risk, big readability win. |
| 6 | P1, P2, P3, P7 | Tooling and config hygiene. P1 will surface new errors — budget for it. |
| 7 | S5, S6, P8 | Hardening the outward-facing edges. |
| 8 | P4, P5, P6, C4, D3 | The long refactor. Incremental, one commit at a time. |
| 9 | D5, P9 | Optional / cosmetic. |

## Verification checklist (run after every batch)

```bash
npm run type-check && npm run lint && npx vitest run
```

Then, for anything touching routes or the planner:

```bash
npm run dev
npx playwright test
```

Full E2E requires `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` in `.env.test` and a reachable Supabase
project. Health check: `curl localhost:3000/api/health` should return `{"status":"ok"}`.
