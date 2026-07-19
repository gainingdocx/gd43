-- M6 search surface (BUILD_SPEC §M6.5). The GIN/trigram indexes shipped in
-- the init migration; this adds the RLS-respecting search function.
-- SECURITY INVOKER (default for language sql): the caller's RLS applies to
-- documents and containers, and the owner filter is belt-and-braces.

create or replace function public.search_documents(q text)
returns setof public.documents
language sql
stable
set search_path = ''
as $$
  select d.*
  from public.documents d
  where d.owner = (select auth.uid())
    and char_length(q) >= 2
    and (
      d.fields->>'bl_number' ilike '%' || q || '%'
      or d.fields->>'invoice_no' ilike '%' || q || '%'
      or d.fields->>'pl_no' ilike '%' || q || '%'
      or d.fields->>'vessel_name' ilike '%' || q || '%'
      or d.fields->'shipper'->>'name' ilike '%' || q || '%'
      or d.fields->'consignee'->>'name' ilike '%' || q || '%'
      or d.fields->'seller'->>'name' ilike '%' || q || '%'
      or d.fields->'buyer'->>'name' ilike '%' || q || '%'
      or d.fields->'port_of_load'->>'name' ilike '%' || q || '%'
      or d.fields->'port_of_discharge'->>'name' ilike '%' || q || '%'
      or exists (
        select 1 from public.containers c
        where c.document_id = d.id
          and c.container_no ilike '%' || q || '%'
      )
    )
  order by d.created_at desc
  limit 50
$$;

revoke execute on function public.search_documents(text) from public, anon;
grant execute on function public.search_documents(text) to authenticated;
