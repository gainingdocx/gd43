-- Paddle billing support.
-- Additive only: the subscriptions table already exists (owner-keyed, written
-- solely by the Paddle webhook via the service role). Here we add two columns
-- the account UI reads, and an idempotency ledger so a webhook redelivery of
-- the same event_id is processed at most once.

alter table public.subscriptions
  add column if not exists price_id text,
  add column if not exists scheduled_change_at timestamptz;

-- One row per delivered Paddle event. event_id is Paddle's stable id, identical
-- across retries, so a primary-key conflict means "already processed".
create table if not exists public.paddle_webhook_events (
  event_id text primary key,
  event_type text,
  received_at timestamptz not null default now()
);

-- Service-role only. RLS on with no policies blocks anon/authenticated entirely;
-- the webhook uses the service role, which bypasses RLS.
alter table public.paddle_webhook_events enable row level security;
