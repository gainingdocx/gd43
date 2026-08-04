-- Per-key rate limiting and usage accounting for the public API.
--
-- Counting lives in Postgres rather than in the worker because Cloudflare runs
-- many isolates concurrently: an in-memory counter would let a client multiply
-- its quota by however many isolates happen to be warm. A single atomic upsert
-- against a fixed-width window is cheap and correct across all of them.

create table if not exists public.api_usage (
  key_id uuid not null references public.api_keys (id) on delete cascade,
  -- Truncated to the window size, so a row is the bucket itself.
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key_id, window_start)
);

comment on table public.api_usage is
  'Fixed-window request counts per API key. One row per key per window.';

-- Owners may read their own usage; nothing writes through the anon/auth roles.
alter table public.api_usage enable row level security;

drop policy if exists "api_usage_select_own" on public.api_usage;
create policy "api_usage_select_own" on public.api_usage for select to authenticated
  using (
    exists (
      select 1 from public.api_keys k
      where k.id = api_usage.key_id and k.owner = (select auth.uid())
    )
  );

/**
 * Atomically consume one request against a key's quota.
 *
 * Returns the decision plus the headers a caller needs to be a good citizen:
 * how many requests remain and when the window resets. The insert-on-conflict
 * is what makes this safe under concurrency — two simultaneous requests cannot
 * both read the same pre-increment value.
 */
create or replace function public.api_rate_limit(
  p_key_id uuid,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, used integer, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  -- Floor "now" to the start of its window bucket.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_usage (key_id, window_start, count)
  values (p_key_id, v_window_start, 1)
  on conflict (key_id, window_start)
  do update set count = public.api_usage.count + 1
  returning public.api_usage.count into v_count;

  return query select
    v_count <= p_limit,
    v_count,
    greatest(p_limit - v_count, 0),
    v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.api_rate_limit(uuid, integer, integer) from public, anon, authenticated;

-- Old buckets have no value once their window has passed; the daily cron clears
-- them so this table cannot grow without bound.
create index if not exists api_usage_window_idx on public.api_usage (window_start);
