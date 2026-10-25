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
-- Verified template entitlements are separate from the user-editable workspace JSON.
create table if not exists public.template_subscriptions (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan in ('Starter', 'Pro')),
  status text not null check (status in ('active', 'expired', 'cancelled')),
  starts_at timestamptz not null default now(),
  valid_until timestamptz not null,
  payment_reference text not null check (length(btrim(payment_reference)) > 0),
  amount_mwk numeric(12,2) not null check (amount_mwk > 0),
  verified_at timestamptz not null default now(),
  verification_source text not null check (verification_source in ('manual', 'provider')),
  check (valid_until > starts_at)
);
alter table public.template_subscriptions enable row level security;
drop policy if exists "Owner reads template subscription" on public.template_subscriptions;
create policy "Owner reads template subscription" on public.template_subscriptions
  for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.template_subscriptions from public, anon, authenticated;
grant select on public.template_subscriptions to authenticated;
grant all on public.template_subscriptions to service_role;

create or replace function public.has_paid_templates() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists(select 1 from public.template_subscriptions
    where owner_id = (select auth.uid()) and status = 'active'
      and starts_at <= now() and valid_until > now() and verified_at <= now());
$$;
revoke all on function public.has_paid_templates() from public, anon;
grant execute on function public.has_paid_templates() to authenticated;

create table if not exists public.document_template_styles (
  id text primary key,
  css text not null check (position('<' in css) = 0)
);
alter table public.document_template_styles enable row level security;
drop policy if exists "Paid accounts read template styles" on public.document_template_styles;
create policy "Paid accounts read template styles" on public.document_template_styles
  for select to authenticated using ((select public.has_paid_templates()));
revoke all on public.document_template_styles from public, anon, authenticated;
grant select on public.document_template_styles to authenticated;
grant all on public.document_template_styles to service_role;

insert into public.document_template_styles(id, css) values
('executive', $theme$.masthead{border-top-color:#183153}h1,.thanks{color:#183153}th{background:#183153}.balance{border-left-color:#183153}.masthead{background:#183153;padding:24px;color:white;border:0}.business-name,h1,.business-details,.date-row .muted{color:white}.label{letter-spacing:1px}.scope{border-left:4px solid #183153}.balance{border-left:0;border-top:3px solid #183153}$theme$),
('artisan', $theme$.masthead{border-top-color:#9a4d36}h1,.thanks{color:#9a4d36}th{background:#9a4d36}.balance{border-left-color:#9a4d36}body{font-family:Georgia,serif}.masthead{border-top:0;border-bottom:3px double #9a4d36}.business-name{font-size:25px}.scope{background:#faf3ed;border-radius:0}.label{letter-spacing:2px}th{background:white;color:#9a4d36;border-top:1px solid #9a4d36;border-bottom:1px solid #9a4d36}.balance{background:#faf3ed}.thanks{font-style:italic}$theme$),
('blueprint', $theme$.masthead{border-top-color:#225ea8}h1,.thanks{color:#225ea8}th{background:#225ea8}.balance{border-left-color:#225ea8}body{font-family:Courier New,monospace}.masthead{border-top:2px solid #225ea8;border-bottom:2px solid #225ea8}.scope{background:#eff6fc;border-left:4px solid #225ea8;border-radius:0}th,td{border:1px solid #c4d6e8;padding:9px}.parties{border-bottom:1px dashed #225ea8;margin-bottom:20px}.balance{background:#eff6fc;border:2px solid #225ea8}$theme$),
('signature', $theme$.masthead{border-top-color:#80621e}h1,.thanks{color:#80621e}th{background:#80621e}.balance{border-left-color:#80621e}body{font-family:Georgia,serif;color:#222}.masthead{border-top:1px solid #80621e;border-bottom:1px solid #80621e;padding-top:32px;padding-bottom:32px}.business-name{font-size:25px}.scope{background:white;border-left:2px solid #80621e}.label{letter-spacing:2px}th{background:#252525}h1{font-size:29px;letter-spacing:3px}.balance{background:#f8f5ec;border-left:0;border-top:2px solid #80621e}.footer{text-align:center}$theme$),
('fresh', $theme$.masthead{border-top-color:#087f8c}h1,.thanks{color:#087f8c}th{background:#087f8c}.balance{border-left-color:#087f8c}.masthead{background:#edfafa;padding:22px;border-radius:16px;border:0}.scope{border-radius:12px;background:#edfafa}th:first-child{border-radius:8px 0 0 0}th:last-child{border-radius:0 8px 0 0}.balance{border:0;border-radius:12px;background:#edfafa}.payment{border-top:2px solid #087f8c}$theme$),
('studio', $theme$.masthead{border-top-color:#6842a6}h1,.thanks{color:#6842a6}th{background:#6842a6}.balance{border-left-color:#6842a6}.masthead{display:block;text-align:center;border-top:0;border-bottom:4px solid #6842a6}.document-heading{width:100%;max-width:none;text-align:center;margin-top:20px}.date-list{display:flex;justify-content:center;gap:24px;flex-wrap:wrap}.date-row{display:block}.date-row span{display:block}.scope{background:#f5f0fa}.balance{background:#f5f0fa}.footer{text-align:center}$theme$),
('contractor', $theme$.masthead{border-top-color:#9c5700}h1,.thanks{color:#9c5700}th{background:#9c5700}.balance{border-left-color:#9c5700}.masthead{border-top:9px solid #9c5700;background:#f6f4f0;padding:20px}.business-name{font-weight:800;text-transform:uppercase}h1{font-weight:800;letter-spacing:0}.scope{border-left:6px solid #9c5700;border-radius:0;background:#fff6e7}th{background:#303030}.label{color:#765427}.balance{background:#fff0d8;border-left:6px solid #9c5700}td{padding-top:15px;padding-bottom:15px}$theme$),
('elegant', $theme$.masthead{border-top-color:#8c3548}h1,.thanks{color:#8c3548}th{background:#8c3548}.balance{border-left-color:#8c3548}body{font-family:Georgia,serif}.masthead{flex-direction:row-reverse;border-top:0;border-bottom:2px solid #8c3548}.document-heading{text-align:left}.identity{text-align:right}.date-row{flex-direction:row-reverse}.scope{background:white;border-bottom:1px solid #8c3548;border-radius:0;padding-left:0}.business-name{font-weight:400;font-size:26px}th{background:#fbf2f4;color:#8c3548;border-bottom:1px solid #8c3548}.balance{background:#fbf2f4;border-left:0;border-top:2px solid #8c3548}$theme$),
('horizon', $theme$.masthead{border-top-color:#246a91}h1,.thanks{color:#246a91}th{background:#246a91}.balance{border-left-color:#246a91}.masthead{border-top:0;border-bottom:7px solid #246a91;background:#f0f7fc;padding:20px}.parties{border-bottom:1px solid #d3e6f2;margin-bottom:20px}.scope{background:white;padding-left:0;border-radius:0}h1{font-weight:700;letter-spacing:1px}.balance{border-left:0;background:#246a91;color:white}.payment{border-top:2px solid #246a91}.thanks{font-size:15px}$theme$),
('precision', $theme$.masthead{border-top-color:#303a42}h1,.thanks{color:#303a42}th{background:#303a42}.balance{border-left-color:#303a42}body{font-family:Arial,sans-serif;font-size:10px}.masthead{border-top:0;border-bottom:2px solid #303a42;padding-bottom:16px}.parties{padding-top:16px;padding-bottom:16px}h1{font-size:26px;font-weight:800;letter-spacing:0}.business-name{font-size:18px}.scope{background:white;border:1px solid #303a42;border-radius:0;padding:10px}th,td{padding:7px;border:1px solid #d7dce0}tbody{counter-reset:lines}tbody td:first-child:before{counter-increment:lines;content:counter(lines) ". ";color:#64776e}.balance{background:white;border:2px solid #303a42}.totals{width:310px}.total-row{padding-top:5px;padding-bottom:5px}$theme$)
on conflict(id) do update set css = excluded.css;

notify pgrst, 'reload schema';
commit;
