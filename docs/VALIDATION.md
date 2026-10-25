# Validation — 18 October 2026

## Business documents increment — 19 October 2026

- Eight domain tests passed, including invoice numbering, snapshot isolation, invalid due dates, incomplete profiles, escaped document content and exact invoice totals.
- Typechecking passed. Web, Android and iOS bundle exports passed with Expo Print, Sharing and ImagePicker.
- Expo lint passed with the new flat ESLint configuration.
- Sample invoice HTML visually inspected in headless Edge. Actual native PDF generation/share sheets, logo selection and restart persistence still require device testing; browser print-to-PDF needs interactive verification.
- Business profile setup is local onboarding; authenticated owner registration, tenant isolation and server-backed invoicing remain unimplemented.

## Previous baseline

- `npm test`: 5 domain tests passed (exact quotation discount, fractional rounding, invalid values, phone formatting and real-date validation).
- `npm run typecheck`: passed.
- `npx expo export --platform all`: web, Android and iOS bundles generated successfully.
- Additional online dependency compatibility lookup (`expo install --check`) was blocked by an HTTP proxy timeout. Dependencies were installed using the SDK-aware Expo installer and the lockfile is included.
- No browser visual QA, emulator session, physical-device testing, signed native build, authentication test, backend integration test or production deployment has been performed.
- This local prototype does not satisfy the complete SaaS release gate. See IMPLEMENTATION_PLAN.md.


## 24 October 2026 workspace expansion

- TypeScript and Expo lint pass.
- Ten domain/document/payment tests pass, including exact partial-payment reconciliation and invalid amount rejection.
- Web export passes with Expo Router routes.
- SheetJS 0.20.3 workbook write/read round-trip passes. Browser download and native sharing still need interactive device tests.
- Live Supabase signup, email recovery, RLS and concurrent write tests require a provisioned project and are not claimed verified.
- Dependency audit: the newly introduced vulnerable npm SheetJS version was replaced by official 0.20.3. Eight remaining advisories concern Expo/tooling dependency trees; production dependency review remains open. No forced SDK downgrade was applied.
- Android/iOS and phone/desktop visual QA remain outstanding. Bundle success is not runtime validation.


## Supabase-only configuration update

- Removed the login bypass, sample-data module and AsyncStorage workspace adapter. Application reads and writes use Supabase only.
- Typecheck, lint and 11 automated tests pass, including mocked Auth/REST failures, confirmation-required signup, authenticated saves and stale-revision handling.
- Added complete rerunnable SQL setup, new-user workspace provisioning, save-event auditing and rollback-only SQL isolation checks.
- SQL and live signup/email/RLS checks have not been executed against a hosted project in this workspace. Run supabase/verify.sql after applying schema.sql to a development project.
- Supabase configuration, structure, commands and remaining capabilities are documented in README.md and docs/ACCOUNT_SETUP.md.
