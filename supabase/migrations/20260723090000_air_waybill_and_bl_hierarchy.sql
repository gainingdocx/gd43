alter table public.documents drop constraint if exists documents_doc_type_check;
alter table public.documents add constraint documents_doc_type_check
  check (doc_type in (
    'bill_of_lading', 'sea_waybill', 'air_waybill', 'commercial_invoice',
    'purchase_order', 'freight_invoice', 'goods_receipt', 'packing_list',
    'arrival_notice', 'booking_confirmation', 'other'
  ));
