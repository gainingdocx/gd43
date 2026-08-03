-- Cloudflare Email Routing persists the original attachment before handing
-- durable processing to a Queue. Keep the original file separate from the
-- page-image prefix used by manual browser uploads.

alter table public.email_ingestions
  add column if not exists provider text not null default 'cloudflare'
    check (provider = 'cloudflare');

alter table public.documents
  add column if not exists source_mime_type text,
  add column if not exists source_file_path text;

create index if not exists email_ingestions_status_created_idx
  on public.email_ingestions(status, created_at);
