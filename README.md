# Workfolio

An invoicing, quotation and job-tracking application for freelancers, general labourers and service businesses in Malawi.

Workfolio brings customer details, quoted work, job progress, invoices and recorded payments into one workspace. It uses Malawian kwacha (MWK) and supports manual records for cash, Airtel Money, TNM Mpamba and bank transfers.

The application shares an Expo/React Native codebase across web, Android and iOS. **Supabase is required:** users must register and sign in, and each account starts with an empty workspace.

## Contents

- [What the system does](#what-the-system-does)
- [Installation](#installation)
- [Supabase setup](#supabase-setup)
- [Using the application](#using-the-application)
- [Templates and subscriptions](#templates-and-subscriptions)
- [System architecture](#system-architecture)
- [Project structure](#project-structure)
- [Packages](#packages)
- [Development commands](#development-commands)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Current limitations](#current-limitations)

## What the system does

| Module | Available features |
| --- | --- |
| Authentication | Email/password registration, sign-in, email confirmation through Supabase, sign-out and signed-in password changes |
| Business profile | Business/owner names, contact details, address, optional registration number, logo, payment instructions and document terms |
| Customers | Create and search customer contacts and service-site information; Malawi phone-number normalisation |
| Quotations | Create and edit drafts with line descriptions, quantities, units, prices and percentage discounts |
| Jobs | Create jobs directly, filter/search them and update their operational status |
| Invoices | Create invoices directly or from saved quotations, with sequential references and copied document details |
| Payments | Record confirmed receipts, partial payments, transaction references and payment history |
| Reports | View invoiced value, recorded collections, outstanding balances and unpaid invoices |
| PDF export | Choose a template and export a quotation or invoice with business identity, line items, totals and payment instructions |
| Excel export | Export Invoices, Quotations, Customers, Jobs and Payments worksheets from Reports |
| Settings | Default invoice payment term, payment instructions and compact list spacing |
| Navigation | Desktop sidebar and a mobile header menu with grouped, full-width page links |
| Subscriptions | Plan-interest registration and server-controlled access to paid document templates |

The current application supports **one owner per workspace**. A completed job and a paid invoice are separate states. Recording a payment records money already received; it does not charge a customer or contact their mobile wallet.

## Installation

### Requirements

- Node.js 24 LTS and npm for the documented development setup.
- A Supabase project with access to its SQL Editor and Authentication settings.
- An internet connection to the Supabase project.
- A browser for web development, or an appropriate Expo development client/device for native testing.

The repository uses npm and includes `package-lock.json`.

### 1. Open the project

In PowerShell, change to your project folder:

```powershell
cd C:\Users\DELL\Desktop\service-tracker
```

Use your own checkout path if the project is in a different location.

### 2. Install dependencies

```bash
npm ci
```

This installs the versions recorded in the lockfile. Do not install a separate global Expo CLI.

### 3. Set the environment variables

If `.env.local` already exists, edit it rather than overwriting your configuration. Otherwise, copy the example:

```powershell
Copy-Item .env.example .env.local
```

Set these two values in `.env.local`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

The variable named `EXPO_PUBLIC_SUPABASE_ANON_KEY` accepts the public publishable key or the legacy anon key. Get the matching URL/key from your Supabase project.

`EXPO_PUBLIC_` values are embedded in the client application. Never put a service-role key, database password or signing secret in these variables. `.env.local` is ignored by Git. Restart Expo whenever you change the environment configuration.

### 4. Apply the Supabase setup

Complete the [Supabase setup](#supabase-setup) below before registering users.

### 5. Run the web application

```bash
npm run web
```

Open the local address printed by Expo. Alternatively, start the development menu with:

```bash
npm start
```

No separate API server needs to be started.

## Supabase setup

### Database installation

In your Supabase project's SQL Editor, run the **entire** [supabase/schema.sql](supabase/schema.sql) file as the project database administrator.

That file creates the workspace tables, security policies, save function, new-user trigger, template subscription table and ten paid template styles. It also creates empty workspaces for existing Auth users that do not already have one.

For a project that already has the workspace schema but has not received the template update, run [supabase/templates.sql](supabase/templates.sql). A fresh installation using the current `schema.sql` already includes this update.

| File | Purpose | When to run |
| --- | --- | --- |
| `supabase/schema.sql` | Complete setup for the current client | New installation or full schema update |
| `supabase/templates.sql` | Paid-template tables, styles, policies and access function | Upgrade an earlier workspace installation |
| `supabase/verify.sql` | Workspace isolation, write-permission and conflict checks | Development/staging after setup |
| `supabase/verify_templates.sql` | Paid access, expiry, cancellation and template-permission checks | Development/staging after the template update |

The setup scripts are designed to be rerunnable and preserve existing records. A constraint failure rolls back the setup transaction; inspect the failing data before retrying. Verification scripts create temporary fixtures inside a transaction and roll them back. **Verification does not activate a real subscription.** If a verification script stops on an error, issue `ROLLBACK;` before investigating.

### Authentication configuration

In Supabase Authentication settings:

1. Enable the Email provider.
2. Enable email confirmation for public registration.
3. Configure the Site URL and allowed redirect URLs for your development and hosted application.
4. Configure the password policy; the client requires at least eight characters.
5. Configure email templates, SMTP and suitable rate limits before inviting production users.

With email confirmation enabled, registration asks the user to confirm their email and then sign in. A trigger creates their empty workspace when the Auth user is created.

The Forgot password button requests a recovery email. The application does **not** yet include a complete recovery callback/reset page. Configure and test a separate hosted recovery flow before relying on that feature. Signed-in users can change their password on Profile.

See [ACCOUNT_SETUP.md](docs/ACCOUNT_SETUP.md) for the live verification checklist.

## Using the application

### First-time setup

1. Register using an email address you can access.
2. Confirm the email if required, then sign in.
3. Open **Business profile** and save your trading name, contact details, logo and payment instructions.
4. Add your first customer and their job-site details.

### Quotation to invoice

1. Open **Quotations** and create a draft.
2. Select the customer and add the work, quantities, units and prices.
3. Review the discount and total, then save.
4. Choose **Export quotation PDF** to select a document template.
5. When billing is appropriate, open **Invoices** and create an invoice from the saved quotation.
6. Set the payment due date and export the invoice.

You can also create a direct invoice without a quotation. Creating an invoice from a quotation does not establish online customer approval: public approval links are not implemented.

### Jobs and payments

Create a job in **Jobs** and update its status as work progresses. Invoice balances remain independent of that status.

When money has been received, find the invoice and choose **Record payment**. Enter the amount, date and payment method. Bank/mobile-money payments require a transaction reference. Partial payments reduce the remaining balance. Overpayments and future-dated payments are rejected.

Use **Reports** to review balances and choose **Download Excel workbook** to export the loaded records.

### Choosing a document template

1. Open an invoice or quotation.
2. Select its PDF export button.
3. Choose a design in **Choose your template**.
4. Select **Export PDF with this template**.

On web, allow the document popup and choose **Save as PDF** in the print dialogue. On Android/iOS, the app generates a PDF and opens the system share sheet. Invoice PDFs show invoice value, manually recorded payments and the balance at export time.

## Templates and subscriptions

There are **13 document designs**, available for both invoices and quotations.

| Access | Templates |
| --- | --- |
| Free: 3 designs | Classic Green, Minimal, Simple Ledger |
| Paid: 10 additional designs | Executive, Artisan, Blueprint, Signature, Fresh, Studio, Contractor, Elegant, Horizon, Precision |

Both Starter and Pro verified subscriptions unlock the same ten paid designs. The client includes only the three free styles; paid CSS is retrieved from Supabase after an access check. Expired or cancelled subscriptions lose access to new paid-template exports but retain the three free designs. Existing exported files remain usable.

### Plan pricing

| Plan | Proposed monthly price | Proposed annual price | Template access |
| --- | --- | --- | --- |
| Free | MK0 | MK0 | 3 free designs |
| Starter | MK2,000 | MK20,000 | 3 free + 10 paid designs after verification |
| Pro | MK5,000 | MK50,000 | 3 free + 10 paid designs after verification |

Annual prices equal ten monthly payments. Document quotas, recurring invoice drafts and other proposed paid differentiators are not enforced or implemented merely because they appear in the plan proposal.

**Checkout is not connected.** Selecting a plan saves interest only. A trusted administrator must verify an actual subscription payment and activate the corresponding period in `template_subscriptions`. A user cannot activate access by editing their workspace or recording a payment against one of their customer invoices.

Follow [TEMPLATES_AND_PAYMENTS.md](docs/TEMPLATES_AND_PAYMENTS.md) for the administrative SQL example, activation procedure and cancellation behaviour. Never place administrative credentials in the app.

## System architecture

```text
Expo / React Native client
  |-- App.tsx: authenticated shell, navigation and workspace state
  |-- components/: screens, editors and template picker
  |-- domain/: types, money rules, invoice creation and document HTML
  |-- data/: Auth/REST requests and platform export adapters
  |
  +--> Supabase Auth: registration, credentials and sessions
  +--> Supabase PostgREST / PostgreSQL:
         workspace reads protected by row-level security
         revision-checked workspace saves through an RPC
         verified subscriptions and paid-template styles
```

The Supabase client in `src/data/account.ts` uses native `fetch` against Auth and PostgREST endpoints. There is no Supabase JavaScript SDK dependency or separate custom backend server.

### Database objects

| Object | Role |
| --- | --- |
| `auth.users` | Supabase-managed user identities |
| `public.workspaces` | One private JSON workspace per owner, plus timestamps and save revision |
| `public.workspace_events` | Metadata for successful workspace creation/save events |
| `public.template_subscriptions` | Administrator/backend-controlled verified subscription state and period |
| `public.document_template_styles` | The ten paid template CSS designs |
| `public.save_workspace(...)` | Authenticated, owner-scoped save with optimistic concurrency |
| `public.has_paid_templates()` | Checks an active subscription using server timestamps |

Business records currently live together in `workspaces.data`, rather than separate customer/invoice tables:

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

Optional workspace fields are `business`, `preferences` and `planRequest`. The authoritative types are in `src/domain/model.ts`. Logos are currently stored as inline image data; no Supabase Storage bucket is needed for this version.

### Saving and conflicts

Loading a workspace returns its data and revision. A save submits the full workspace plus the revision it was based on. The server writes only the authenticated owner's row and advances the revision.

If two devices load revision 4, the first successful save advances it to 5. A second save based on revision 4 is rejected. Preserve unsaved input and reload before reconciling the change. There is no automatic merge or offline sync. The save RPC limits payloads to 10 MB and validates their top-level structure; it is not a full server-side financial rules engine.

### Sessions and permissions

Access and refresh tokens are held in memory. Reloading/restarting the app requires sign-in again. Workspace data has no local-storage fallback. Sign-out clears the in-memory account, workspace and open editing state.

Row-level security restricts account reads. Client roles cannot directly write workspace rows, subscriptions or template styles. Workspace saves use the owner-scoped RPC; subscription activation requires a trusted administrator/backend. Workspace auditing tracks save events, not a complete invoice/payment ledger.

### Financial calculations

Money calculations use scaled integers and BigInt with defined rounding. Decimal strings are stored in JSON; BigInt values are used during calculation rather than serialized. Invoice creation copies business, customer and line details so later profile edits do not change that saved invoice's copies. These copies are not yet enforced as immutable records by the database.

## Project structure

```text
service-tracker/
|-- App.tsx                     Shared shell, account gate and workspace orchestration
|-- index.ts                    Expo Router entry import
|-- app.json                    Expo platform settings, assets and plugins
|-- package.json                Packages and npm scripts
|-- package-lock.json           Locked dependency versions
|-- tsconfig.json               TypeScript configuration
|-- eslint.config.js            Lint configuration
|-- AGENTS.md                   Project development instructions
|-- .env.example                Environment-variable names/example configuration
|-- .env.local                  Local Supabase values; ignored by Git
|-- assets/                     Icons and splash artwork
|-- src/
|   |-- app/
|   |   |-- _layout.tsx         Persistent shell and Router Slot
|   |   |-- index.tsx           Root route
|   |   +-- [section].tsx       Workspace section route
|   |-- components/
|   |   |-- Login.tsx           Sign-in, registration, recovery-email request
|   |   |-- Editor.tsx          Customer, quotation and direct-job forms
|   |   |-- BusinessEditor.tsx  Business identity and logo form
|   |   |-- InvoiceWorkspace.tsx Invoice creation and payment workflows
|   |   |-- AccountPages.tsx    Profile, settings, reports and plan proposals
|   |   |-- TemplatePicker.tsx  Free/paid template selection
|   |   +-- ui.tsx              Shared controls and design tokens
|   |-- data/
|   |   |-- account.ts          Supabase Auth, workspace and entitlement requests
|   |   |-- exportTemplate.ts   Template lookup, paid-style fetch and export flow
|   |   |-- exportDocument.ts   Browser/native PDF output
|   |   +-- excel.ts            Excel workbook generation and sharing
|   +-- domain/
|       |-- model.ts            Record types and phone/date validation
|       |-- money.ts            Exact money calculations and MWK formatting
|       |-- documents.ts        Invoice snapshots and escaped document HTML
|       |-- payments.ts         Payment validation and balances
|       +-- templates.ts        Template catalogue and three free styles
|-- supabase/
|   |-- schema.sql              Complete database setup
|   |-- templates.sql           Template upgrade for existing installations
|   |-- verify.sql              Workspace security/conflict verification
|   +-- verify_templates.sql    Template entitlement verification
|-- tests/                      Automated tests and document-preview scripts
|-- docs/                       Requirements, setup, research and implementation notes
+-- tmp/documents/              Generated development previews
```

Routes live under `src/app`; reusable code belongs outside that directory. The current routes include `/overview`, `/invoices`, `/quotations`, `/customers`, `/jobs`, `/reports`, `/profile`, `/settings` and `/plans`. Each requires authentication.

## Packages

These are the direct dependencies in `package.json`. Exact resolved versions are recorded in `package-lock.json`.

### Core application and navigation

| Package | Declared version | Purpose |
| --- | --- | --- |
| `expo` | `~58.0.14` | SDK, development tooling and platform integration |
| `react` | `19.3.0` | Components, state and rendering model |
| `react-native` | `0.88.0` | Shared native UI primitives |
| `react-dom` | `19.3.0` | React rendering on web |
| `react-native-web` | `^0.21.4` | React Native primitives in the browser |
| `expo-router` | `~58.0.26` | File-based routes and URL navigation |
| `@expo/metro-runtime` | `~58.0.14` | Runtime support for Metro bundles |
| `expo-constants` | `~58.0.13` | Expo application/runtime configuration support |
| `expo-linking` | `~58.0.14` | URL/deep-link integration used by the navigation stack |
| `react-native-screens` | `~4.30.0` | Native screen/navigation support |
| `react-native-safe-area-context` | `~5.10.1` | Safe spacing around system bars and device cutouts |
| `expo-status-bar` | `~58.0.3` | Status-bar appearance |

### Documents, images and files

| Package | Declared version | Purpose |
| --- | --- | --- |
| `expo-image-picker` | `~58.0.10` | Selecting the business logo |
| `expo-print` | `~58.0.7` | Generating native PDF files from document HTML |
| `expo-sharing` | `~58.0.19` | Native file sharing/save flows |
| `expo-file-system` | `~58.0.11` | Writing native Excel export files |
| `xlsx` / SheetJS | `0.20.3` official distribution | Creating Excel workbooks; loaded on demand |

SheetJS is installed from the official tarball URL specified in `package.json`. Exports use the library to write workbooks; spreadsheet import is not implemented.

### Installed storage packages

| Package | Declared version | Current status |
| --- | --- | --- |
| `@react-native-async-storage/async-storage` | `2.2.0` | Installed, but the former local-workspace adapter has been removed |
| `expo-secure-store` | `~58.0.2` | Installed, but persistent secure session storage is not implemented |

Their presence does not mean the current app stores accounts or business data locally. Sessions remain memory-only and workspace persistence uses Supabase.

### Development dependencies

| Package | Declared version | Purpose |
| --- | --- | --- |
| `typescript` | `~6.0.3` | Static type checking |
| `@types/react` | `~19.3.0` | React TypeScript definitions |
| `eslint` | `^9.39.5` | Code linting |
| `eslint-config-expo` | `~58.0.4` | Expo lint rules |

Tests use Node's built-in test runner with TypeScript stripping; Jest is not configured. Before changing Expo/React Native APIs, follow `AGENTS.md` and read the documentation for the installed Expo major version. Install additional Expo/native packages with `npx expo install <package>`.

## Development commands

| Command | What it does |
| --- | --- |
| `npm ci` | Installs locked dependencies |
| `npm start` | Starts Expo development server |
| `npm run web` | Starts development for the browser |
| `npm run android` | Starts Expo targeting Android |
| `npm run ios` | Starts Expo targeting iOS |
| `npm run lint` | Runs Expo/ESLint checks |
| `npm run typecheck` | Runs TypeScript without emitting files |
| `npm test` | Runs `tests/*.test.ts` with Node's built-in test runner |
| `npm run build:web` | Exports the web application into `dist/` |

The Android/iOS scripts start development sessions; they do not build signed store packages. A simulator/emulator needs the corresponding platform tooling, or use a physical device with a compatible development client. Expo Go must support the SDK and required modules.

## Testing

Run the core checks before completing a code change:

```bash
npm run lint
npm run typecheck
npm test
npm run build:web
```

| Test file | Coverage |
| --- | --- |
| `tests/account.test.ts` | Mocked Auth/REST behaviour, authenticated persistence and template-style access responses |
| `tests/domain.test.ts` | Currency calculations, rounding, phone numbers and dates |
| `tests/documents.test.ts` | Invoice copies, numbering, HTML escaping and exported balances |
| `tests/payments.test.ts` | Partial-payment reconciliation and invalid amounts |
| `tests/templates.test.ts` | Three-free/ten-paid catalogue, free-style rendering and consistent totals |

Automated client tests do not prove hosted RLS or payment-provider behaviour. Run the SQL verification scripts in a development/staging project, then test with two real accounts and confirm they cannot read each other's records. Check PDFs, Excel downloads, menu behaviour and sharing on actual target devices.

Developer preview scripts are available at `tests/preview-document.ts` and `tests/preview-templates.ts`. Run them with Node's TypeScript stripping to generate HTML under `tmp/documents/`. Preview fixtures are not loaded into user workspaces.

## Deployment

### Web

1. Set the correct public Supabase environment variables in the build environment.
2. Run `npm ci` and `npm run build:web`.
3. Publish the generated `dist/` directory to your chosen web host.
4. Configure client-route fallback to `index.html` so refreshing `/invoices` and other section URLs works.
5. Update Supabase Site URL/allowed redirects to the hosted address and test signup/email flows.

Environment values are included at build time. Rebuild after changing them.

### Android and iOS

Native signing, application identifiers, EAS configuration and store submission are not provisioned by this repository. Configure those before creating production builds. The project uses Expo Continuous Native Generation; do not create or edit generated `ios/` and `android/` folders manually.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Sign-in is disabled | Both `.env.local` values must be set; restart Expo |
| Invalid key or unreachable project | Confirm the URL/key belong to the same active Supabase project and check connectivity |
| Email not confirmed | Confirm the email and check Auth templates, SMTP and redirect settings |
| Missing table/function | Run the complete SQL setup in the project named by your environment URL |
| Paid templates remain locked | Apply `templates.sql`, verify an active paid subscription, then reopen the picker |
| Template test finishes but no account is upgraded | Verification fixtures are rolled back; use the documented admin activation procedure after real payment verification |
| Workspace conflict | Preserve unsaved input and reload the latest server revision before retrying |
| Signup database error | Inspect Supabase Auth/Postgres logs and confirm the new-user workspace trigger was installed |
| Uncertain save after network failure | Reload to determine whether the write reached the server before retrying |
| PDF popup is blocked | Allow popups for the application and choose Save as PDF in the print dialogue |
| Section URL returns 404 after refresh | Enable SPA fallback to `index.html` on the web host |
| App requests login after refresh | Expected with the current memory-only session handling |

## Current limitations

The current implementation is a working solo-owner application foundation. The complete product requirements are broader than the delivered features.

- Automatic payment collection, checkout and provider webhook reconciliation are not connected.
- Paid template access is implemented; other proposed subscription quotas/features are not enforced.
- A complete password-recovery callback/reset page is still needed.
- Team invitations, worker permissions and multi-user businesses are not implemented.
- Public quotation approval links, immutable published versions and approved variations are not implemented.
- Financial posting still uses one JSON workspace with substantial client-side validation, rather than a normalized transactional ledger.
- Customer credit, overpayments, refunds, reversals and credit notes are not implemented.
- Offline draft sync, private attachment storage and production backup/monitoring workflows require further work.
- Tax is not charged by the current document calculation. Workfolio is not an MRA-certified electronic tax invoicing system.
- Hosted security checks, physical-device accessibility testing and production release validation must be completed for the intended deployment.

## Further documentation

| Document | Contents |
| --- | --- |
| [Account setup](docs/ACCOUNT_SETUP.md) | Supabase connection and live verification checklist |
| [Templates and payments](docs/TEMPLATES_AND_PAYMENTS.md) | Template entitlements and trusted manual activation |
| [Requirements](docs/REQUIREMENTS_SOURCE.md) | Intended complete product scope and acceptance criteria |
| [Implementation plan](docs/IMPLEMENTATION_PLAN.md) | Delivery roadmap and earlier platform decisions |
| [Document workflow](docs/DOCUMENT_WORKFLOW.md) | Earlier document-generation implementation notes |
| [Malawi research](docs/MALAWI_PRODUCT_RESEARCH.md) | Market sources and product/UX choices |
| [Validation](docs/VALIDATION.md) | Historical checks and outstanding verification |

Older implementation notes describe earlier increments. Use the current source code and this README for the present application structure and setup.
