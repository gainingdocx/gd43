-- Content-free parsing telemetry and incident state. No extracted values,
-- filenames, parties, identifiers or source evidence are stored here.

create table if not exists public.parse_metrics (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  owner uuid references auth.users(id) on delete set null,
  channel text not null check (channel in ('web', 'api', 'email')),
  outcome text not null check (outcome in ('success', 'failed', 'rejected')),
  document_type text,
  provider text,
  model text,
  page_count integer not null default 0 check (page_count >= 0),
  duration_ms integer not null check (duration_ms >= 0),
  quality_score integer check (quality_score between 0 and 100),
  escalated boolean not null default false,
  blocking_failures integer not null default 0 check (blocking_failures >= 0),
  failure_code text,
  created_at timestamptz not null default now()
);
create index if not exists parse_metrics_created_idx on public.parse_metrics(created_at desc);
create index if not exists parse_metrics_outcome_created_idx on public.parse_metrics(outcome, created_at desc);
create index if not exists parse_metrics_model_created_idx on public.parse_metrics(model, created_at desc);

create table if not exists public.service_incidents (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  incident_key text not null,
  severity text not null check (severity in ('warning', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  title text not null,
  details jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  notified_at timestamptz,
  unique (service, incident_key)
);
create index if not exists service_incidents_status_seen_idx on public.service_incidents(status, last_seen_at desc);

alter table public.parse_metrics enable row level security;
alter table public.service_incidents enable row level security;
revoke all on public.parse_metrics from public, anon, authenticated;
revoke all on public.service_incidents from public, anon, authenticated;
revoke all on sequence public.parse_metrics_id_seq from public, anon, authenticated;

create or replace function public.parse_health_dashboard(p_since timestamptz)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'requests', count(*),
      'successes', count(*) filter (where outcome = 'success'),
      'failures', count(*) filter (where outcome = 'failed'),
      'rejected', count(*) filter (where outcome = 'rejected'),
      'review_required', count(*) filter (where blocking_failures > 0),
      'average_quality', round(avg(quality_score) filter (where outcome = 'success'), 1),
      'average_duration_ms', round(avg(duration_ms) filter (where outcome = 'success')),
      'p95_duration_ms', percentile_cont(0.95) within group (order by duration_ms) filter (where outcome = 'success')
    ),
    'by_model', coalesce((
      select jsonb_agg(to_jsonb(m) order by m.requests desc)
      from (
        select coalesce(model, 'none') model, coalesce(provider, 'none') provider,
          count(*) requests,
          count(*) filter (where outcome = 'failed') failures,
          round(avg(duration_ms)) average_duration_ms,
          round(avg(quality_score) filter (where outcome = 'success'), 1) average_quality
        from public.parse_metrics where created_at >= p_since
        group by model, provider
      ) m
    ), '[]'::jsonb),
    'by_document_type', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.requests desc)
      from (
        select coalesce(document_type, 'unknown') document_type,
          count(*) requests,
          count(*) filter (where outcome = 'failed') failures,
          count(*) filter (where blocking_failures > 0) review_required,
          round(avg(quality_score) filter (where outcome = 'success'), 1) average_quality
        from public.parse_metrics where created_at >= p_since
        group by document_type
      ) d
    ), '[]'::jsonb),
    'failures', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.count desc)
      from (
        select coalesce(failure_code, 'unknown') failure_code, count(*) count
        from public.parse_metrics where created_at >= p_since and outcome <> 'success'
        group by failure_code
      ) f
    ), '[]'::jsonb)
  )
  from public.parse_metrics where created_at >= p_since;
$$;

revoke all on function public.parse_health_dashboard(timestamptz) from public, anon, authenticated;
grant execute on function public.parse_health_dashboard(timestamptz) to service_role;
