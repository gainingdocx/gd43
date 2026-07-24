-- Shipment completeness, charge alerts, and team review workflows.

alter table public.shipments
  add column if not exists export_approval_required boolean not null default false;

alter table public.webhook_endpoints alter column events
  set default array['document.parsed', 'document.failed', 'hs.reviewed', 'charge.alert', 'review.updated', 'export.approval'];
update public.webhook_endpoints
  set events = events || array['charge.alert', 'review.updated', 'export.approval']
  where not events @> array['charge.alert', 'review.updated', 'export.approval'];

create table public.shipment_members (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  member_id uuid references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'reviewer' check (role in ('reviewer', 'editor', 'approver')),
  status text not null default 'pending' check (status in ('pending', 'active', 'removed')),
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shipment_id, email)
);
create index shipment_members_member_idx on public.shipment_members (member_id, status);

create table public.shipment_requirements (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  requirement_key text not null,
  label text not null,
  accepted_types text[] not null default '{}',
  required boolean not null default true,
  filename_hint text,
  created_at timestamptz not null default now(),
  unique (shipment_id, requirement_key)
);

create table public.document_workflows (
  document_id uuid primary key references public.documents (id) on delete cascade,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  assignee_id uuid references auth.users (id) on delete set null,
  assignee_email text,
  status text not null default 'unassigned'
    check (status in ('unassigned', 'in_review', 'correction_requested', 'approved')),
  due_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create index document_workflows_assignee_idx on public.document_workflows (assignee_id, status, due_at);
create trigger document_workflows_updated_at before update on public.document_workflows
  for each row execute function public.set_updated_at();

create table public.document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  author uuid not null references auth.users (id) on delete cascade,
  author_email text not null,
  body text not null check (char_length(body) between 1 and 2000),
  kind text not null default 'comment'
    check (kind in ('comment', 'correction_request', 'approval')),
  created_at timestamptz not null default now()
);
create index document_comments_document_idx on public.document_comments (document_id, created_at);

create table public.export_approvals (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references auth.users (id) on delete set null,
  decision_note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);
create index export_approvals_shipment_idx on public.export_approvals (shipment_id, requested_at desc);

create table public.charge_alerts (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  owner uuid not null references auth.users (id) on delete cascade,
  alert_type text not null check (alert_type in ('demurrage', 'detention')),
  basis text not null default 'document' check (basis in ('document', 'manual')),
  free_until date not null,
  notify_email text,
  remind_days int[] not null default array[7, 3, 1, 0],
  sent_offsets int[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'dismissed', 'expired')),
  source_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, alert_type)
);
create index charge_alerts_due_idx on public.charge_alerts (status, free_until);
create trigger charge_alerts_updated_at before update on public.charge_alerts
  for each row execute function public.set_updated_at();

create or replace function public.can_access_shipment(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.shipments s
    where s.id = target and (
      s.owner = (select auth.uid())
      or exists (
        select 1 from public.shipment_members m
        where m.shipment_id = s.id and m.member_id = (select auth.uid()) and m.status = 'active'
      )
    )
  )
$$;

create or replace function public.shipment_role(target uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select case
    when s.owner = (select auth.uid()) then 'owner'
    else (
      select m.role from public.shipment_members m
      where m.shipment_id = s.id and m.member_id = (select auth.uid()) and m.status = 'active'
      limit 1
    )
  end
  from public.shipments s where s.id = target
$$;

alter table public.events
  add column if not exists actor uuid references auth.users (id) on delete set null;
alter table public.events alter column actor set default auth.uid();
drop policy if exists "events_select_own" on public.events;
create policy "events_select_participant" on public.events for select to authenticated
  using (
    owner = (select auth.uid()) or exists (
      select 1 from public.shipments s
      where s.id::text = payload->>'shipment_id' and public.can_access_shipment(s.id)
    )
  );
drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_participant" on public.events for insert to authenticated
  with check (
    actor = (select auth.uid()) and (
      owner = (select auth.uid()) or exists (
        select 1 from public.shipments s
        where s.id::text = payload->>'shipment_id' and public.can_access_shipment(s.id)
      )
    )
  );

create or replace function public.activate_pending_shipment_members()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.shipment_members
    set member_id = new.id, display_name = new.full_name, status = 'active'
    where lower(email) = lower(new.email) and member_id is null and status = 'pending';
  return new;
end
$$;
create trigger profiles_activate_pending_shipment_members
  after insert or update of email, full_name on public.profiles
  for each row execute function public.activate_pending_shipment_members();

alter table public.shipment_members enable row level security;
alter table public.shipment_requirements enable row level security;
alter table public.document_workflows enable row level security;
alter table public.document_comments enable row level security;
alter table public.export_approvals enable row level security;
alter table public.charge_alerts enable row level security;

create policy "shipment_members_read_participants" on public.shipment_members for select to authenticated
  using (public.can_access_shipment(shipment_id));
create policy "shipment_members_owner_insert" on public.shipment_members for insert to authenticated
  with check (owner = (select auth.uid()) and public.shipment_role(shipment_id) = 'owner');
create policy "shipment_members_owner_update" on public.shipment_members for update to authenticated
  using (public.shipment_role(shipment_id) = 'owner')
  with check (public.shipment_role(shipment_id) = 'owner');
create policy "shipment_members_owner_delete" on public.shipment_members for delete to authenticated
  using (public.shipment_role(shipment_id) = 'owner');

create policy "requirements_read_participants" on public.shipment_requirements for select to authenticated
  using (public.can_access_shipment(shipment_id));
create policy "requirements_manage_editors" on public.shipment_requirements for all to authenticated
  using (public.shipment_role(shipment_id) in ('owner', 'editor'))
  with check (public.shipment_role(shipment_id) in ('owner', 'editor'));

create policy "workflows_read_participants" on public.document_workflows for select to authenticated
  using (public.can_access_shipment(shipment_id));
create policy "workflows_manage_participants" on public.document_workflows for all to authenticated
  using (public.can_access_shipment(shipment_id))
  with check (public.can_access_shipment(shipment_id));

create policy "comments_read_participants" on public.document_comments for select to authenticated
  using (public.can_access_shipment(shipment_id));
create policy "comments_insert_participants" on public.document_comments for insert to authenticated
  with check (author = (select auth.uid()) and public.can_access_shipment(shipment_id));

create policy "export_approvals_read_participants" on public.export_approvals for select to authenticated
  using (public.can_access_shipment(shipment_id));
create policy "export_approvals_request_participants" on public.export_approvals for insert to authenticated
  with check (requested_by = (select auth.uid()) and public.can_access_shipment(shipment_id));
create policy "export_approvals_decide_approvers" on public.export_approvals for update to authenticated
  using (public.shipment_role(shipment_id) in ('owner', 'approver'))
  with check (public.shipment_role(shipment_id) in ('owner', 'approver'));

create policy "charge_alerts_read_participants" on public.charge_alerts for select to authenticated
  using (public.can_access_shipment(shipment_id));
create policy "charge_alerts_manage_editors" on public.charge_alerts for all to authenticated
  using (public.shipment_role(shipment_id) in ('owner', 'editor'))
  with check (public.shipment_role(shipment_id) in ('owner', 'editor'));

drop policy if exists "shipments_select_own" on public.shipments;
create policy "shipments_select_participant" on public.shipments for select to authenticated
  using (public.can_access_shipment(id));
drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_participant" on public.documents for select to authenticated
  using (owner = (select auth.uid()) or (shipment_id is not null and public.can_access_shipment(shipment_id)));
drop policy if exists "containers_select_own" on public.containers;
create policy "containers_select_participant" on public.containers for select to authenticated
  using (
    owner = (select auth.uid()) or exists (
      select 1 from public.documents d
      where d.id = document_id and d.shipment_id is not null and public.can_access_shipment(d.shipment_id)
    )
  );

create policy "docs_select_team" on storage.objects for select to authenticated
  using (
    bucket_id = 'docs' and exists (
      select 1 from public.documents d
      where d.id::text = (storage.foldername(name))[2]
        and d.shipment_id is not null
        and public.can_access_shipment(d.shipment_id)
    )
  );
