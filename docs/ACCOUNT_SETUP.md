# Supabase connection quick reference

Supabase is required. Guest access, bundled sample records and the device-only workspace loader have been removed.

1. Create a Supabase project.
2. Run the complete `supabase/schema.sql` in SQL Editor. It can be rerun over the earlier schema without deleting records.
3. Copy `.env.example` to `.env.local` and enter the project URL and public publishable/anon key. Never use service-role credentials in the client.
4. Enable Email authentication, confirmation, SMTP and the actual site/redirect URLs.
5. Restart Expo with `npm run web`.
6. Register, confirm your email and sign in. Accounts start empty; set up a business profile and create your first customer.
7. Run `supabase/verify.sql` in a development project and perform the live checks below.

## Live verification checklist

- Register two real test users and confirm their emails.
- Save a different customer under each account; neither account should see the other's workspace.
- From an authenticated REST client, querying the other owner ID must return no rows. Unauthenticated access must fail.
- Direct INSERT/UPDATE/DELETE on workspaces must be denied. The authenticated save RPC must only write the caller's row.
- Open one account on two clients. Save on the first; saving the stale second revision must fail.
- Sign out and verify the workspace and any open editor are cleared.
- Reload: sign-in is required again because sessions are memory-only.
- Verify PDF output and Excel download/sharing on actual target devices.

The Forgot password button requests an email only. A complete recovery callback/reset page must be configured and tested separately. Signed-in password changes are available in Profile.

The database stores one JSON workspace per owner, guarded by RLS and an owner-scoped revision-checked RPC. Save metadata is audited, but invoice/payment posting is not a server-enforced ledger. Team permissions, public quote approval, automatic billing and payment collection remain outstanding. Plan interest never activates paid entitlements.

See the root README for the full system structure, SQL objects, security boundaries, deployment notes and troubleshooting.
