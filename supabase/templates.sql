-- Template migration for an existing Workfolio project. Run as postgres.
begin;
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
