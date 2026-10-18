# Workfolio — service business tracker

A first working increment of the Malawi service-business tracker. Built with **React Native, Expo SDK 58 and TypeScript** for web, Android and iOS. Workfolio is a temporary name.

## Run locally

Use Node.js 24 LTS and npm. Extract this folder, then:

```bash
npm ci
npm start
```

Choose the web browser or connect a compatible Expo development client. Other commands:

```bash
npm run web
npm run android
npm run ios
npm run typecheck
npm test
npm run build:web
npx expo export --platform all
```

`android` and `ios` open a development session; they do not produce store packages. Android emulators require Android Studio. iOS Simulator requires macOS and Xcode. Expo Go must support the pinned SDK; otherwise use an Expo development build. Production signing, package identifiers and EAS configuration are deliberately not provisioned yet.

## Implemented

- Shared responsive React Native interface: desktop sidebar, mobile bottom navigation and safe-area handling.
- Dashboard with derived counts and quotation draft totals.
- Create/search customers, including Malawi phone normalisation and service site.
- Create, reopen and edit quotation drafts with multiple items, quantities, units, prices and percentage discount.
- Exact fixed-decimal currency calculations using scaled integers and half-up rounding.
- Create/search/filter direct jobs, inspect customer/site information and update operational status.
- AsyncStorage persistence across restarts, explicit save feedback and failure messages.
- Clearly labelled synthetic demo records; no account credentials or real customer records bundled.

## Important boundaries

This is a **single-device local prototype**, not the completed SaaS. It has no authentication, tenant enforcement, worker permissions, public approval links, PDF generation, invoices, payments, attachments or server sync. The draft total is not revenue. Job completion does not imply payment. Do not use this build to store sensitive customer information or as a financial system.

No backend credentials are required. There is no service-role key or placeholder authentication bypass. AsyncStorage is unencrypted device/browser storage. This demo has no logout because no account exists yet.

The application shares components/domain logic across three targets. Native bundles are not substitutes for physical-device testing or signed Android/iOS builds.

## Structure

```text
App.tsx                     Responsive navigation, overview and list/detail screens
src/components/ui.tsx       Reusable fields, buttons, chips and visual tokens
src/components/Editor.tsx   Customer, draft quotation and direct-job forms
src/domain/model.ts         Types, IDs, phone/date validation
src/domain/money.ts         Exact quotation calculations and MWK formatting
src/data/seed.ts            Synthetic demo records
src/data/storage.ts         Versioned local persistence adapter
tests/domain.test.ts       Business calculation and input validation tests
docs/                       Requirements, platform decisions and delivery backlog
```

## Next increment

Implement Supabase-backed identity, business onboarding and membership, tenant-isolated customers/sites, audited permissions and private attachments. Replace the demo repository boundary with authenticated server operations before enabling real account data. See `docs/IMPLEMENTATION_PLAN.md` for the release sequence and security acceptance criteria.
