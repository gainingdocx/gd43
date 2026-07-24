-- Bring previously parsed documents into the new operational workflows.

update public.shipments as shipment
set bill_level = 'master'
from public.documents as document
where document.shipment_id = shipment.id
  and document.doc_type = 'bill_of_lading'
  and document.fields->>'bl_level' = 'master';

update public.shipments as shipment
set bill_level = 'house',
    house_bl_number = coalesce(
      nullif(document.fields->>'house_bl_number', ''),
      nullif(document.fields->>'bl_number', ''),
      shipment.bl_number
    )
from public.documents as document
where document.shipment_id = shipment.id
  and document.doc_type = 'bill_of_lading'
  and document.fields->>'bl_level' = 'house';

insert into public.shipments (owner, bl_number, bill_level)
select distinct document.owner, document.fields->>'master_bl_number', 'master'
from public.documents as document
where document.doc_type = 'bill_of_lading'
  and document.fields->>'bl_level' = 'house'
  and nullif(document.fields->>'master_bl_number', '') is not null
  and not exists (
    select 1 from public.shipments as master
    where master.owner = document.owner
      and upper(regexp_replace(coalesce(master.bl_number, ''), '[^A-Za-z0-9]', '', 'g'))
        = upper(regexp_replace(document.fields->>'master_bl_number', '[^A-Za-z0-9]', '', 'g'))
  );

update public.shipments as house
set master_shipment_id = (
  select master.id
  from public.shipments as master
  where master.owner = house.owner
    and master.bill_level = 'master'
    and upper(regexp_replace(coalesce(master.bl_number, ''), '[^A-Za-z0-9]', '', 'g'))
      = upper(regexp_replace(document.fields->>'master_bl_number', '[^A-Za-z0-9]', '', 'g'))
  order by master.created_at
  limit 1
)
from public.documents as document
where document.shipment_id = house.id
  and document.doc_type = 'bill_of_lading'
  and document.fields->>'bl_level' = 'house'
  and nullif(document.fields->>'master_bl_number', '') is not null;

insert into public.hs_reviews (
  owner, document_id, line_index, product_description, suggested_code,
  confidence, reason, duty_rate
)
select
  document.owner,
  document.id,
  line.ordinality::int - 1,
  line.item->>'description',
  line.item->>'hs_code_suggestion',
  line.item->>'hs_suggestion_confidence',
  line.item->>'hs_suggestion_reason',
  line.item->>'us_general_duty_rate'
from public.documents as document
cross join lateral jsonb_array_elements(
  case when jsonb_typeof(document.fields->'line_items') = 'array'
    then document.fields->'line_items' else '[]'::jsonb end
)
  with ordinality as line(item, ordinality)
where document.status = 'parsed'
  and jsonb_typeof(document.fields->'line_items') = 'array'
  and coalesce(line.item->>'hs_code_suggestion', '') ~ '^[0-9]{6}$'
  and line.item->>'hs_suggestion_confidence' in ('low', 'medium', 'high')
on conflict (document_id, line_index) do nothing;
