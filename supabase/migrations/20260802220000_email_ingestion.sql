-- Email-in ingestion: every account receives a private, revocable forwarding
-- address. Inbound webhook events are idempotent and auditable.

alter table public.profiles
  add column if not exists email_ingest_token text not null
    default lower(replace(gen_random_uuid()::text, '-', '')),
  add column if not exists email_ingest_enabled boolean not null default true,
  add column if not exists email_ingest_reply boolean not null default true;

create unique index if not exists profiles_email_ingest_token_unique
  on public.profiles (email_ingest_token);

create table if not exists public.email_ingestions (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  provider_email_id text not null unique,
  sender text not null,
  recipient text not null,
  subject text,
  status text not null default 'accepted'
    check (status in ('accepted', 'processing', 'processed', 'partial', 'failed', 'rejected')),
  attachment_count integer not null default 0,
  processed_count integer not null default 0,
  document_ids uuid[] not null default '{}',
  shipment_ids uuid[] not null default '{}',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists email_ingestions_owner_created_idx
  on public.email_ingestions(owner, created_at desc);

alter table public.documents
  add column if not exists ingestion_id uuid references public.email_ingestions(id) on delete set null,
  add column if not exists source_channel text not null default 'manual'
    check (source_channel in ('manual', 'email', 'api'));

create index if not exists documents_ingestion_idx on public.documents(ingestion_id);

alter table public.email_ingestions enable row level security;
drop policy if exists "email_ingestions_select_own" on public.email_ingestions;
create policy "email_ingestions_select_own" on public.email_ingestions
  for select to authenticated using (owner = (select auth.uid()));

-- Address rotation and intake preferences go through authenticated server
-- actions so the private token is never client-writable.
revoke update (email_ingest_token, email_ingest_enabled, email_ingest_reply)
  on public.profiles from authenticated;

drop trigger if exists email_ingestions_updated_at on public.email_ingestions;
create trigger email_ingestions_updated_at before update on public.email_ingestions
  for each row execute function public.set_updated_at();
