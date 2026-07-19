-- RLS tests (BUILD_SPEC §M2): prove cross-user access fails on every table.
-- Run inside a transaction that is ALWAYS rolled back — seeds nothing durable.
-- Any failed assertion raises an exception, which aborts with non-zero result.

begin;

-- Seed two users (profile rows appear via the on_auth_user_created trigger).
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'rls-test-a@example.com', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'rls-test-b@example.com', '', now(), now(), now());

-- ---------------------------------------------------------------------------
-- Act as user A: create one row in every owner table.
-- ---------------------------------------------------------------------------
do $$
declare
  a constant uuid := '11111111-1111-1111-1111-111111111111';
  sid uuid;
  did uuid;
  n int;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  if (select auth.uid()) is distinct from a then
    raise exception 'auth.uid() impersonation failed';
  end if;

  select count(*) into n from public.profiles where id = a;
  if n <> 1 then raise exception 'profile auto-create trigger failed'; end if;

  insert into public.shipments (owner, ref, bl_number)
    values (a, 'RLS-TEST', 'BL-RLS-1') returning id into sid;
  insert into public.documents (owner, shipment_id, doc_type, status)
    values (a, sid, 'bill_of_lading', 'uploaded') returning id into did;
  insert into public.containers (owner, document_id, container_no)
    values (a, did, 'MSKU1234565');
  insert into public.discrepancies (owner, shipment_id, severity, field, message)
    values (a, sid, 'red', 'consignee', 'rls test row');
  insert into public.events (owner, type, payload)
    values (a, 'rls_test', '{}'::jsonb);

  -- A must NOT be able to write its own entitlements.
  begin
    update public.profiles set plan = 'pro' where id = a;
    raise exception 'user could update own plan — entitlement column grant broken';
  exception when insufficient_privilege then null;
  end;

  -- A must NOT be able to write subscriptions (service-role only).
  begin
    insert into public.subscriptions (owner, plan, status) values (a, 'pro', 'active');
    raise exception 'user could insert own subscription — RLS broken';
  exception when insufficient_privilege then null;
  end;

  raise notice 'PASS: user A setup + entitlement write protection';
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- Act as user B: must see nothing of A, and must not write as A.
-- ---------------------------------------------------------------------------
do $$
declare
  a constant uuid := '11111111-1111-1111-1111-111111111111';
  b constant uuid := '22222222-2222-2222-2222-222222222222';
  n int;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);

  select count(*) into n from public.profiles where id = a;
  if n <> 0 then raise exception 'B can read A profile'; end if;
  select count(*) into n from public.shipments;
  if n <> 0 then raise exception 'B can read A shipments'; end if;
  select count(*) into n from public.documents;
  if n <> 0 then raise exception 'B can read A documents'; end if;
  select count(*) into n from public.containers;
  if n <> 0 then raise exception 'B can read A containers'; end if;
  select count(*) into n from public.discrepancies;
  if n <> 0 then raise exception 'B can read A discrepancies'; end if;
  select count(*) into n from public.events;
  if n <> 0 then raise exception 'B can read A events'; end if;
  select count(*) into n from public.subscriptions;
  if n <> 0 then raise exception 'B can read A subscriptions'; end if;

  -- Spoofed-owner inserts must fail.
  begin
    insert into public.shipments (owner, ref) values (a, 'SPOOF');
    raise exception 'B inserted a shipment owned by A — RLS broken';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.events (owner, type) values (a, 'spoof');
    raise exception 'B inserted an event owned by A — RLS broken';
  exception when insufficient_privilege then null;
  end;

  -- Storage: B must not create objects under A's folder.
  begin
    insert into storage.objects (bucket_id, name, owner_id)
      values ('docs', a || '/some-doc/page-1.jpg', b::text);
    raise exception 'B created a storage object in A''s folder — storage RLS broken';
  exception when insufficient_privilege then null;
  end;

  -- Cross-owner updates/deletes must affect 0 rows (filtered by USING).
  update public.documents set status = 'failed';
  if found then raise exception 'B updated A documents'; end if;
  delete from public.shipments;
  if found then raise exception 'B deleted A shipments'; end if;

  raise notice 'PASS: user B fully isolated from user A';
end;
$$;

reset role;

-- ---------------------------------------------------------------------------
-- service_role: must bypass RLS (webhook writes).
-- ---------------------------------------------------------------------------
do $$
declare
  a constant uuid := '11111111-1111-1111-1111-111111111111';
  n int;
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform set_config('role', 'service_role', true);

  insert into public.subscriptions (owner, plan, status, paddle_sub_id)
    values (a, 'pro', 'active', 'sub_rls_test');
  update public.profiles set plan = 'pro' where id = a;

  select count(*) into n from public.shipments;
  if n < 1 then raise exception 'service_role cannot read across owners'; end if;

  raise notice 'PASS: service_role bypasses RLS';
end;
$$;

reset role;

rollback;
