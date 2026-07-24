-- Operational workflows: true MBL/HBL hierarchy, HS approvals, API keys,
-- outbound webhooks, and batch provenance.

alter table public.shipments
  add column if not exists bill_level text not null default 'standalone'
    check (bill_level in ('master', 'house', 'standalone')),
  add column if not exists master_shipment_id uuid references public.shipments (id) on delete set null,
  add column if not exists house_bl_number text;

create index if not exists shipments_master_children_idx
  on public.shipments (master_shipment_id, created_at);
create unique index if not exists shipments_owner_house_bl_unique
  on public.shipments (owner, upper(regexp_replace(house_bl_number, '[^A-Za-z0-9]', '', 'g')))
  where house_bl_number is not null;

alter table public.documents
  add column if not exists batch_id uuid,
  add column if not exists source_filename text;
create index if not exists documents_owner_batch_idx on public.documents (owner, batch_id);

create table if not exists public.hs_reviews (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  line_index int not null check (line_index >= 0),
  product_description text,
  suggested_code text not null check (suggested_code ~ '^[0-9]{6}$'),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  reason text,
  duty_rate text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decision_note text,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, line_index)
);
create index if not exists hs_reviews_owner_status_idx on public.hs_reviews (owner, status, created_at desc);
create trigger hs_reviews_updated_at before update on public.hs_reviews
  for each row execute function public.set_updated_at();

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists api_keys_owner_created_idx on public.api_keys (owner, created_at desc);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  url text not null check (url ~ '^https://'),
  description text,
  signing_secret text not null,
  enabled boolean not null default true,
  events text[] not null default array['document.parsed', 'document.failed', 'hs.reviewed'],
  created_at timestamptz not null default now()
);
create index if not exists webhook_endpoints_owner_idx on public.webhook_endpoints (owner, enabled);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  endpoint_id uuid not null references public.webhook_endpoints (id) on delete cascade,
  event_type text not null,
  event_id uuid not null default gen_random_uuid(),
  status text not null check (status in ('delivered', 'failed')),
  response_status int,
  error text,
  attempted_at timestamptz not null default now()
);
create index if not exists webhook_deliveries_owner_attempted_idx
  on public.webhook_deliveries (owner, attempted_at desc);

alter table public.hs_reviews enable row level security;
alter table public.api_keys enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy "hs_reviews_select_own" on public.hs_reviews for select to authenticated
  using (owner = (select auth.uid()));
create policy "hs_reviews_insert_own" on public.hs_reviews for insert to authenticated
  with check (owner = (select auth.uid()));
create policy "hs_reviews_update_own" on public.hs_reviews for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

create policy "api_keys_select_own" on public.api_keys for select to authenticated
  using (owner = (select auth.uid()));
create policy "api_keys_insert_own" on public.api_keys for insert to authenticated
  with check (owner = (select auth.uid()));
create policy "api_keys_update_own" on public.api_keys for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "api_keys_delete_own" on public.api_keys for delete to authenticated
  using (owner = (select auth.uid()));

create policy "webhook_endpoints_select_own" on public.webhook_endpoints for select to authenticated
  using (owner = (select auth.uid()));
create policy "webhook_endpoints_insert_own" on public.webhook_endpoints for insert to authenticated
  with check (owner = (select auth.uid()));
create policy "webhook_endpoints_update_own" on public.webhook_endpoints for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "webhook_endpoints_delete_own" on public.webhook_endpoints for delete to authenticated
  using (owner = (select auth.uid()));

create policy "webhook_deliveries_select_own" on public.webhook_deliveries for select to authenticated
  using (owner = (select auth.uid()));

-- Secrets remain server-only after the one-time creation response.
revoke select on public.api_keys from authenticated;
grant select (id, owner, name, key_prefix, last_used_at, created_at, revoked_at)
  on public.api_keys to authenticated;
revoke select on public.webhook_endpoints from authenticated;
grant select (id, owner, url, description, enabled, events, created_at)
  on public.webhook_endpoints to authenticated;
