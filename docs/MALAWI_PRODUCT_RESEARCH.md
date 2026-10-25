# Malawi product and UX decisions

Researched 24 October 2026. These are product choices and proposed commercial terms, not evidence of willingness to pay.

- Default to MWK and Malawi phone numbers. Support cash, bank transfer, Airtel Money and TNM Mpamba in manual collection records. Malawi's competition regulator identifies Airtel and Mpamba as the two main mobile money providers: https://www.cftc.mw/2025/07/17/assessment-of-the-impact-of-the-proposed-exclusive-dealing-arrangement-by-tnm-mpamba-limited-in-the-provision-of-e-ticketing-solution/
- Keep payment collection separate from manual payment recording. Provider onboarding, credentials, signed callbacks and reconciliation are needed before automatic settlement. A local provider documents both wallets: https://malipo.mw/services
- Tax defaults off. MRA's January 2026 transition notice describes electronic invoicing requirements: https://www.mra.mw/admin/storage/download_files/1769007736_003%20TRANSITION%20FROM%20ELECTRONIC%20FISCAL%20DEVICES%20TO%20THE%20ELECTRONIC%20INVOICING%20SYSTEM.pdf . The subsequent 2026/27 budget statement proposes a higher VAT threshold and relief for smaller businesses: https://finance.gov.mw/documents/uploads/2026-03/Doc%201_2026-27%20Budget%20Policy%20Statement_0.pdf . Confirm enacted rules and applicability before fiscal integration; this app is not EIS certified.
- Use visible core navigation on mobile, with additional pages under More, and a sidebar on desktop. Visible navigation improves discoverability: https://www.nngroup.com/articles/find-navigation-mobile-even-hamburger/
- Group form fields and disclose secondary choices when needed: https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
- Proposed plans: Free (10 monthly documents), Starter MK2,000/month or MK20,000/year (50 documents), Pro MK5,000/month or MK50,000/year (unlimited documents). Catalogue, recurring drafts and advanced reports are future paid differentiators. During preview no paid features or quotas are enforced; choosing a plan records interest only. Validate prices with local tradespeople before charging.

Next research: test a five-line quote on low-cost Android phones with five freelancers across trades, measure completion time and data use, test Chichewa wording, and validate renewal affordability. Chichewa is not implemented in this increment.
