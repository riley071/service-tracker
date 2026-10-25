# Workfolio - service business invoicing and job tracker

Workfolio helps freelancers, general labourers and small service businesses in Malawi keep customers, quotations, jobs, invoices and collections together. The same Expo/React Native application runs on web, Android and iOS.

**Supabase is required.** There is no guest workspace, sample-data loader or local-storage fallback. Users must sign in before viewing business records. A new account starts with empty lists.

## Current capabilities

| Area | Available behaviour |
| --- | --- |
| Accounts | Email/password registration, email confirmation through Supabase, sign-in, sign-out, password change and recovery email request |
| Business profile | Trading name, owner, phone, email, address, optional registration number, logo, payment details and document terms |
| Customers | Create and search customer contacts and service sites; normalise Malawi phone numbers |
| Quotations | Create/edit drafts with line descriptions, quantities, units, prices and percentage discounts; PDF export |
| Jobs | Create direct jobs, search/filter and update operational status |
| Invoices | Create directly or from a quotation; sequential references and copied business/customer/line details |
| Collections | Manually record confirmed cash, Airtel Money, TNM Mpamba and bank-transfer payments; partial balances and payment history |
| Reports | Invoiced value, recorded collections, outstanding balances and outstanding invoice list |
| Exports | Individual quotation/invoice PDFs and an Excel workbook containing business records |
| Preferences | Default invoice payment term, preferred payment instructions and compact list spacing |
| Plans | Display proposed monthly/annual prices and save plan interest |
| Navigation | Desktop sidebar; mobile header menu with full-width page links; Expo Router URLs |

This is the current solo-owner workspace implementation. The wider requirements in `docs/REQUIREMENTS_SOURCE.md` remain a roadmap. A job marked Completed does not mark an invoice paid. A recorded payment does not initiate a wallet charge.

## Technology

- Expo SDK **58**, React Native **0.88**, React **19.3**, TypeScript.
- Expo Router for routes and deep links; React Native Web for the browser.
- Supabase Auth and PostgreSQL accessed with `fetch` through Auth/PostgREST endpoints.
- PostgreSQL row-level security (RLS), owner-scoped write RPC and revision checks.
- Expo Print/Sharing for native PDF output; browser print dialogue for web PDF saving.
- Expo FileSystem/Sharing for native Excel saving; browser download on web.
- SheetJS **0.20.3** from its official distribution for `.xlsx` generation.

There is no separate Node API server to start and no Supabase JavaScript SDK dependency. Supabase hosts the backend.

## Local prerequisites

1. Node.js 24 LTS and npm.
2. A Supabase project you control.
3. A browser for web development; a compatible Expo development client/device for native testing.
4. Network access to your Supabase project. Offline editing/sync is not implemented.

Use npm for this repository (`package-lock.json` is committed). Add Expo/native dependencies with `npx expo install <package>` so versions match SDK 58. Follow `AGENTS.md` before changing Expo APIs.

## Connect Supabase

### 1. Create the database objects

Open your Supabase project, select **SQL Editor**, and run the entire [supabase/schema.sql](supabase/schema.sql) file as the project database administrator.

The script is transactional and safe to rerun over the earlier Workfolio schema. It preserves existing workspace data. It creates or updates:

- `public.workspaces`: one private workspace per Auth user.
- `public.workspace_events`: metadata about workspace creation and saves.
- RLS policies allowing authenticated users to read only their own rows.
- `public.save_workspace(payload jsonb, expected_revision integer)`: the only client write entry point.
- A trigger that creates an empty workspace when a new Auth user is registered.
- Empty workspaces for existing Auth users that do not already have one.
- Payload-shape and positive-revision constraints, save auditing and a PostgREST schema-cache refresh.

The script does not erase Auth users or existing records. If an existing record fails a new constraint, the transaction fails; review that record and rerun rather than dropping tables. No separate profiles, invoices or customer tables are required by the current client: those records are stored in `workspaces.data`.

### 2. Configure authentication

In the Supabase dashboard:

1. Enable the Email provider under Authentication.
2. Enable **Confirm email** for public registration.
3. Configure your Site URL and allowed redirect URLs for your actual web domain/development URLs.
4. Configure a suitable password policy (the client requires at least eight characters).
5. Configure SMTP and email templates before inviting production users.
6. Set appropriate Auth rate limits and test email delivery.

Registration calls Supabase Auth. With email confirmation enabled, the app asks the user to confirm their email and then sign in. Workspace records are linked to `auth.users.id`; users cannot supply another owner ID to the save RPC.

The Forgot password action requests a Supabase recovery email. **A complete recovery callback/reset page is not implemented in this client.** Configure and test a hosted recovery flow before relying on self-service password recovery. Signed-in users can change their password on the Profile page.

### 3. Configure environment variables

Copy the template:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY
```

Use your Supabase **publishable key** or legacy **anon** key. Both are public client keys. Never use the `service_role` key, database password, JWT signing secret or other privileged secret here: `EXPO_PUBLIC_` values are embedded in client bundles.

`.env.local` is ignored by Git. `.env.example` contains placeholders only. Restart Expo after changing environment variables. For a deployed build, provide the same public values in its build environment and rebuild.

### 4. Install and start

```bash
npm ci
npm run web
```

Other development commands:

```bash
npm start
npm run android
npm run ios
```

The Android/iOS commands start development sessions; they do not generate signed store packages. The project uses Continuous Native Generation: do not edit or create `ios/` or `android/` manually. Cloud builds/signing/submission require separate EAS project configuration.

### 5. First-use workflow

1. Register with an email address you can access.
2. Confirm the email, then sign in.
3. Save your Business profile (including contact/payment instructions).
4. Add a customer.
5. Create a quotation, review it and export a PDF.
6. Create an invoice directly or from the quotation; choose its due date.
7. Record confirmed receipts against the invoice as customers pay.
8. Review outstanding amounts under Reports and export Excel when needed.

New accounts contain no customers, quotations, jobs, invoices or payments. Records from the removed device-only workspace are not imported. The app no longer reads or writes that old browser/device storage.

## Repository structure

```text
service-tracker/
  AGENTS.md                         Project rules and versioned Expo documentation policy
  App.tsx                           Shared shell, auth gate, page content, forms and save orchestration
  index.ts                          Expo Router entry import
  app.json                          Expo app, platform and plugin configuration
  package.json / package-lock.json  Scripts and pinned dependency graph
  tsconfig.json                     Strict TypeScript configuration
  eslint.config.js                  Expo lint rules
  .env.example                      Public Supabase configuration template
  assets/                           Application icons and splash artwork
  src/
    app/
      _layout.tsx                   Persistent application shell and Router Slot
      index.tsx                     Root route
      [section].tsx                 Workspace section route
    components/
      Login.tsx                     Sign-in, registration and recovery-email request
      AccountPages.tsx              Profile, settings, reports and proposed plans
      BusinessEditor.tsx            Business identity and logo form
      Editor.tsx                    Customer, quotation and direct-job forms
      InvoiceWorkspace.tsx          Invoice creation, PDFs, payments and history
      ui.tsx                        Buttons, fields, badges, chips and design tokens
    data/
      account.ts                    Supabase REST client, memory-only session and workspace persistence
      excel.ts                      Workbook construction and platform-specific export
      exportDocument.ts             Browser/native PDF adapter
    domain/
      model.ts                      Record types, IDs, phone/date validation
      money.ts                      Exact decimal calculations and MWK formatting
      documents.ts                  Invoice creation, snapshots and escaped document HTML
      payments.ts                   Payment amount validation and invoice balances
  supabase/
    schema.sql                      Complete database setup for this client
    verify.sql                      Rollback-only database isolation/conflict smoke tests
  tests/
    account.test.ts                 Mocked Auth and workspace REST contract tests
    domain.test.ts                  Money, phone and date tests
    documents.test.ts               Invoice snapshot and HTML safety tests
    payments.test.ts                Collection reconciliation and invalid amount tests
  docs/
    ACCOUNT_SETUP.md                Setup quick reference and live verification checklist
    MALAWI_PRODUCT_RESEARCH.md      Market sources and product/UX choices
    REQUIREMENTS_SOURCE.md         Wider product requirements and acceptance criteria
    IMPLEMENTATION_PLAN.md         Historical roadmap and delivery sequence
    DOCUMENT_WORKFLOW.md           Earlier document workflow notes
    VALIDATION.md                  Validation history and remaining checks
```

Non-route code belongs outside `src/app`. Current section URLs include `/overview`, `/invoices`, `/quotations`, `/customers`, `/jobs`, `/reports`, `/profile`, `/settings` and `/plans`. Opening any route still requires sign-in. Web hosts must rewrite client routes to `index.html`.

## Database and record structure

### `public.workspaces`

| Column | Purpose |
| --- | --- |
| `owner_id uuid` | Primary key and foreign key to `auth.users`; identifies the sole owner |
| `data jsonb` | Versioned business workspace containing the records below |
| `revision integer` | Positive save version used for optimistic concurrency |
| `created_at timestamptz` | Workspace creation timestamp |
| `updated_at timestamptz` | Last successful save timestamp |

Workspace JSON mirrors `AppData` in `src/domain/model.ts`:

```json
{
  "version": 1,
  "customers": [],
  "quotes": [],
  "jobs": [],
  "invoices": [],
  "payments": []
}
```

Optional fields are `business`, `preferences` and `planRequest`. Customers contain phone/site details. Quotations contain draft lines and discounts. Jobs contain schedule/status/notes. Invoices include copied business/customer/line details. Payments reference an invoice ID. Logos currently use inline image data; there is no Storage bucket to configure for this version.

### `public.workspace_events`

Stores an identity ID, owner ID, revision, action (`created` or `saved`) and timestamp. Each `(owner_id, revision)` is unique. It records successful workspace writes atomically without logging the entire customer payload. It is not an immutable invoice/payment ledger or a full financial audit trail.

### Save and concurrency flow

```text
Authenticated screen -> cloudLoad() -> owner-filtered workspace + revision
Form submission -> client validation -> save_workspace(payload, expected_revision)
Database -> auth.uid() owner check -> matching revision update + audit event
Success -> returned revision -> update in-memory workspace
Failure -> display error; do not report the change as saved
```

If two devices load revision 4, the first successful save advances it to 5. The second save using revision 4 fails. Preserve input before reloading; there is no automatic record-level merge. Save requests are not automatically retried after an ambiguous network failure: reload to reconcile server state first.

The RPC supports revision 0 only for creating a missing workspace. Normal registration automatically creates revision 1. Payloads are limited to 10 MB and validated for required/optional top-level structure. Domain rules remain mostly client-side; deep database financial validation is future work.

## Session and data handling

- Supabase access/refresh tokens live in memory only. Restarting/reloading requires sign-in.
- Tokens refresh when needed during authenticated requests.
- Workspace records are fetched from and saved to Supabase; no AsyncStorage fallback remains.
- A missing environment configuration blocks sign-in and explains what to configure.
- Failed reads show an error and a return-to-sign-in action instead of loading sample records.
- Sign-out clears the in-memory session, workspace and open editing state. Existing exported files remain wherever the user saved them.
- Database permissions reject direct client writes; the owner-scoped RPC performs saves. RLS is still enforced for reads.

## Money, invoices and collections

Money is calculated using scaled integer/BigInt arithmetic with defined rounding. Decimal strings are stored in records; BigInt values are not serialized to JSON. The default currency is MWK.

Invoice details are copied when created so later changes to a customer or business profile do not alter those saved invoice copies. These are application-level snapshots, not server-enforced immutable financial records.

Manual payments must be positive, cannot exceed the remaining invoice balance, and cannot be dated in the future. Non-cash payments require a transaction reference. Overpayments/customer credits, reversals, refunds and credit notes are not implemented. Correcting posted financial history needs the later audited ledger design.

Tax defaults off. Workfolio is not an MRA-certified electronic tax invoicing system. Local regulatory applicability and fiscal integration require separate validation.

## PDF and Excel exports

- Quotation and invoice PDF actions use the business identity and relevant record details.
- Web opens the print dialogue; choose **Save as PDF**. Allow the document popup if the browser blocks it.
- Native PDF output is generated by Expo Print and opened through the system share sheet.
- Reports exports a real `.xlsx` workbook with Invoices, Quotations, Customers, Jobs and Payments sheets.
- Excel generation is loaded on demand. Amounts are numeric MWK values; invoice totals/paid/balances are separate columns.
- Empty sheets report that no records exist. Exports contain the current loaded workspace; reload first if another device has changed it.

## Proposed subscription plans

| Plan | Monthly | Annual | Proposed differentiation |
| --- | --- | --- | --- |
| Free | MK0 | MK0 | 10 monthly documents, customers/jobs and basic exports |
| Starter | MK2,000 | MK20,000 | 50 monthly documents, reusable catalogue and branding |
| Pro | MK5,000 | MK50,000 | Unlimited documents, recurring drafts and advanced reports |

Annual pricing equals ten monthly payments. These prices and limits are proposals. Plan selection saves interest only. Billing, entitlement enforcement and document quotas are not enabled. Core features and three free templates remain accessible. Ten premium templates require verified paid access. `planRequest` is user-editable interest data, never a trusted paid-subscription state.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build:web
```

For bundle checks across targets, use `npx expo export --platform all`. Bundle success does not establish physical-device behaviour or signing readiness.

After applying SQL, run [supabase/verify.sql](supabase/verify.sql) in a development/staging project. It creates two temporary test users inside a transaction, checks owner isolation, direct-write restrictions, anonymous restrictions, invalid payloads and stale revisions, then rolls everything back. It does not send signup emails. Also test two actual accounts through the UI and inspect your project's security/advisor settings before production use.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Sign-in is disabled | Supply both environment variables and restart Expo |
| Invalid API key / project unreachable | Check the public key, project URL, project status and network |
| Email not confirmed | Open the confirmation email; verify provider/template/SMTP settings |
| Workspace table/function missing | Run the entire SQL file in the same project as the app URL |
| Permission denied | Check RLS policies and authenticated role grants; never disable RLS to bypass errors |
| Stale workspace error | Preserve unsaved input, reload/sign in again, and reconcile the latest records |
| Signup database error | Inspect Auth/Postgres logs and the workspace-creation trigger; verify SQL completed |
| Save did not report success after network loss | Reload to see whether the server committed before retrying |
| Refreshing a section URL gives 404 | Configure SPA fallback rewrites on the web host |
| PDF does not open | Allow the popup or check platform sharing support |

## Production work still required

- Live Auth/email/recovery testing and session lifecycle hardening.
- Hosted two-account permission checks and backup/restore verification.
- Normalized transactional financial records, server-side business rules, reversals/refunds and idempotent issuance.
- Multi-user businesses, invitations and owner/manager/finance/worker authorization.
- Published quotation versions, secure public approval links and conversion workflows.
- Payment-provider onboarding, signed callback verification, reconciliation and subscription enforcement.
- Offline draft synchronization, attachment storage, monitoring, privacy/retention policy and account-deletion process.
- Mobile/desktop accessibility, physical-device QA and signed release builds.
- Review remaining dependency advisories before release; do not use forced package fixes that downgrade the Expo SDK.

See [Malawi research](docs/MALAWI_PRODUCT_RESEARCH.md) for the product sources and [full requirements](docs/REQUIREMENTS_SOURCE.md) for the intended complete system.


## Template library

Invoice and quotation exports now offer **3 free templates and 10 paid templates**. Both Starter and Pro verified subscriptions unlock the ten additional designs. Paid styles are stored in Supabase and protected by RLS, with a fresh entitlement check on export. Plan interest does not grant access. For existing projects run `supabase/templates.sql`; new setups include it in `schema.sql`. See [template setup and manual payment verification](docs/TEMPLATES_AND_PAYMENTS.md) before activation. Checkout is not connected.
