-- Workflow-first freight document control: new evidence types and review provenance.
alter table public.documents drop constraint if exists documents_doc_type_check;
alter table public.documents add constraint documents_doc_type_check
  check (doc_type in (
    'bill_of_lading', 'sea_waybill', 'air_waybill', 'commercial_invoice',
    'purchase_order', 'freight_invoice', 'demurrage_detention_invoice',
    'goods_receipt', 'packing_list', 'arrival_notice', 'booking_confirmation',
    'shipping_instructions', 'certificate_of_origin', 'quotation',
    'rate_confirmation', 'container_event', 'other'
  ));

alter table public.discrepancies drop constraint if exists discrepancies_severity_check;
alter table public.discrepancies add constraint discrepancies_severity_check
  check (severity in ('red', 'amber', 'info'));

alter table public.discrepancies
  add column if not exists workflow_key text,
  add column if not exists rule_reason text,
  add column if not exists source_evidence jsonb not null default '{}'::jsonb,
  add column if not exists resolution_status text,
  add column if not exists resolved_by uuid references auth.users (id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolution_note text;

create index if not exists discrepancies_workflow_open_idx
  on public.discrepancies (shipment_id, workflow_key, resolved, severity);
