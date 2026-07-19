-- GainingDocx initial schema (BUILD_SPEC §M2).
-- All tables RLS ON, owner-scoped. The service_role key bypasses RLS (webhooks).

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, auto-created by trigger.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  company text,
  plan text not null default 'free',
  docs_used_this_month int not null default 0,
  period_start date not null default (now()::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- shipments: grouping spine for documents.
-- ---------------------------------------------------------------------------
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  ref text,
  bl_number text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- documents: one row per uploaded/parsed document.
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  shipment_id uuid references public.shipments (id) on delete set null,
  doc_type text not null default 'other'
    check (doc_type in ('bill_of_lading', 'commercial_invoice', 'packing_list', 'other')),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'parsing', 'parsed', 'failed')),
  storage_path text,
  page_count int,
  raw_extraction jsonb,
  fields jsonb,
  validation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- containers: one row per container extracted from a document.
-- ---------------------------------------------------------------------------
create table public.containers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  container_no text,
  seal_no text,
  iso_type text,
  packages int,
  package_type text,
  gross_kg numeric,
  volume_cbm numeric,
  check_digit_valid boolean
);

-- ---------------------------------------------------------------------------
-- discrepancies: cross-document check results per shipment.
-- ---------------------------------------------------------------------------
create table public.discrepancies (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  severity text not null check (severity in ('red', 'amber')),
  field text not null,
  doc_a uuid references public.documents (id) on delete cascade,
  doc_b uuid references public.documents (id) on delete cascade,
  value_a text,
  value_b text,
  message text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- events: append-only audit trail (no user update/delete).
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- subscriptions: written ONLY by the Paddle webhook (service role).
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  owner uuid primary key references auth.users (id) on delete cascade,
  paddle_customer_id text,
  paddle_sub_id text,
  status text,
  plan text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (list views, auto-linking, and the M6 search surface).
-- ---------------------------------------------------------------------------
create index shipments_owner_created_idx on public.shipments (owner, created_at desc);
create index shipments_owner_bl_idx on public.shipments (owner, bl_number);
create index documents_owner_created_idx on public.documents (owner, created_at desc);
create index documents_shipment_idx on public.documents (shipment_id);
create index documents_fields_gin_idx on public.documents using gin (fields);
create index containers_document_idx on public.containers (document_id);
create index containers_owner_idx on public.containers (owner);
create index containers_no_trgm_idx on public.containers using gin (container_no gin_trgm_ops);
create index discrepancies_shipment_idx on public.discrepancies (shipment_id);
create index discrepancies_owner_open_idx on public.discrepancies (owner, resolved);
create index events_owner_created_idx on public.events (owner, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security. Default deny; owner-scoped policies for authenticated.
-- service_role bypasses RLS entirely.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.shipments enable row level security;
alter table public.documents enable row level security;
alter table public.containers enable row level security;
alter table public.discrepancies enable row level security;
alter table public.events enable row level security;
alter table public.subscriptions enable row level security;

-- profiles: read + limited update of own row. plan / docs_used_this_month /
-- period_start are entitlement fields — writable only via service role, so
-- column-level grants restrict what authenticated may update.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (full_name, company) on public.profiles to authenticated;

-- shipments: full owner CRUD.
create policy "shipments_select_own" on public.shipments
  for select to authenticated using (owner = (select auth.uid()));
create policy "shipments_insert_own" on public.shipments
  for insert to authenticated with check (owner = (select auth.uid()));
create policy "shipments_update_own" on public.shipments
  for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "shipments_delete_own" on public.shipments
  for delete to authenticated using (owner = (select auth.uid()));

-- documents: full owner CRUD.
create policy "documents_select_own" on public.documents
  for select to authenticated using (owner = (select auth.uid()));
create policy "documents_insert_own" on public.documents
  for insert to authenticated with check (owner = (select auth.uid()));
create policy "documents_update_own" on public.documents
  for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "documents_delete_own" on public.documents
  for delete to authenticated using (owner = (select auth.uid()));

-- containers: full owner CRUD.
create policy "containers_select_own" on public.containers
  for select to authenticated using (owner = (select auth.uid()));
create policy "containers_insert_own" on public.containers
  for insert to authenticated with check (owner = (select auth.uid()));
create policy "containers_update_own" on public.containers
  for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "containers_delete_own" on public.containers
  for delete to authenticated using (owner = (select auth.uid()));

-- discrepancies: full owner CRUD (resolver writes corrections).
create policy "discrepancies_select_own" on public.discrepancies
  for select to authenticated using (owner = (select auth.uid()));
create policy "discrepancies_insert_own" on public.discrepancies
  for insert to authenticated with check (owner = (select auth.uid()));
create policy "discrepancies_update_own" on public.discrepancies
  for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "discrepancies_delete_own" on public.discrepancies
  for delete to authenticated using (owner = (select auth.uid()));

-- events: append-only audit trail — select + insert only, never mutate.
create policy "events_select_own" on public.events
  for select to authenticated using (owner = (select auth.uid()));
create policy "events_insert_own" on public.events
  for insert to authenticated with check (owner = (select auth.uid()));

-- subscriptions: read-only for owners; all writes come from the Paddle
-- webhook via service role. An owner-write policy here would let users grant
-- themselves Pro.
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated using (owner = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: private "docs" bucket, paths are userId/docId/page-N.jpg.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'docs', 'docs', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "docs_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'docs' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "docs_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'docs' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "docs_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'docs' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'docs' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "docs_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'docs' and (storage.foldername(name))[1] = (select auth.uid()::text));
