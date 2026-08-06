-- Document approval and correction.
--
-- The catalogue publishes `document.approved` as "the event to write back to a
-- TMS or accounting system", and `document.corrected` alongside it. Neither
-- could ever fire: there was no approval anywhere in the schema and no record
-- of a field being changed. A customer subscribing to either got silence.
--
-- Approval is columns on `documents` rather than a new `status` value. `status`
-- describes the extraction pipeline — uploaded, parsing, parsed, failed — and
-- adding 'approved' to it would quietly change the meaning of every
-- `status = 'parsed'` filter in the application, of which there are many.
-- Approval is a separate, human fact about a document that is already parsed.

alter table public.documents
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users (id) on delete set null,
  -- Field paths a reviewer changed, newest first. Kept on the row rather than
  -- only in the event log so the workspace can show "this value was corrected"
  -- without replaying an event stream.
  add column if not exists corrected_fields text[] not null default '{}',
  add column if not exists corrected_at timestamptz;

-- The review queue's query: parsed but nobody has signed it off yet.
create index if not exists documents_awaiting_approval_idx
  on public.documents (owner, created_at desc)
  where approved_at is null;

-- Column-level grants: `documents` follows the same pattern as the webhook
-- tables, so a new column is invisible to PostgREST until it is named.
-- Approval is set through the server (API or server action) after an ownership
-- check, never written directly from the browser.
grant select (approved_at, approved_by, corrected_fields, corrected_at)
  on public.documents to authenticated;

comment on column public.documents.approved_at is
  'When a reviewer signed off the extracted values. Null means not yet approved; this is what document.approved reports.';
comment on column public.documents.corrected_fields is
  'Field paths a reviewer has changed at least once. Drives document.corrected and the "edited" marker in review.';
