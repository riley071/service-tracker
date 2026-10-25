-- Run in a development Supabase SQL editor AFTER templates.sql or schema.sql.
-- Fixtures are rolled back. No real subscriptions or users are changed.
begin;
insert into auth.users(id,email) values
 ('f34b60aa-86fe-420e-ae6d-e46a017f7a01','template-a@example.invalid'),
 ('f34b60aa-86fe-420e-ae6d-e46a017f7a02','template-b@example.invalid');
insert into public.template_subscriptions(owner_id,plan,status,starts_at,valid_until,payment_reference,amount_mwk,verification_source)
values
 ('f34b60aa-86fe-420e-ae6d-e46a017f7a01','Starter','active',now()-interval '1 day',now()+interval '29 days','rollback-test-a',2000,'manual'),
 ('f34b60aa-86fe-420e-ae6d-e46a017f7a02','Pro','active',now()-interval '40 days',now()-interval '10 days','rollback-test-b',5000,'manual');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f34b60aa-86fe-420e-ae6d-e46a017f7a01","role":"authenticated"}',true);
do $$ begin
 if not public.has_paid_templates() then raise exception 'FAIL: verified active payment denied'; end if;
 if (select count(*) from public.document_template_styles) <> 10 then raise exception 'FAIL: expected 10 paid styles'; end if;
 if (select count(*) from public.template_subscriptions) <> 1 then raise exception 'FAIL: subscription owner isolation'; end if;
 begin
   update public.template_subscriptions set valid_until = now()+interval '10 years';
   raise exception 'FAIL: client can alter subscription';
 exception when insufficient_privilege then null; end;
 begin
   update public.document_template_styles set css = '';
   raise exception 'FAIL: client can alter styles';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"f34b60aa-86fe-420e-ae6d-e46a017f7a02","role":"authenticated"}',true);
do $$ begin
 if public.has_paid_templates() then raise exception 'FAIL: expired payment allowed'; end if;
 if exists(select 1 from public.document_template_styles) then raise exception 'FAIL: expired user can retrieve styles'; end if;
 -- A user-editable plan request must not confer template access.
 perform public.save_workspace('{"version":1,"customers":[],"quotes":[],"jobs":[],"planRequest":{"plan":"Pro","annual":true}}',1);
 if public.has_paid_templates() then raise exception 'FAIL: plan interest grants access'; end if;
end $$;
reset role;
update public.template_subscriptions set status='cancelled' where owner_id='f34b60aa-86fe-420e-ae6d-e46a017f7a01';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f34b60aa-86fe-420e-ae6d-e46a017f7a01","role":"authenticated"}',true);
do $$ begin
 if public.has_paid_templates() then raise exception 'FAIL: cancelled payment allowed'; end if;
 if exists(select 1 from public.document_template_styles) then raise exception 'FAIL: cancelled user can retrieve styles'; end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 begin
   perform 1 from public.document_template_styles;
   raise exception 'FAIL: anonymous style access';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: paid access, expiry, cancellation, owner isolation and write restrictions' as result;
