-- First-party product analytics and feedback inbox.
-- Both tables are service-role only: browsers write through validated API
-- routes and administrators read through server-side, allowlisted pages.

create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('suggestion', 'problem', 'praise', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  email text,
  page_path text not null default '/',
  visitor_id uuid,
  session_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  country_code text,
  status text not null default 'unread' check (status in ('unread', 'read', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_email_length check (email is null or char_length(email) <= 254),
  constraint feedback_page_path_length check (char_length(page_path) <= 500),
  constraint feedback_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create index if not exists feedback_submissions_created_idx
  on public.feedback_submissions (created_at desc);
create index if not exists feedback_submissions_status_idx
  on public.feedback_submissions (status, created_at desc);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'feature_use')),
  feature text not null,
  path text not null,
  visitor_id uuid not null,
  session_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  country_code text,
  referrer_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device_type text not null default 'unknown' check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  language text,
  occurred_at timestamptz not null default now(),
  constraint analytics_feature_length check (char_length(feature) between 1 and 100),
  constraint analytics_path_length check (char_length(path) between 1 and 500),
  constraint analytics_country_code_format check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create index if not exists analytics_events_occurred_idx
  on public.analytics_events (occurred_at desc);
create index if not exists analytics_events_feature_idx
  on public.analytics_events (feature, occurred_at desc);
create index if not exists analytics_events_visitor_idx
  on public.analytics_events (visitor_id, occurred_at desc);
create index if not exists analytics_events_session_idx
  on public.analytics_events (session_id, occurred_at desc);

alter table public.feedback_submissions enable row level security;
alter table public.analytics_events enable row level security;

revoke all on public.feedback_submissions from anon, authenticated;
revoke all on public.analytics_events from anon, authenticated;
revoke all on sequence public.analytics_events_id_seq from anon, authenticated;

-- Return an already-aggregated dashboard payload so the admin page remains
-- accurate beyond PostgREST's normal row-return limit.
create or replace function public.admin_analytics_dashboard(p_since timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'totals', (
      select jsonb_build_object(
        'page_views', count(*) filter (where event_type = 'page_view'),
        'feature_uses', count(*) filter (where event_type = 'feature_use'),
        'visitors', count(distinct visitor_id),
        'sessions', count(distinct session_id)
      )
      from public.analytics_events
      where occurred_at >= p_since
    ),
    'daily', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.day)
      from (
        select
          occurred_at::date as day,
          count(*) filter (where event_type = 'page_view') as page_views,
          count(distinct visitor_id) as visitors
        from public.analytics_events
        where occurred_at >= p_since
        group by occurred_at::date
      ) d
    ), '[]'::jsonb),
    'features', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.views desc, f.feature)
      from (
        select feature, count(*) as views, count(distinct visitor_id) as visitors
        from public.analytics_events
        where occurred_at >= p_since
        group by feature
        order by views desc
        limit 15
      ) f
    ), '[]'::jsonb),
    'pages', coalesce((
      select jsonb_agg(to_jsonb(p) order by p.views desc, p.path)
      from (
        select path, count(*) as views, count(distinct visitor_id) as visitors
        from public.analytics_events
        where occurred_at >= p_since and event_type = 'page_view'
        group by path
        order by views desc
        limit 15
      ) p
    ), '[]'::jsonb),
    'countries', coalesce((
      select jsonb_agg(to_jsonb(c) order by c.views desc, c.country)
      from (
        select coalesce(country_code, 'Unknown') as country, count(*) as views
        from public.analytics_events
        where occurred_at >= p_since
        group by coalesce(country_code, 'Unknown')
        order by views desc
        limit 12
      ) c
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.views desc, r.referrer)
      from (
        select coalesce(nullif(referrer_host, ''), 'Direct') as referrer, count(*) as views
        from public.analytics_events
        where occurred_at >= p_since and event_type = 'page_view'
        group by coalesce(nullif(referrer_host, ''), 'Direct')
        order by views desc
        limit 12
      ) r
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(to_jsonb(v) order by v.views desc, v.device)
      from (
        select device_type as device, count(*) as views
        from public.analytics_events
        where occurred_at >= p_since
        group by device_type
        order by views desc
      ) v
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.admin_analytics_dashboard(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_analytics_dashboard(timestamptz) to service_role;
