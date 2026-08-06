-- OAuth-based cloud connections: Google Drive first, then the rest of the family.
--
-- One table for every OAuth provider rather than one per provider. They differ
-- only in their authorize/token URLs and the shape of their file API; the
-- lifecycle — consent, store, refresh, re-auth, revoke — is identical, and
-- splitting it per provider is how connector number four becomes a rewrite.
--
-- Deliberately separate from `integration_connections`, which is a URL plus a
-- static header. An OAuth connection has an expiring credential that this
-- application is responsible for renewing, and a folder it is responsible for
-- watching. Sharing one table would mean half its columns are always null.

create table if not exists public.oauth_connections (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in (
    'google_drive', 'gmail', 'onedrive', 'microsoft_365_mail', 'dropbox'
  )),

  -- The provider's own id for the connected account, and a human label for it.
  -- Identity matters: a forwarder connecting both ops@ and accounts@ needs to
  -- see which folder belongs to which mailbox, and reconnecting the same
  -- account must update the row rather than silently create a second one.
  external_account_id text not null,
  account_label text,

  -- Granted, not requested. A user can decline an individual scope on Google's
  -- consent screen, so what we asked for says nothing about what we can do.
  scopes text[] not null default '{}',

  -- AES-GCM envelope holding { access_token, refresh_token } — the same
  -- primitive as lib/integrations/connector-secrets.ts. Never granted to
  -- `authenticated`; see the grants at the foot of this file.
  encrypted_tokens text,
  expires_at timestamptz,

  status text not null default 'active'
    check (status in ('active', 'needs_reauth', 'disabled')),
  last_error text,

  -- Provider-specific settings: watched folder id, where approved files are
  -- filed, whether to write results back. Kept as jsonb because the shape
  -- genuinely differs per provider and a column per provider would be mostly
  -- null; the application validates it on write.
  config jsonb not null default '{}'::jsonb,

  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Reconnecting the same account is an update, not a duplicate.
  unique (owner, provider, external_account_id)
);

create index if not exists oauth_connections_owner_idx
  on public.oauth_connections (owner, provider);

-- The sync worker's query: active connections whose watch is due.
create index if not exists oauth_connections_sync_idx
  on public.oauth_connections (last_synced_at)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Import ledger: what has already been pulled in.
-- ---------------------------------------------------------------------------
-- A watched folder is polled repeatedly and mostly contains files already
-- imported. Without this the second poll re-parses everything, which is both a
-- duplicate shipment and a duplicate charge against the customer's allowance.
--
-- Keyed on revision as well as file id so that *editing* a file in Drive is
-- re-imported while merely seeing it again is not.
create table if not exists public.oauth_synced_items (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  connection_id uuid not null references public.oauth_connections (id) on delete cascade,
  external_id text not null,
  -- Empty string rather than null: a null would not collide in a unique index,
  -- so a provider that omits a revision would re-import on every poll.
  external_revision text not null default '',
  document_id uuid references public.documents (id) on delete set null,
  synced_at timestamptz not null default now(),
  unique (connection_id, external_id, external_revision)
);

create index if not exists oauth_synced_items_connection_idx
  on public.oauth_synced_items (connection_id, synced_at desc);

-- ---------------------------------------------------------------------------
-- Documents can now arrive from a watched cloud folder.
-- ---------------------------------------------------------------------------
alter table public.documents drop constraint if exists documents_source_channel_check;
alter table public.documents add constraint documents_source_channel_check
  check (source_channel in ('manual', 'email', 'api', 'cloud_storage'));

-- ---------------------------------------------------------------------------
-- Row-level security.
-- ---------------------------------------------------------------------------
alter table public.oauth_connections enable row level security;
alter table public.oauth_synced_items enable row level security;

drop policy if exists oauth_connections_select_own on public.oauth_connections;
create policy oauth_connections_select_own on public.oauth_connections
  for select to authenticated using (owner = (select auth.uid()));

-- Update and delete only. Inserting is the OAuth callback's job, server-side
-- with the service role: a browser that could insert a row could claim a
-- connection it never completed consent for.
drop policy if exists oauth_connections_update_own on public.oauth_connections;
create policy oauth_connections_update_own on public.oauth_connections
  for update to authenticated using (owner = (select auth.uid()));

drop policy if exists oauth_connections_delete_own on public.oauth_connections;
create policy oauth_connections_delete_own on public.oauth_connections
  for delete to authenticated using (owner = (select auth.uid()));

drop policy if exists oauth_synced_items_select_own on public.oauth_synced_items;
create policy oauth_synced_items_select_own on public.oauth_synced_items
  for select to authenticated using (owner = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Column grants.
-- ---------------------------------------------------------------------------
-- Column-level, exactly as webhook_endpoints is, and for the same reason: the
-- credential must never be selectable from the browser. `encrypted_tokens` is
-- decryptable only with server-side key material, but a token envelope that
-- never leaves the server cannot be exfiltrated by a compromised session at all.
--
-- PostgREST fails the whole select when a requested column is not granted, so
-- any column added here later must be added to this list too.
-- Start from nothing. Supabase's default privileges hand `authenticated` and
-- `anon` every privilege on a newly created public table, so revoking only
-- SELECT would leave INSERT and UPDATE on `encrypted_tokens` in place.
--
-- TRUNCATE matters most and is the least obvious: it is **not** filtered by
-- row-level security, so a role holding it can empty the table for every
-- customer regardless of how good the policies are.
revoke all on public.oauth_connections from authenticated, anon;
revoke all on public.oauth_synced_items from authenticated, anon;

grant select (
  id, owner, provider, external_account_id, account_label, scopes,
  expires_at, status, last_error, config, last_synced_at, created_at, updated_at
) on public.oauth_connections to authenticated;

-- The only fields a person may change from the UI. Rewriting `owner`,
-- `provider`, `scopes` or the token envelope is not theirs to do — and the
-- token envelope is not writable by anyone but the server.
grant update (config, account_label) on public.oauth_connections to authenticated;
grant delete on public.oauth_connections to authenticated;

-- Read-only: the import ledger is a record of what happened, and a customer
-- who could edit it could make the worker re-import and re-bill a file.
grant select (id, owner, connection_id, external_id, external_revision, document_id, synced_at)
  on public.oauth_synced_items to authenticated;

comment on column public.oauth_connections.encrypted_tokens is
  'AES-GCM envelope of { access_token, refresh_token }. Server-side only — never granted to authenticated.';
comment on column public.oauth_connections.scopes is
  'Scopes actually granted by the user, not the ones requested. A declined scope must disable the feature that needs it.';
comment on table public.oauth_synced_items is
  'Import ledger for watched folders. Keyed on (file id, revision) so an edited file re-imports but an unchanged one does not.';
