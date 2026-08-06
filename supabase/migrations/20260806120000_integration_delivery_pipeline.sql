-- Durable integration delivery: retries, dead-letter, replay, and chat destinations.
--
-- Deliveries were previously fire-and-forget: one attempt, and a customer whose
-- endpoint was down for thirty seconds simply lost the event with no way to get
-- it back. An integration that silently drops data is worse than no integration,
-- because the customer believes their downstream system is in sync.
--
-- The row is now the queue. A delivery is inserted as `pending` with the payload
-- it must send, attempted immediately, and rescheduled on failure until it
-- either succeeds or exhausts its attempts and becomes `dead` — visible, and
-- replayable by hand.

-- ---------------------------------------------------------------------------
-- Destinations: a webhook endpoint, a Slack channel or a Teams channel.
-- ---------------------------------------------------------------------------
-- Slack and Teams incoming webhooks are URLs that accept an unsigned JSON body,
-- so they fit the existing endpoint row exactly. Modelling them as a `kind`
-- rather than a separate table means retries, delivery history and replay work
-- for chat notifications on day one instead of being reimplemented per channel.
alter table public.webhook_endpoints
  add column if not exists kind text not null default 'webhook'
    check (kind in ('webhook', 'slack', 'teams')),
  add column if not exists min_severity text not null default 'all'
    check (min_severity in ('all', 'critical'));

-- The full catalogue from lib/integrations/events.ts. Existing endpoints keep
-- the events they subscribed to; only the default for new rows changes, because
-- silently widening an existing subscription would start sending a customer
-- traffic they never asked for.
alter table public.webhook_endpoints alter column events set default array[
  'document.received', 'document.parsing_started', 'document.parsed', 'document.failed',
  'document.review_required', 'document.approved', 'document.corrected',
  'shipment.created', 'shipment.matched',
  'discrepancy.created', 'discrepancy.resolved',
  'report.generated', 'integration.delivery_failed',
  'hs.reviewed', 'charge.alert', 'review.updated', 'export.approval'
];

-- ---------------------------------------------------------------------------
-- Deliveries: the queue.
-- ---------------------------------------------------------------------------
alter table public.webhook_deliveries
  -- The body to send. Stored so a retry sends byte-identical content to the
  -- first attempt — regenerating it would let a since-changed shipment produce
  -- a "retry" the receiver has no way to reconcile with the original.
  add column if not exists payload jsonb,
  add column if not exists attempt int not null default 1,
  add column if not exists max_attempts int not null default 6,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists delivered_at timestamptz,
  add column if not exists duration_ms int,
  -- Sent as `Idempotency-Key`, stable across every attempt of one event, so a
  -- receiver that processed attempt 2 can discard attempt 3 after a timeout.
  add column if not exists idempotency_key text,
  add column if not exists replay_of uuid references public.webhook_deliveries (id) on delete set null;

alter table public.webhook_deliveries drop constraint if exists webhook_deliveries_status_check;
alter table public.webhook_deliveries add constraint webhook_deliveries_status_check
  check (status in ('pending', 'delivered', 'failed', 'dead'));

update public.webhook_deliveries
  set idempotency_key = event_id::text
  where idempotency_key is null;

-- The retry worker's only query: due work, oldest first.
create index if not exists webhook_deliveries_due_idx
  on public.webhook_deliveries (next_attempt_at)
  where status = 'pending';

create index if not exists webhook_deliveries_endpoint_idx
  on public.webhook_deliveries (endpoint_id, attempted_at desc);

-- One event is delivered to one endpoint once. Two concurrent parses of the
-- same document cannot double-notify, and an enqueue can be retried safely.
create unique index if not exists webhook_deliveries_idempotency_idx
  on public.webhook_deliveries (endpoint_id, idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- Column grants.
-- ---------------------------------------------------------------------------
-- Both tables use column-level grants rather than a table-level one, so a new
-- column is invisible until it is named here. This is not a nicety: PostgREST
-- fails the *entire* select when one column is not granted, so the delivery log
-- would return an error rather than simply omitting the new fields.
--
-- webhook_endpoints keeps column grants so `signing_secret` never reaches the
-- browser. Everything else about a destination is the customer's own.
grant select (id, owner, url, description, enabled, events, created_at, kind, min_severity)
  on public.webhook_endpoints to authenticated;
-- The insert path is the workspace's own "Add destination" form, which writes
-- both new columns; without these it fails the same way.
grant insert (kind, min_severity), update (kind, min_severity)
  on public.webhook_endpoints to authenticated;

-- webhook_deliveries holds nothing the owner may not see — `payload` is their
-- own event body, and being able to read back the exact bytes that were sent is
-- the point of keeping a delivery log at all.
grant select (
  id, owner, endpoint_id, event_type, event_id, status, response_status, error, attempted_at,
  payload, attempt, max_attempts, next_attempt_at, delivered_at, duration_ms, idempotency_key, replay_of
) on public.webhook_deliveries to authenticated;

comment on column public.webhook_deliveries.payload is
  'Exact body sent. Retained so a replay reproduces the original event rather than a fresh snapshot.';
comment on column public.webhook_deliveries.status is
  'pending = queued or awaiting retry; delivered = 2xx; failed = terminal for this attempt; dead = attempts exhausted, replayable by hand.';
