-- Create suggestions cache table for meal suggestions caching
-- Generated at 2025-08-12T17:00:19+01:00

begin;

create table if not exists public.suggestions_cache (
  user_id text not null,
  key text not null,
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suggestions_cache_pkey primary key (user_id, key)
);

create index if not exists suggestions_cache_expires_at_idx
  on public.suggestions_cache (expires_at);

-- Row Level Security
alter table public.suggestions_cache enable row level security;

-- Policies: allow users to access their own rows; allow anonymous access to rows with user_id = 'anon'
create policy if not exists select_own_or_anon on public.suggestions_cache
  for select
  using ((auth.uid() is not null and user_id = auth.uid()::text) or user_id = 'anon');

create policy if not exists insert_own_or_anon on public.suggestions_cache
  for insert
  with check ((auth.uid() is not null and user_id = auth.uid()::text) or user_id = 'anon');

create policy if not exists update_own_or_anon on public.suggestions_cache
  for update
  using ((auth.uid() is not null and user_id = auth.uid()::text) or user_id = 'anon')
  with check ((auth.uid() is not null and user_id = auth.uid()::text) or user_id = 'anon');

commit;
