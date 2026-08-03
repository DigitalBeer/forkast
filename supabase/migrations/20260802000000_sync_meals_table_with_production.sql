-- Sync the migration history with the live `meals` table, which drifted
-- from these migrations via direct dashboard/SQL changes made outside of
-- version control:
--   * `dietary_tags` was renamed to `tags` at some point (application code
--     had split into four different guesses at the column name to cope —
--     see src/app/api/meals/route.ts history).
--   * `last_prepared` and `usage_count` were added with no migration ever
--     committed for them.
--
-- This migration is idempotent so it is safe to run both against the
-- already-drifted production database (where it is a no-op) and against a
-- fresh database built purely from this migrations folder (where it brings
-- the schema to parity with production).
begin;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'meals' and column_name = 'dietary_tags'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'meals' and column_name = 'tags'
  ) then
    alter table public.meals rename column dietary_tags to tags;
  end if;
end $$;

alter table public.meals add column if not exists last_prepared timestamptz;
alter table public.meals add column if not exists usage_count integer not null default 0;

commit;
