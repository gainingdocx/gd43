-- Dedicated structured parser types advertised on the public site.
alter table public.documents drop constraint if exists documents_doc_type_check;
alter table public.documents add constraint documents_doc_type_check
  check (doc_type in (
    'bill_of_lading', 'sea_waybill', 'commercial_invoice', 'packing_list',
    'arrival_notice', 'booking_confirmation', 'other'
  ));

create index if not exists documents_doc_type_idx on public.documents (owner, doc_type, created_at desc);
