-- Take TRUNCATE and TRIGGER away from the browser-facing roles.
--
-- Supabase's default privileges grant `anon` and `authenticated` the full set
-- (arwdDxtm) on every new table in `public`. Row-level security makes most of
-- that safe: SELECT, INSERT, UPDATE and DELETE are all filtered by policy, and
-- the application depends on them.
--
-- TRUNCATE is the exception, and it is the reason this migration exists:
--
--   **TRUNCATE is not filtered by row-level security.**
--
-- A policy saying `owner = auth.uid()` constrains which rows a user may delete.
-- It says nothing about TRUNCATE, which is a table-level operation: one
-- statement empties `documents`, `shipments` or `subscriptions` for every
-- customer, and every policy in the schema is bypassed.
--
-- Being accurate about the risk, because overstating it would be its own kind
-- of wrong: this is **not reachable through the public API today**. PostgREST
-- only ever issues SELECT/INSERT/UPDATE/DELETE and RPC calls, so an anon key
-- cannot ask for a TRUNCATE, and no SECURITY INVOKER function in this schema
-- executes dynamic SQL. It is a latent misconfiguration — the standing
-- permission to do something catastrophic that nothing legitimate ever needs.
-- It becomes live the moment anyone adds a function that builds SQL from
-- input, or any path leaks a direct connection as one of these roles.
-- Removing a privilege nothing uses costs nothing and closes that class.
--
-- TRIGGER goes too, on the same reasoning. It is currently hard to abuse
-- because neither role has CREATE on schema `public`, so they cannot define a
-- trigger function — but that is a property of today's schema privileges, not
-- a guarantee, and nothing here ever needs a client role to attach a trigger.
--
-- Deliberately NOT revoked: SELECT/INSERT/UPDATE/DELETE (RLS-gated and load
-- bearing), and REFERENCES (needs CREATE on the schema to exploit, which these
-- roles do not have).

-- ---------------------------------------------------------------------------
-- Every table that exists today.
-- ---------------------------------------------------------------------------
-- Loop rather than a hand-written list: a list would silently miss any table
-- added between writing this and running it, and missing one is the whole bug.
do $$
declare
  target record;
begin
  for target in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')  -- ordinary and partitioned tables
  loop
    execute format('revoke truncate, trigger on public.%I from anon, authenticated', target.relname);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Every table created from now on.
-- ---------------------------------------------------------------------------
-- Without this the next migration's `create table` silently reintroduces the
-- grant, and the fix above lasts exactly until the next feature ships.
--
-- `postgres` owns the existing default ACLs and is the role migrations run as,
-- so this is the one that matters. Supabase also keeps `supabase_admin`-owned
-- defaults which only that role can change; tables it creates are Supabase's
-- own, not this application's.
alter default privileges for role postgres in schema public
  revoke truncate, trigger on tables from anon, authenticated;
