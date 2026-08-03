-- Team-plan workspaces. Existing shipment-level collaboration remains the
-- authorization substrate; workspace membership synchronizes into every
-- shipment so members receive consistent access without repeated invitations.

create table if not exists public.team_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'Team workspace',
  seat_limit integer not null default 5 check (seat_limit between 2 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.team_workspaces (id) on delete cascade,
  member_id uuid references auth.users (id) on delete cascade,
  email text not null check (char_length(email) between 3 and 254),
  display_name text,
  role text not null default 'reviewer' check (role in ('editor', 'reviewer', 'approver')),
  status text not null default 'pending' check (status in ('pending', 'active', 'removed')),
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, email)
);
create index if not exists team_members_member_idx on public.team_members (member_id, status);
create unique index if not exists team_members_one_active_workspace_idx
  on public.team_members (member_id) where member_id is not null and status = 'active';

create trigger team_workspaces_updated_at before update on public.team_workspaces
  for each row execute function public.set_updated_at();
create trigger team_members_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();

create or replace function public.enforce_team_seat_limit()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  allowed integer;
  occupied integer;
begin
  if new.status = 'removed' then return new; end if;
  select seat_limit - 1 into allowed from public.team_workspaces where id = new.workspace_id;
  select count(*) into occupied from public.team_members
    where workspace_id = new.workspace_id and status <> 'removed' and id <> new.id;
  if occupied >= allowed then raise exception 'team seat limit reached'; end if;
  return new;
end
$$;
create trigger team_members_enforce_seats before insert or update of status, workspace_id on public.team_members
  for each row execute function public.enforce_team_seat_limit();

create or replace function public.ensure_team_workspace()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.plan = 'team' then
    insert into public.team_workspaces (owner, name)
    values (new.id, coalesce(nullif(new.company, ''), 'Team workspace'))
    on conflict (owner) do update set name = coalesce(nullif(excluded.name, ''), public.team_workspaces.name);
  end if;
  return new;
end
$$;
create trigger profiles_ensure_team_workspace
  after insert or update of plan, company on public.profiles
  for each row execute function public.ensure_team_workspace();

create or replace function public.sync_team_member_shipments()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  workspace_owner uuid;
  shipment_role text;
begin
  select owner into workspace_owner from public.team_workspaces where id = new.workspace_id;
  shipment_role := new.role;
  if new.status = 'removed' then
    update public.shipment_members set status = 'removed'
      where owner = workspace_owner and lower(email) = lower(new.email);
    return new;
  end if;

  insert into public.shipment_members (
    shipment_id, owner, member_id, email, display_name, role, status, invited_by
  )
  select s.id, workspace_owner, new.member_id, lower(new.email), new.display_name,
         shipment_role, new.status, new.invited_by
  from public.shipments s where s.owner = workspace_owner
  on conflict (shipment_id, email) do update set
    member_id = excluded.member_id,
    display_name = excluded.display_name,
    role = excluded.role,
    status = excluded.status;
  return new;
end
$$;
create trigger team_members_sync_shipments
  after insert or update of member_id, display_name, role, status on public.team_members
  for each row execute function public.sync_team_member_shipments();

create or replace function public.add_workspace_members_to_shipment()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  insert into public.shipment_members (
    shipment_id, owner, member_id, email, display_name, role, status, invited_by
  )
  select new.id, new.owner, m.member_id, lower(m.email), m.display_name, m.role, m.status, m.invited_by
  from public.team_workspaces w
  join public.team_members m on m.workspace_id = w.id and m.status <> 'removed'
  join public.profiles p on p.id = w.owner and p.plan = 'team'
  where w.owner = new.owner
  on conflict (shipment_id, email) do nothing;
  return new;
end
$$;
create trigger shipments_add_workspace_members
  after insert on public.shipments
  for each row execute function public.add_workspace_members_to_shipment();

create or replace function public.activate_pending_team_members()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.team_members
    set member_id = new.id, display_name = new.full_name, status = 'active'
    where lower(email) = lower(new.email) and member_id is null and status = 'pending';
  return new;
end
$$;
create trigger profiles_activate_pending_team_members
  after insert or update of email, full_name on public.profiles
  for each row execute function public.activate_pending_team_members();

-- Team access is valid only while the workspace owner has an active Team
-- entitlement mirrored on profiles.plan. A canceled subscription therefore
-- revokes shared access immediately without deleting the roster.
create or replace function public.can_access_shipment(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.shipments s
    where s.id = target and (
      s.owner = (select auth.uid())
      or (
        exists (select 1 from public.profiles p where p.id = s.owner and p.plan = 'team')
        and exists (
          select 1 from public.shipment_members m
          where m.shipment_id = s.id and m.member_id = (select auth.uid()) and m.status = 'active'
        )
      )
    )
  )
$$;

create or replace function public.shipment_role(target uuid)
returns text language sql stable security definer set search_path = ''
as $$
  select case
    when s.owner = (select auth.uid()) then 'owner'
    when exists (select 1 from public.profiles p where p.id = s.owner and p.plan = 'team') then (
      select m.role from public.shipment_members m
      where m.shipment_id = s.id and m.member_id = (select auth.uid()) and m.status = 'active'
      limit 1
    )
    else null end
  from public.shipments s where s.id = target
$$;

alter table public.team_workspaces enable row level security;
alter table public.team_members enable row level security;

create or replace function public.can_access_team_workspace(target uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_workspaces w where w.id = target and (
      w.owner = (select auth.uid()) or exists (
        select 1 from public.team_members m
        where m.workspace_id = w.id and m.member_id = (select auth.uid()) and m.status = 'active'
      )
    )
  )
$$;

create policy "team_workspaces_read_participants" on public.team_workspaces for select to authenticated
  using (public.can_access_team_workspace(id));
create policy "team_workspaces_owner_update" on public.team_workspaces for update to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create policy "team_members_read_workspace" on public.team_members for select to authenticated
  using (public.can_access_team_workspace(workspace_id));
create policy "team_members_owner_insert" on public.team_members for insert to authenticated
  with check (exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner = (select auth.uid())));
create policy "team_members_owner_update" on public.team_members for update to authenticated
  using (exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner = (select auth.uid())))
  with check (exists (select 1 from public.team_workspaces w where w.id = workspace_id and w.owner = (select auth.uid())));

insert into public.team_workspaces (owner, name)
select p.id, coalesce(nullif(p.company, ''), 'Team workspace') from public.profiles p where p.plan = 'team'
on conflict (owner) do nothing;
