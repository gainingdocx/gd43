-- Logical documents split from one uploaded file, plus outbound TMS/ERP connections.
alter table public.documents
  add column if not exists source_pages integer[] not null default '{}'::integer[],
  add column if not exists source_document_id uuid references public.documents(id) on delete set null,
  add column if not exists logical_group_index integer,
  add column if not exists logical_group_count integer,
  add column if not exists logical_child boolean not null default false;

alter table public.discrepancies
  add column if not exists questioned_amount numeric,
  add column if not exists questioned_currency text;

create index if not exists documents_source_document_idx on public.documents(source_document_id);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  profile text not null check (profile in ('canonical_json','cargowise','sap_tm','magaya','flexport','custom')),
  endpoint_url text not null,
  auth_type text not null check (auth_type in ('bearer','api_key','basic','none')),
  auth_header text,
  encrypted_credentials text,
  enabled boolean not null default true,
  last_test_status integer,
  last_tested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_pushes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  status text not null check (status in ('delivered','failed')),
  response_status integer,
  error text,
  attempted_at timestamptz not null default now()
);

alter table public.integration_connections enable row level security;
alter table public.integration_pushes enable row level security;

create policy "integration_connections_own" on public.integration_connections for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "integration_pushes_select_own" on public.integration_pushes for select to authenticated
  using (owner = (select auth.uid()));

revoke select on public.integration_connections from authenticated;
grant select (id, owner, name, profile, endpoint_url, auth_type, auth_header, enabled, last_test_status, last_tested_at, created_at, updated_at)
  on public.integration_connections to authenticated;
