-- Development/staging smoke test. Run AFTER schema.sql in Supabase SQL Editor.
-- All fixture users, workspace writes and events are rolled back. No signup email is sent.
-- If a statement fails, run ROLLBACK; before investigating.
begin;

insert into auth.users(id, email)
values ('f34b60aa-86fe-420e-ae6d-e46a017f7a01', 'workfolio-test-a@example.invalid'),
       ('f34b60aa-86fe-420e-ae6d-e46a017f7a02', 'workfolio-test-b@example.invalid');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f34b60aa-86fe-420e-ae6d-e46a017f7a01","role":"authenticated"}', true);

do $$
declare v integer; result integer; count_rows integer;
begin
  select count(*) into count_rows from public.workspaces;
  if count_rows <> 1 then raise exception 'FAIL: owner must see exactly their own workspace'; end if;
  if exists(select 1 from public.workspaces where owner_id = 'f34b60aa-86fe-420e-ae6d-e46a017f7a02') then
    raise exception 'FAIL: account A can read account B';
  end if;
  select revision into v from public.workspaces;
  result := public.save_workspace('{"version":1,"customers":[],"quotes":[],"jobs":[]}'::jsonb, v);
  if result <> v + 1 then raise exception 'FAIL: revision did not advance'; end if;
  if not exists(select 1 from public.workspace_events where revision = result and action = 'saved') then
    raise exception 'FAIL: save event not recorded';
  end if;
  begin
    perform public.save_workspace('{"version":1,"customers":[],"quotes":[],"jobs":[]}'::jsonb, v);
    raise exception 'FAIL: stale save was accepted';
  exception when serialization_failure then null; end;
  begin
    perform public.save_workspace('{}'::jsonb, result);
    raise exception 'FAIL: missing arrays accepted';
  exception when check_violation then null; end;
  begin
    perform public.save_workspace(null, result);
    raise exception 'FAIL: null payload accepted';
  exception when invalid_parameter_value then null; end;
  begin
    update public.workspaces set revision = revision + 1;
    raise exception 'FAIL: direct update was allowed';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.workspaces;
    raise exception 'FAIL: direct delete was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.workspaces(owner_id, data) values ('f34b60aa-86fe-420e-ae6d-e46a017f7a02', '{}'::jsonb);
    raise exception 'FAIL: direct insert was allowed';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims', '{"sub":"f34b60aa-86fe-420e-ae6d-e46a017f7a02","role":"authenticated"}', true);
do $$ begin
  if exists(select 1 from public.workspaces where owner_id = 'f34b60aa-86fe-420e-ae6d-e46a017f7a01') then
    raise exception 'FAIL: account B can read account A';
  end if;
  if not exists(select 1 from public.workspaces where revision = 1) then
    raise exception 'FAIL: account A changed account B';
  end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  begin
    perform 1 from public.workspaces;
    raise exception 'FAIL: anonymous workspace read was allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_workspace('{}'::jsonb, 0);
    raise exception 'FAIL: anonymous RPC was allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: isolation, grants, payload validation, audit and conflict checks; fixture changes rolled back' as result;
