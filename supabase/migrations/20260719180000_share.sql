-- M7 share links (BUILD_SPEC §M7): public read-only view of one document
-- via an unguessable token, revocable by clearing the column. The public
-- reader is a SECURITY DEFINER function so anon needs no table grants and
-- gets exactly the whitelisted columns, nothing else.

alter table public.documents add column if not exists share_token text;
create unique index if not exists documents_share_token_idx
  on public.documents (share_token) where share_token is not null;

create or replace function public.get_shared_document(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'doc_type', d.doc_type,
    'fields', d.fields,
    'validation', d.validation,
    'page_count', d.page_count,
    'created_at', d.created_at
  )
  from public.documents d
  where d.share_token = token
    and char_length(token) >= 24
    and d.status = 'parsed'
  limit 1
$$;

revoke all on function public.get_shared_document(text) from public;
grant execute on function public.get_shared_document(text) to anon, authenticated;
