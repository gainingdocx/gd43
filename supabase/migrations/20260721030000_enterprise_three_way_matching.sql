-- Enterprise three-way matching: PO + transport/receipt evidence + invoice.
alter table public.documents drop constraint if exists documents_doc_type_check;
alter table public.documents add constraint documents_doc_type_check
  check (doc_type in (
    'bill_of_lading', 'sea_waybill', 'commercial_invoice', 'purchase_order',
    'freight_invoice', 'goods_receipt', 'packing_list', 'arrival_notice',
    'booking_confirmation', 'other'
  ));

alter table public.discrepancies
  add column if not exists category text,
  add column if not exists tolerance jsonb,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.match_runs (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  schema_version text not null,
  decision text not null check (decision in ('matched', 'review', 'blocked', 'incomplete')),
  score integer not null check (score between 0 and 100),
  policy jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists match_runs_shipment_created_idx
  on public.match_runs (shipment_id, created_at desc);
create index if not exists match_runs_owner_decision_idx
  on public.match_runs (owner, decision, created_at desc);

alter table public.match_runs enable row level security;
create policy "match_runs_select_own" on public.match_runs
  for select to authenticated using (owner = (select auth.uid()));
create policy "match_runs_insert_own" on public.match_runs
  for insert to authenticated with check (
    owner = (select auth.uid())
    and exists (
      select 1
      from public.shipments
      where shipments.id = match_runs.shipment_id
        and shipments.owner = (select auth.uid())
    )
  );

-- Match runs are immutable audit records. Re-running creates a new row.
revoke all on public.match_runs from anon, authenticated;
grant select, insert on public.match_runs to authenticated;
