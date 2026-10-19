# Business profiles, quotations and invoices

Use **Register your business** above the workspace to save business identity, logo, contact details, optional registration number, payment instructions and terms. Logo images are stored inline so they survive app restarts and render in native PDFs without local-image URL restrictions. Choose a small image (under 1 MB).

Create and save a quotation, then select **Export quotation PDF** in Quotations. Web opens a separate document and the browser print dialog: select **Save as PDF**. Mobile generates a PDF and opens the system share sheet, where a destination can save or send it. Canceling that sheet does not alter the quotation.

Open **Invoices** above the workspace. Enter the payment due date, then create a direct invoice or invoice an existing quotation. Invoice creation persists an immutable snapshot of business, customer and item details. A quotation can only be invoiced once through this flow. Subsequent changes to quotation drafts or the business profile do not change previously issued invoices. Invoices have sequential references within this device's workspace, beginning INV-00001. Export a saved invoice using its PDF button.

Existing version-1 data loads without losing customers, quotations or jobs; business and invoices are additive optional fields. All mutations retain save-before-display behavior. Storage failures leave the existing data and form input intact.

Documents show line quantities, units, rates, exact subtotal, percentage discount and total in MWK. Tax is not charged or calculated. Invoices are requests for payment, not receipts; payment recording, balances, credit notes and invoice cancellation are not implemented.

This is local business onboarding. Authenticated owner signup, business membership, server storage, global numbering, private logo storage and cross-device access require the backend phase described in IMPLEMENTATION_PLAN.md. Profile setup does not provide those capabilities.

Native PDF export and logo selection need testing on a real Android/iOS device. Restart Metro after updating dependencies; existing custom development clients need rebuilding to include the newly added native packages.
