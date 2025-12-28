-- Create meal_history table
drop table if exists public.meal_history cascade;

create table public.meal_history (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_id bigint references public.meals(id) on delete cascade not null,
  action_type text not null check (action_type in ('viewed', 'planned', 'cooked', 'skipped')),
  action_date timestamptz default now() not null,
  additional_data jsonb default '{}'::jsonb
);

-- Add indexes for performance
create index idx_meal_history_user_id on public.meal_history(user_id);
create index idx_meal_history_meal_id on public.meal_history(meal_id);
create index idx_meal_history_action_date on public.meal_history(action_date);

-- Enable Row Level Security
alter table public.meal_history enable row level security;

-- Create policies for Row Level Security
create policy "Users can view their own meal history"
on public.meal_history for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own meal history"
on public.meal_history for insert
to authenticated
with check (auth.uid() = user_id);

-- Create a function to record meal history
create or replace function public.record_meal_history(
  p_meal_id bigint,
  p_action_type text,
  p_additional_data jsonb default '{}'::jsonb
) returns void as $$
begin
  insert into public.meal_history (user_id, meal_id, action_type, additional_data)
  values (auth.uid(), p_meal_id, p_action_type, p_additional_data);
end;
$$ language plpgsql security definer SET search_path = public;
