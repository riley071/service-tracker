# Document templates and verified payments

Both invoice and quotation PDF buttons open a 13-design picker. Free: Classic Green, Minimal, Simple Ledger. Paid: Executive, Artisan, Blueprint, Signature, Fresh, Studio, Contractor, Elegant, Horizon and Precision. The picker thumbnails illustrate the layout families; generated documents use their full CSS designs.

## Apply the database update

For an existing project, run `supabase/templates.sql` in the Supabase SQL editor as postgres. For a new project run `supabase/schema.sql`, which includes the same migration. Then run `supabase/verify_templates.sql` in development to check isolation and access rules. These SQL files have not been executed against the hosted project by this change.

Free designs are bundled. Paid design CSS is stored in `public.document_template_styles` and is not bundled in the client. RLS only returns it when the caller has an active verified row in `public.template_subscriptions`. That table is separate from user-editable workspace JSON; clients can read only their own subscription and cannot insert, update or delete subscriptions or styles. Interest registration, invoice payments recorded by a user and changes to the local UI state do not activate access.

Access is checked against server timestamps on every paid style download: status must be active, starts_at/verified_at must not be future-dated, and valid_until must be in the future. Expired/cancelled accounts retain the three free designs. Existing exported PDFs remain usable after expiry; previously downloaded assets cannot be revoked from a user's device.

## Manual payment verification

Checkout and automatic provider callbacks are not connected. Until a provider is integrated, collect through your approved business payment channel and verify actual receipt before activation. Do not activate from a screenshot or unverified customer-supplied reference alone.

After checking the payer, amount, transaction reference and subscription period, a trusted administrator can run this parameterised example in SQL Editor. Replace EVERY placeholder with verified values. This is an administrative action, never client SQL.

```sql
insert into public.template_subscriptions
  (owner_id, plan, status, starts_at, valid_until, payment_reference, amount_mwk, verified_at, verification_source)
values
  ('REPLACE_WITH_AUTH_USER_UUID'::uuid, 'Starter', 'active',
   'REPLACE_WITH_PERIOD_START'::timestamptz, 'REPLACE_WITH_PERIOD_END'::timestamptz,
   'REPLACE_WITH_VERIFIED_TRANSACTION_REFERENCE', 2000, now(), 'manual')
on conflict (owner_id) do update set
  plan = excluded.plan, status = excluded.status, starts_at = excluded.starts_at,
  valid_until = excluded.valid_until, payment_reference = excluded.payment_reference,
  amount_mwk = excluded.amount_mwk, verified_at = excluded.verified_at,
  verification_source = excluded.verification_source;
```

Use MK2,000/month or MK20,000/year for Starter; MK5,000/month or MK50,000/year for Pro if those proposed prices are adopted. Both paid plans unlock the same ten additional templates. Set start/end timestamps to the purchased period. Verify identity against Authentication > Users and use the UUID, not an email typed into a form. Reopen the picker after activation.

Refunds/cancellations must set status to cancelled through a trusted backend/admin action. Future automated activation needs signed webhook validation, transaction deduplication, expected amount/currency checks and reconciliation before writing subscription state. Never put service-role keys in Expo environment variables.

The subscription table stores the latest entitlement, not a complete payment history/accounting ledger. Workspace save auditing is not a substitute for payment-provider records.
