-- Idempotency ledger for the Stripe webhook handler. Stripe retries
-- webhook deliveries on timeout/5xx, and without this a retried
-- `customer.subscription.deleted` (for example) arriving after the user
-- already re-subscribed could downgrade a paying user. The webhook route
-- inserts the Stripe event id here before processing; a unique-violation
-- means it has already been handled, and the handler short-circuits.
create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

-- RLS enabled with no policies: only the service-role client the webhook
-- route already uses can read/write this table (service-role bypasses RLS).
-- No anon/authenticated grants are needed or intended.
alter table public.stripe_webhook_events enable row level security;
