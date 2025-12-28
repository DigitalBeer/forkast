-- Extend profiles table with dietary preferences and measurement system
-- Story 3.12: User Profile Management

begin;

-- Add subscription_status column if it doesn't exist
alter table public.profiles 
add column if not exists subscription_status text default 'free' 
check (subscription_status in ('free', 'premium'));

-- Add dietary_preferences column (text array for multi-select)
alter table public.profiles 
add column if not exists dietary_preferences text[] default '{}';

-- Add measurement_system column with default 'metric'
alter table public.profiles 
add column if not exists measurement_system text default 'metric' 
check (measurement_system in ('metric', 'imperial'));

-- Add updated_at column if it doesn't exist
alter table public.profiles 
add column if not exists updated_at timestamptz default now();

commit;
