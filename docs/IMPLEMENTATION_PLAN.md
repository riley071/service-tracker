# Platform decisions and delivery backlog

## Decision: universal client
Use React Native with Expo and TypeScript for web, Android and iOS. React Native Web renders shared primitives in the browser; Expo handles target bundling. Native camera/file access and browser document download use platform adapters. Desktop navigation can differ from phone navigation while sharing the business workflow.

19 October increment: local business profiles with logos, quotation PDF export and snapshot-based direct/quotation invoices are implemented. See DOCUMENT_WORKFLOW.md. These local features do not complete the authenticated onboarding, server issuance, tenant isolation or payment milestones below.

The original requirements described a web application/PWA. This decision extends that scope to installable Android and iOS clients. Web cache, device local storage, native secure storage and push notifications have different lifecycles; do not treat them as interchangeable.

## Current increment: local workflow prototype
Delivered: responsive workspace, customers, quotation drafts, direct jobs, operational statuses, exact MWK arithmetic and local persistence.
Not delivered: production account or financial workflows. No AC from the complete specification is claimed passed except the tested calculation example AC-03 within the local domain layer.

## Increment 2: secured account foundation
Proposed backend: Supabase Auth/PostgreSQL/private Storage, subject to actual project provisioning.
- Business onboarding transaction creates business and owner membership atomically.
- Membership-based row-level security; worker reads must use safe projections, not merely hide prices in UI.
- Session persistence: platform-appropriate secure strategy, reset/verification deep links and immediate membership revalidation.
- Owner/manager/finance/worker enforcement for every server read/write, storage URL, report and background task.
- Customers with multiple sites; archive/history preservation; pagination and duplicate warnings.
- Audit events written by trusted server/database operations.
- Private attachment upload validation/scanning and short-lived retrieval.
- Test two tenants, removed memberships, worker field restrictions and direct REST/storage access before any real rollout.

Public environment variables may contain a backend URL and publishable client key only. Service-role credentials must never be shipped in web or native bundles.

## Increment 3: quotations and approval
- Route-based navigation/deep links, catalogue and enquiry assessments.
- Server-side numeric validation and transactional publication/numbering/idempotency.
- Immutable version snapshots, A4 PDFs, version-scoped revocable tokens and browser-first customer approval pages.
- Atomic acceptance vs revision race handling, expiry and withdrawal.
- Approved quote to exactly one job; separately approved variations.

## Increment 4: work delivery
- Assignments, tasks, worker restrictions, calendar, notes/photos and approved expenses.
- Completion/reopening/closure with explicit permission checks.
- Native photo upload, web file selection and private media visibility.

## Increment 5: financial documents
- Server-posted invoices, credit notes, verified payments, allocations, customer credits, refunds and receipts.
- Transactional ledger, no destructive posted-record edits, idempotency and concurrency tests.
- Receivables, tax-exclusive margin reports and safe exports.

## Increment 6: release readiness
- Subscription states, owner exports, published retention policy and local legal/tax review.
- Offline draft queue with conflict resolution; destructive/financial actions remain online.
- Monitoring, private support grants, backup restoration and accessibility testing.
- Android and iOS development builds, physical devices, signed production builds, store privacy disclosures and web deployment.
- All specification ACs pass before pilot-ready status.

## Build checks versus device validation
Run TypeScript checks, domain tests and Expo export for all targets. These verify static types, selected business rules and bundle generation. They do not establish runtime usability, accessibility, native signing or real-device behaviour. Test phone and desktop layouts and restart persistence on actual targets before release.
