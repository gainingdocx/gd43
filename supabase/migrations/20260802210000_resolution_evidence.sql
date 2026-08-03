-- Preserve a human-readable reviewer snapshot alongside the immutable user id.
-- This keeps exported/reviewed discrepancy history understandable if a team
-- member later leaves the workspace or changes their profile name.
alter table public.discrepancies
  add column if not exists resolved_by_email text;
