-- Workfolio: complete Supabase setup for the current solo-owner application.
-- Run in the Supabase SQL editor as postgres. Safe to rerun; no records are deleted.
-- Do not replace this with client-side SQL or expose a service-role key.
begin;

create table if not exists public.workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.workspaces add column if not exists created_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.workspaces'::regclass and conname = 'workspace_revision_positive') then
    alter table public.workspaces add constraint workspace_revision_positive check (revision > 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.workspaces'::regclass and conname = 'workspace_payload_shape') then
    alter table public.workspaces add constraint workspace_payload_shape check (coalesce(
      jsonb_typeof(data) = 'object'
      and data->'version' = '1'::jsonb
      and jsonb_typeof(data->'customers') = 'array'
      and jsonb_typeof(data->'quotes') = 'array'
      and jsonb_typeof(data->'jobs') = 'array'
      and (not (data ? 'invoices') or jsonb_typeof(data->'invoices') = 'array')
      and (not (data ? 'payments') or jsonb_typeof(data->'payments') = 'array')
      and (not (data ? 'business') or jsonb_typeof(data->'business') = 'object')
      and (not (data ? 'preferences') or jsonb_typeof(data->'preferences') = 'object')
      and (not (data ? 'planRequest') or jsonb_typeof(data->'planRequest') = 'object'), false));
  end if;
end $$;

-- Save-event audit: metadata only, never JWTs, passwords or full customer content.
create table if not exists public.workspace_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null,
  action text not null check (action in ('created', 'saved')),
  occurred_at timestamptz not null default now(),
  unique (owner_id, revision)
);
create index if not exists workspace_events_owner_time on public.workspace_events(owner_id, occurred_at desc);

alter table public.workspaces enable row level security;
alter table public.workspace_events enable row level security;
drop policy if exists "Owner reads workspace" on public.workspaces;
create policy "Owner reads workspace" on public.workspaces
  for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "Owner reads save events" on public.workspace_events;
create policy "Owner reads save events" on public.workspace_events
  for select to authenticated using (owner_id = (select auth.uid()));

revoke all on public.workspaces, public.workspace_events from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.workspaces, public.workspace_events to authenticated;

-- Only trusted triggers and this RPC write records. Caller cannot choose an owner.
create or replace function public.audit_workspace_save() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspace_events(owner_id, revision, action)
  values (new.owner_id, new.revision, case when tg_op = 'INSERT' then 'created' else 'saved' end);
  return new;
end $$;
revoke all on function public.audit_workspace_save() from public, anon, authenticated;
drop trigger if exists workspace_save_audit on public.workspaces;
create trigger workspace_save_audit after insert or update on public.workspaces
  for each row execute function public.audit_workspace_save();

create or replace function public.create_user_workspace() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.workspaces(owner_id, data)
  values (new.id, '{"version":1,"customers":[],"quotes":[],"jobs":[],"invoices":[],"payments":[]}'::jsonb)
  on conflict (owner_id) do nothing;
  return new;
end $$;
revoke all on function public.create_user_workspace() from public, anon, authenticated;
drop trigger if exists workfolio_user_created on auth.users;
create trigger workfolio_user_created after insert on auth.users
  for each row execute function public.create_user_workspace();

-- Existing auth users get an empty workspace only when they do not have one.
insert into public.workspaces(owner_id, data)
select id, '{"version":1,"customers":[],"quotes":[],"jobs":[],"invoices":[],"payments":[]}'::jsonb
from auth.users on conflict (owner_id) do nothing;

create or replace function public.save_workspace(payload jsonb, expected_revision integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare result integer;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if expected_revision is null or expected_revision < 0 then
    raise exception 'Invalid workspace revision' using errcode = '22023';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Invalid workspace payload' using errcode = '22023';
  end if;
  -- Base64 logos live inside the payload today. Move them to private Storage as usage grows.
  if octet_length(payload::text) > 10485760 then
    raise exception 'Workspace exceeds 10 MB. Reduce the logo size or contact support.' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.workspaces(owner_id, data) values(auth.uid(), payload)
      on conflict (owner_id) do nothing returning revision into result;
  else
    update public.workspaces set data = payload, revision = revision + 1, updated_at = now()
      where owner_id = auth.uid() and revision = expected_revision returning revision into result;
  end if;
  if result is null then
    raise exception 'Workspace changed on another device. Preserve your changes and reload before saving.' using errcode = '40001';
  end if;
  return result;
end $$;
revoke all on function public.save_workspace(jsonb, integer) from public, anon, authenticated;
grant execute on function public.save_workspace(jsonb, integer) to authenticated;

comment on table public.workspaces is 'One private JSON document workspace per auth user. Not a multi-user business ledger.';
comment on table public.workspace_events is 'Atomic workspace save history; not a financial transaction audit trail.';
comment on function public.save_workspace(jsonb, integer) is 'Owner-scoped optimistic write. Stale revisions fail instead of overwriting other devices.';
notify pgrst, 'reload schema';
commit;
