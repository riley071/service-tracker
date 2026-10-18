**# Service Business Job and Quotation Tracker**

**## Product and software requirements — Version 1.0**



Date: 15 October 2026  

Status: Proposed implementation baseline  

Market: Malawi initially  

Product name: To be decided



**## 1. Product definition**



A subscription web application that helps independent service providers and small teams turn enquiries into approved quotations, organise work, record costs, invoice customers and collect outstanding balances.



Target users include painters, construction contractors, cleaners, welders, electricians, plumbers, carpenters, installers, maintenance teams and repair businesses. The system must support a solo operator and a business with several workers without forcing every trade into a vehicle or workshop workflow.



Core promise: Create professional quotations, track your jobs and know who still owes you.



The product is a business management tool. Customer acquisition marketplaces, escrow, lending and payment processing are outside the first release.



**## 2. Goals and success measures**



**### Goals**

\- Reduce time spent preparing and following up quotations.

\- Preserve the scope, price and version a customer approved.

\- Make scheduled work, responsibility and progress visible.

\- Separate selling prices from internal costs.

\- Maintain accurate deposits, instalments, invoices and customer balances.

\- Work comfortably on affordable smartphones with limited connectivity.



**### Proposed pilot measures**

These are validation targets, not claims about existing demand.

\- Recruit five businesses across at least three trades; at least three use the product weekly for four weeks.

\- At least 80% of pilot users can create and share their first quotation after onboarding without staff intervention.

\- A returning user can create a five-line quotation in under five minutes in a usability test.

\- At least three pilot businesses agree to a paid continuation at a tested price.

\- No cross-business data exposure or unexplained balance differences in pilot checks.

\- Track activation, weekly active businesses, quotation turnaround, approval conversion, recorded collections and subscription retention. Establish numerical growth targets after the pilot baseline.



**## 3. Scope and release priorities**



\| Capability | First release (P0) | Later release |

\|---|---|---|

\| Business profile and access | Solo/team accounts, roles, branding | Custom roles, branches |

\| Customers | Individuals, businesses, sites | Bulk import, advanced CRM |

\| Quotations | Materials/labour, PDF, revisions, public approval | Optional alternatives, richer templates |

\| Jobs | Tasks, dates, workers, notes, photos | Recurring jobs, dependencies, advanced dispatch |

\| Costs | Manual job expenses and worker costs | Purchasing and stock control |

\| Billing | Deposits, instalments, invoices, receipts, credit notes | Automated recurring invoices |

\| Sharing | Download and user-initiated WhatsApp sharing | Automated WhatsApp/SMS/email |

\| Payments | Manual records and verification | Approved payment-provider integration |

\| Reporting | Sales, collections, receivables, job margins | Forecasts and accounting integrations |

\| Offline | Cached app and selected drafts with visible sync | Broader offline operations |

\| Subscription | Configurable plans, manual activation/renewal | Automated subscription collection |



P0 is the complete initial release, delivered incrementally. Never advertise a later feature as available.



**## 4. People and permissions**



**### Roles**

\- Owner: controls business settings, users, subscription, exports and all operational records.

\- Manager: manages customers, quotations, jobs, assignments, expenses and financial documents; cannot transfer ownership or manage the subscription.

\- Finance: manages invoices, payments, refunds, costs and financial reports; can read customer-approved quotations and job summaries; cannot change job scope or assign workers.

\- Worker: views assigned job details, customer contact/site information required for that work, updates tasks/progress, uploads photos and submits expenses for review. Cannot see customer prices, business margins or unrelated jobs.

\- Customer: accesses only explicitly shared document versions and customer-visible updates through secure links; no account required.

\- Platform administrator: manages tenants and subscription states. Tenant content access requires an audited, time-limited support grant; ordinary administration does not expose customer documents.



\| Action | Owner | Manager | Finance | Worker |

\|---|---|---|---|---|

\| Manage users/settings | Yes | No | No | No |

\| Create/send/revise quotes | Yes | Yes | Read only | No |

\| Schedule/assign jobs | Yes | Yes | Read only | No |

\| Update job progress | Yes | Yes | No | Assigned jobs |

\| Issue invoices/credits | Yes | Yes | Yes | No |

\| Verify payments/refunds | Yes | Yes | Yes | No |

\| Submit costs | Yes | Yes | Yes | Assigned jobs |

\| Approve costs/view margins | Yes | Yes | Yes | No |

\| Export all business data | Yes | No | No | No |



A user may belong to multiple businesses but must select an active business. Every request must independently enforce business membership and permissions.



**## 5. End-to-end workflows**



**### A. Enquiry to quotation**

1\. Create or select a customer and service site.

2\. Record the enquiry, description, site visit notes, measurements and attachments.

3\. Build quotation lines using labour, materials, transport, equipment or other categories.

4\. Review totals, exclusions, validity, payment schedule and proposed dates.

5\. Publish an immutable version and share its link or PDF.

6\. Customer accepts, declines or requests changes.

7\. On acceptance, create exactly one linked job through an explicit conversion action.



**### B. Approved work to completion**

1\. Schedule dates and assign one or more workers.

2\. Record tasks, updates, customer-visible notes and photos.

3\. Track actual costs separately from quoted selling prices.

4\. Submit extra work as a priced variation; obtain approval before marking that variation authorised.

5\. Mark completed work ready for review, then completed; record customer acknowledgement if provided.

6\. Invoice and record collections independently from job progress.

7\. Close the job when operational and financial closure conditions are satisfied.



**### C. Direct job**

Create a job without a quotation for emergency work or repeat customers. Record the agreed scope and pricing basis, mark that there is no online quotation approval, and issue invoices normally. Do not represent this as a customer-approved quotation.



**### D. Deposit before work**

Record a payment against an accepted quotation or its job as customer credit. Allocate it to a deposit invoice or later invoice. Show unallocated credit separately and never count an allocation as a second payment.



**## 6. Functional requirements**



**### FR-01 Registration and business setup**

\- Register using email and password, verify email, sign in/out and reset passwords securely.

\- Owner enters business/trading name, service categories, phone, optional email, logo, address and payment instructions.

\- Default currency MWK; default timezone Africa/Blantyre; store timestamps in UTC.

\- Configure quotation/invoice terms, numbering prefixes and default validity/deposit terms.

\- Start without a logo, tax number or a formal company registration field being mandatory.

\- Invite users with single-use expiring invitations; allow removal and reassignment of active jobs.

\- Onboarding offers sample quotation lines relevant to the chosen trade, editable by the business.



**### FR-02 Customer and site management**

\- Create individual or business customers with name, primary phone, optional email/address and contact person.

\- Normalise Malawi phone numbers to +265 where applicable; support international numbers explicitly.

\- Warn about possible duplicate phones/names without blocking legitimate shared numbers.

\- Store multiple sites with area, address, directions, contact and optional map link.

\- Show linked enquiries, quotations, jobs, invoices, receipts and balances.

\- Archive customers; preserve document history. Prevent deletion of customers referenced by financial records.

\- Keep internal notes separate from customer-visible content.



**### FR-03 Enquiries and site assessment**

\- Capture service type, description, source, customer, site and optional requested date/budget.

\- Statuses: New, Contacted, Site visit scheduled, Quoted, Won, Lost, Archived.

\- Attach measurements as labelled values with units and free text; support site photos and notes.

\- Convert an enquiry into a quotation without retyping customer/site information.

\- Record lost reason optionally. Acceptance can mark the enquiry Won; manual changes remain audited.



**### FR-04 Service catalogue**

\- Save reusable descriptions, category, default unit, selling price and optional internal unit cost.

\- Support units such as job, hour, day, room, metre, square metre and item, plus custom labels.

\- Permit ad hoc lines; a catalogue is not required before creating a quote.

\- Copy catalogue values into documents. Later catalogue edits must not change existing documents.



**### FR-05 Quotation creation**

\- Required fields: customer, title/scope, issue date, validity date and at least one priced line.

\- Optional site, proposed schedule, attachments, exclusions, warranty notes and payment terms.

\- Each line contains description, category, quantity, unit and selling unit price; internal estimated cost is private.

\- Permit section headings and notes that do not affect totals.

\- Support document-level discount as amount or percentage; never both simultaneously.

\- Tax is disabled by default. If enabled, use an explicitly configured rate and label; configuration is not a claim of statutory compliance.

\- Show line totals, subtotal, discount, taxable amount, tax and total in MWK.

\- Support fixed-amount or percentage deposit and an instalment schedule. Show deposit as part of the total, not an added charge.

\- Save drafts, preview, duplicate and publish. Validate all financial fields on the server.

\- Published versions must retain a snapshot of business details, customer details, terms and all amounts.



**### FR-06 Sharing and customer approval**

\- Generate a mobile-friendly public document link and downloadable branded PDF.

\- Offer a WhatsApp share action with editable text and document link. The user completes sending in WhatsApp; sharing is not proof of delivery.

\- No customer account required. Use high-entropy revocable tokens scoped to one document version.

\- Public page shows the business, customer/job reference, scope, amount, terms, expiry and current version status; hide internal notes, costs and margins.

\- Accept action requires typed name, confirmation of authority to approve, agreement checkbox and server timestamp; record version and terms. Explain that a forwarded link can be used by its holder; stronger identity verification is a later capability.

\- Customer may decline with an optional reason or request changes with a message.

\- Expired, withdrawn or superseded versions cannot be newly accepted.

\- Opening a link may record Viewed, but do not equate a preview fetch with a verified human view.

\- Customer approval is a business acknowledgement record; do not advertise it as a certified digital signature.



**### FR-07 Revisions and change orders**

\- Published documents are immutable. Editing creates a new numbered version with an optional reason.

\- Publishing a new version supersedes earlier unaccepted versions and disables their approval actions.

\- Preserve all previous versions and decisions.

\- After acceptance, proposed changes become a variation linked to the original job and approved scope.

\- A variation lists scope additions/removals, amount change, schedule effect and separate approval.

\- Rejected/pending variations do not change approved job value or invoiceable scope.

\- An approved variation updates job value once, including negative changes where applicable.

\- Pending invoice drafts affected by a variation must be reviewed explicitly; never silently alter issued invoices.



**### FR-08 Jobs and scheduling**

\- Unique job reference, customer, site, title, scope, source quote/version, priority, dates and responsible person.

\- Statuses: Unscheduled, Scheduled, In progress, On hold, Ready for review, Completed, Closed, Cancelled.

\- Track approval and deposit conditions separately from job status.

\- Managers may start before a configured deposit is met only with an explicit override reason.

\- Assign multiple workers and one lead. Warn about overlapping assignments but allow manager override.

\- List and calendar views filter by date, worker, status, trade and customer.

\- Display tasks with assignee, due date, completion and optional checklist.

\- Maintain dated notes/photos; each note/attachment has Internal or Customer-visible visibility.

\- Workers can update only assigned jobs and tasks; use plain status labels and short mobile forms.

\- Completion can include completion notes, photos, timestamp and optional customer acknowledgement.

\- Closing requires Completed plus settled invoices and no unresolved customer credit, or an authorised financial exception with reason.

\- Reopen only by owner/manager, with reason and history preserved.

\- Cancellation records reason and leaves existing invoices/payments intact for explicit settlement, credit or refund handling.



**### FR-09 Job costs and margin**

\- Record materials, labour, transport, equipment, subcontractor and other costs, with date, supplier/payee, quantity/amount and receipt attachment.

\- Workers submit costs as Pending; authorised users approve or reject them.

\- Only approved, non-reversed costs appear in actual-cost totals.

\- Store worker day/hour costs manually; payroll calculation is excluded.

\- Display estimated cost, actual cost, approved contract value and estimated/actual margin separately.

\- Label margin against contract value as provisional while work is incomplete; it is not accounting net profit.

\- Owner/manager/finance can correct a posted cost through an audited reversal and replacement.



**### FR-10 Invoicing**

\- Create invoices from an approved quotation/job or directly for a customer with a stated scope.

\- Support deposit, progress and final invoices with explicit billed items or amounts.

\- Preserve issued invoice snapshots and unique references. Draft invoices remain editable.

\- Track total already billed against contract value; block overbilling without an approved variation or an authorised explanation for a direct job.

\- Statuses: Draft, Issued, Part paid, Paid, Void. Overdue is a computed flag based on due date and balance.

\- Customer PDF/link shows business details, items, total, due date, payment instructions, allocated payments, credit notes and remaining balance.

\- Correct issued amounts with linked credit notes and, where necessary, a replacement invoice. Do not overwrite issued history.

\- Void only invoices with no active payment allocations or credit adjustments; otherwise reverse/reconcile those entries first.

\- Final invoice preparation must show earlier progress billing and avoid charging the full contract twice.

\- Include optional configured tax fields, but do not label the app MRA-certified or compliant without a separate verified integration and review.



**### FR-11 Payments, receipts and refunds**

\- Manual payment entry: customer, amount, received date, method, reference, optional proof, recorder and verification state.

\- Methods include cash, Airtel Money, TNM Mpamba, bank transfer and other.

\- Default manual entry is Unverified; an authorised user verifies it after checking their own records. Uploaded proof alone never verifies payment.

\- Only verified payments reduce receivables; show unverified amounts separately.

\- Allow splitting one payment across invoices for the same customer and business.

\- Unallocated verified amounts are customer credit, never negative invoice balances.

\- Generate numbered receipts for verified collections; receipt shows allocations and remaining credit.

\- Prevent duplicate submission through idempotency; flag likely duplicate amount/date/reference records for review.

\- Corrections use void/reversal records with reason. Do not delete posted collections.

\- Refunds reference the original collection, record method/reason/reference and cannot exceed its refundable amount.

\- Require allocation release and an appropriate credit/adjustment when refunding money against an invoice; never leave the invoice falsely marked Paid.

\- A receipt acknowledges a recorded collection; manual recording does not move money.



**### FR-12 Notifications and reminders**

\- In-app notifications for customer decisions, new assignments, approaching job dates and overdue invoices.

\- First release provides suggested reminder text and manual share actions; it sends nothing automatically through WhatsApp/SMS.

\- Track reminder attempts only when initiated and label them Shared or Sending attempted, not Delivered without provider evidence.

\- Users control in-app preferences. Stop collection reminders on settled, void or disputed invoices.

\- Later automated messaging requires provider setup, consent/preferences, templates where required, opt-out and retry controls.



**### FR-13 Dashboard and reports**

\- Dashboard: active jobs, due-today work, quotes awaiting response, overdue invoices, collections this month and customer credit.

\- Quote report: published, accepted, declined, expired and conversion by published quotation, not by version count.

\- Receivables: invoice balance by customer, due date and age buckets 1–30, 31–60, 61–90 and 90+ days overdue.

\- Financial summaries separate issued net invoice value, verified collections, refunds, unallocated credit and approved costs.

\- Job report: contract value, billed amount, collected amount, costs and margin basis.

\- Filters include date range, status, customer and worker where permissions allow.

\- Finance users export financial reports to CSV; owner can export complete business data and documents.

\- Escape spreadsheet formula-leading text in CSV exports.



**### FR-14 Documents and attachments**

\- Branded A4 quotation, invoice, credit note and receipt PDFs with readable totals and repeatable table headings.

\- Long descriptions and multi-page documents must not overlap totals, footer or terms.

\- Private attachment storage with permission checks and short-lived download links.

\- Initial accepted uploads: JPEG, PNG and PDF; proposed maximum 10 MB each. Compress photos while retaining a usable original or explicitly disclosed compressed copy.

\- Validate file type/content, block executable uploads and scan uploads before making them available to other users.

\- Customer pages expose only attachments explicitly marked public for that document/job.



**### FR-15 Subscription and platform operations**

\- Configurable plans with user count, active-job limits and storage allowance; final names/prices follow pilot validation.

\- Track trial, active, grace-period, read-only, suspended and cancelled states separately from payment records for the business's customers.

\- First release permits platform staff to activate subscriptions after independently verifying subscription payment.

\- Display plan limits before actions fail. Enforce quotas server-side without deleting existing records when a plan is downgraded.

\- Trial expiry or unpaid subscription enters a configurable grace period, then read-only access with owner export available for 30 days. Display dates and policy clearly.

\- Suspended businesses cannot create work or accept new customer approvals; previously issued public documents remain read-only until their link expiry unless revoked for security.

\- No automatic data deletion merely because a subscription lapses. Use the published account deletion and retention process.

\- Platform support grants, subscription changes and tenant suspensions must be audited.



**## 7. State and calculation rules**



**### Quotation states**

Draft → Published → Accepted / Declined / Expired / Withdrawn / Superseded.

Viewed is an event, not a terminal state. A change request leaves the quote Published until withdrawal, revision or decision. Server time decides expiry. Acceptance and revision races must be resolved transactionally so only one valid outcome commits.



**### Financial arithmetic**

\- Store amounts using fixed decimal arithmetic, never binary floating point; MWK display precision is two decimal places.

\- Quantities permit up to three decimal places; round each quantity × unit-price line to two decimals using half-up rounding.

\- Subtotal = sum of rounded line amounts.

\- Discount = configured fixed amount or rounded percentage of subtotal; must be between zero and subtotal.

\- First release uses one tax treatment/rate across the document. Tax = rounded (subtotal − discount) × rate, if enabled; mixed/exempt line handling is later.

\- Total = subtotal − discount + tax.

\- Deposit percentage applies to final document total; fixed deposit cannot exceed total.

\- Invoice open amount = issued total − posted credit notes − active verified payment allocations. Prevent a negative result.

\- Customer credit = verified collections − active invoice allocations − refunds against unallocated amounts, accounting for reversals through the underlying ledger.

\- Approved job value = original approved value + approved variations. Separate tax from revenue/margin reports consistently.

\- Margin amount = approved contract value excluding tax − approved actual job costs. Margin percentage = margin amount / contract value excluding tax × 100; display N/A for zero value.

\- Refunds, payment reversals and credit notes are distinct events and must not each reduce the same balance twice.

\- All totals, allocations, limits and permissions are recalculated on the server within transactions.



**## 8. Data requirements**



Every tenant-owned entity must carry business_id; unique identifiers alone do not provide isolation.



\| Entity | Important attributes / relationships |

\|---|---|

\| Business | Name, branding, timezone, currency, terms, numbering, tax configuration |

\| User / Membership | Identity, business, role, invitation and access status |

\| Customer / Site | Contacts, service addresses, archive state |

\| Enquiry | Customer/site, description, source, status, assessment |

\| CatalogueItem | Category, unit, default sale price, private cost |

\| Quotation / Version / Line | Stable quote ID, immutable version snapshots, totals, validity |

\| PublicLink / Decision | Token hash, version scope, expiry/revocation, decision and name/time |

\| Job / Assignment / Task | Customer/site, accepted version, dates, state, workers, progress |

\| Variation | Job, scope delta, price delta, approval version and state |

\| Expense | Job, category, amount, evidence, approval and reversal |

\| Invoice / Line / CreditNote | Snapshot, job/customer, totals, dates, posting state |

\| Payment / Allocation / Refund | Customer, method, verification, invoice application and reversal |

\| Receipt | Verified collection reference and immutable issued snapshot |

\| Attachment / Comment | Parent record, storage reference, visibility, author |

\| Notification / ShareEvent | Recipient, event, channel attempt and deduplication key |

\| Subscription / Plan | Limits, term, renewal, access state |

\| AuditEvent | Actor, tenant, action, entity, time, reason and safe change metadata |



Keep document numbering unique within each business and document type; assign on publication/issuance using atomic sequencing. Repeated requests must not consume a second document or post a second financial event. Preserve records referenced by immutable documents even when source contacts/catalogue entries change.



**## 9. User interface requirements**



**### Business application**

Navigation: Dashboard, Enquiries, Customers, Quotations, Jobs, Schedule, Invoices, Payments, Reports and Settings. Hide inaccessible sections by role while enforcing permissions on the server.



Required screens:

1\. Sign in, verification, password reset and invitation acceptance.

2\. Business onboarding and trade selection.

3\. Dashboard with actionable empty states.

4\. Customer list/detail and site editor.

5\. Enquiry list/detail with site assessment.

6\. Quote list, editor, preview, versions and approval timeline.

7\. Job list/board, calendar and job detail with tasks, photos, costs and billing.

8\. Invoice/credit-note editor, preview and detail.

9\. Payment entry, verification, allocation, receipt and refund.

10\. Reports and exports.

11\. Team, business settings and subscription.



**### Customer experience**

Quotation review, acceptance/decline/change request, confirmation, invoice balance and receipt views. Job updates use a separate explicitly issued link and show only customer-visible information. No account signup, cross-customer navigation, internal cost display or subscription advertising.



**### Usability**

\- Support widths from 360 px upwards without horizontal scrolling for core tasks.

\- Use readable labels, large touch targets, explicit Save actions and clear validation.

\- Preserve draft inputs after recoverable failures.

\- Show MWK consistently and dates unambiguously, for example 15 Oct 2026.

\- Default English; structure interface strings for later Chichewa translation.

\- Confirmation screens for irreversible publication, voids, reversals and role changes; ordinary reversible edits need no extra confirmation.



**## 10. Non-functional requirements**



**### Security and isolation**

\- HTTPS throughout, secure password hashing through a maintained authentication service, secure sessions, expiring reset links and rate limits.

\- Enforce tenant and role checks on APIs, database access, storage, exports and background jobs.

\- No public bucket containing private customer records. Avoid tokens and sensitive attachment contents in application logs.

\- Sanitize user text, protect against injection and cross-site scripting, and protect cookie-based mutations against CSRF.

\- Public tokens are revocable, unguessable, expiry-bound and stored hashed. Set no-index and restrictive referrer headers on shared pages.

\- Revalidate access on every request after membership removal. Owner access and sensitive account changes require recent authentication.

\- Audit document issue/approval, payment verification/reversal, refunds, role changes, exports and support access.



**### Performance targets**

Proposed release test profile: 100 concurrent authenticated sessions and a tenant with 10,000 jobs and 50,000 financial/document records.

\- Under that profile, p95 ordinary API reads under 1 second and writes under 2 seconds, excluding file transfer and external providers.

\- Core mobile screens usable within 5 seconds under a defined 1 Mbps connection with 150 ms latency and a cold browser cache.

\- Public quotation page initial compressed transfer under 500 KB excluding requested attachments.

\- PDFs generated within 15 seconds for documents of up to 100 lines; longer tasks show queued/progress state.

\- Paginate lists and load/compress photos on demand.



**### Connectivity and offline behaviour**

\- Cache the application shell and allow explicit draft quotation/job-note editing offline on previously loaded records.

\- Show Offline, Saved on device, Syncing, Synced and Conflict states accurately.

\- Public approval, issuing invoices, financial posting, payment verification and role changes require server confirmation.

\- Queue permitted drafts with client-generated operation IDs; retries must not duplicate records.

\- When the server record changed, preserve both versions and request user reconciliation; never overwrite approved or financial records silently.

\- Do not promise durable server storage for an unsynced draft. Clear locally cached customer data on logout; provide a shared-device warning/setting.



**### Reliability, backup and operations**

\- Proposed availability target: 99.5% per month, measured at the application boundary; publish maintenance separately.

\- Daily encrypted backup with proposed recovery point objective of 24 hours and recovery time objective of 8 hours.

\- Conduct and record a successful restore drill before pilot launch and quarterly thereafter.

\- Separate development, staging and production; production data is not used casually in development.

\- Monitor errors, failed background tasks, document generation, storage limits and unusual access failures.

\- Provide retry-safe jobs and an operator-visible failed-task queue.



**### Accessibility and privacy**

\- Target WCAG 2.2 AA for core workflows, including keyboard navigation, labels, visible focus, contrast and non-colour status indicators.

\- Collect only needed contact/site information; provide export, correction and account deletion request flows.

\- Proposed operational retention: active account records remain until authorised deletion; after cancellation retain for 90 days with notice, then purge eligible data; backups age out within 35 days after purge.

\- Financial/statutory retention and privacy obligations require local review before launch and may override those proposed defaults. Configure the approved policy and show it before signup; this document does not specify legal compliance as established fact.



**## 11. Integration boundaries**



**### First release**

\- User-initiated WhatsApp sharing through a share/deep link; no reading of private conversations.

\- Authentication and transactional account email.

\- Private object storage and PDF generation.

\- Optional user-supplied map links, without paid geocoding dependency.

\- Manual subscription and customer-payment verification.



**### Later**

\- Payment service provider: signed webhook verification, provider transaction IDs, amount/currency checks, deduplication, reconciliation, reversal handling and failure recovery before automatic Paid states.

\- Automated WhatsApp/SMS: approved provider, recipient preferences, templates, delivery states, budgets and opt-out handling.

\- Accounting export/integration and any fiscal/e-invoicing integration as separately scoped work.

\- No API availability, provider approval, integration cost or regulatory certification is assumed.



**## 12. First-release acceptance criteria**



\| ID | Scenario | Required outcome |

\|---|---|---|

\| AC-01 | User from business A requests a business B record, attachment or export | Access denied; no data or existence-sensitive detail disclosed |

\| AC-02 | Worker opens an assigned job | Can update allowed progress; cannot retrieve prices/margins through UI or API |

\| AC-03 | Quote contains 2 × K10,000 and 1 × K5,000, 10% discount, tax disabled | Subtotal K25,000; discount K2,500; total K22,500 |

\| AC-04 | Same quotation is published twice through retries | One published version/reference and one share event per requested operation |

\| AC-05 | Customer accepts version 1 while version 2 is published concurrently | Exactly one transaction wins; stale acceptance cannot approve unintended scope |

\| AC-06 | Customer accepts an expired/revoked link | No acceptance recorded; clear inactive/expired page |

\| AC-07 | Approved quote is converted repeatedly | Exactly one linked job; scope and amounts reference approved snapshot |

\| AC-08 | Worker submits K20,000 expense | Pending cost excluded from actual total until authorised approval |

\| AC-09 | Customer pays K30,000 against a K100,000 invoice | After verification: receipt K30,000; balance K70,000; before verification balance remains K100,000 |

\| AC-10 | Customer pays K120,000 against a K100,000 invoice | Invoice settled at K100,000; K20,000 customer credit; collection counted once |

\| AC-11 | K100,000 job already has K30,000 progress billing | Final billing proposes only K70,000 remaining, subject to approved variations |

\| AC-12 | User changes catalogue prices or customer address | Existing issued documents keep original snapshots |

\| AC-13 | Offline draft is retried after reconnect | Draft syncs once; conflicts preserve input and request resolution |

\| AC-14 | Subscription expires | Configured grace/read-only policy applies; no silent record loss; owner export available during stated window |

\| AC-15 | Quote has 100 long lines | PDF remains readable with correct totals and page breaks |

\| AC-16 | Revoked worker has an existing session | Further protected requests fail immediately after access revalidation |

\| AC-17 | K100,000 invoice has K100,000 allocated payment; customer receives full refund after cancellation | Linked credit and allocation/refund records reconcile; cash net zero; invoice net due zero; history remains |

\| AC-18 | Backup restoration is performed | Tenant records and private attachment references recover within declared objectives |



**## 13. Delivery sequence and release gate**



**### Increment 1: Foundation**

Tenant isolation, authentication, business setup, role permissions, customers/sites, audit events and private attachments.



**### Increment 2: Quotations**

Catalogue, editor/calculations, immutable versions, PDF, sharing, customer decision and conversion.



**### Increment 3: Job delivery**

Assignments, calendar, tasks, notes/photos, approved costs and variations.



**### Increment 4: Money**

Invoices, credit notes, verified payments, allocations, refunds, receipts and receivables reports.



**### Increment 5: Pilot readiness**

Subscription controls, exports, offline drafts, monitoring, restore drill, accessibility and cross-tenant tests.



Release gate: all P0 acceptance criteria pass; permission tests cover APIs/storage/exports; payment arithmetic and concurrent operations are tested; long-document PDF checks pass; recoverable offline errors preserve work; support and backup recovery procedures exist; pilot users complete core tasks on phones.



**## 14. Later product opportunities**



\- Recurring cleaning/maintenance contracts and automatic job creation.

\- Construction milestones, retention amounts and richer progress certificates.

\- Staff timesheets, payroll export and subcontractor approvals.

\- Supplier purchase orders, inventory and stock usage.

\- Team location/route planning, only with explicit worker controls.

\- Customer portal accounts with stronger identity verification.

\- Chichewa interface and reusable trade-specific document templates.

\- Automated payment reconciliation and subscription renewal.

\- Optional AI assistance for rewriting scope/quotation descriptions, always reviewed before sending; never autonomous price commitments.



**## 15. Assumptions and decisions to validate**



This baseline deliberately supports multiple service trades through a common workflow. Trade templates customise wording, units and checklists; they do not create separate applications.



Before launch, confirm:

\- Product name, branding and support contact.

\- Pilot trades and whether the first pilot needs recurring work or milestone billing beyond manual instalments.

\- Subscription prices, limits, trial length, grace period and support allowance.

\- Deposit policies and how often businesses accept verbal approvals; the system must distinguish recorded verbal agreement from online customer acceptance.

\- Whether public links without identity verification meet pilot customers' expectations.

\- Local legal review of tax fields, financial retention, privacy notices and approval wording.

\- Hosting budget, backup objectives, messaging costs and actual phone/connectivity constraints.



Proposed implementation direction, not a mandatory stack: responsive progressive web application, relational transactional database, managed authentication, private object storage and a background worker for documents/notifications. Select the stack after checking delivery skills, operating cost and security requirements; the behaviour and acceptance criteria above remain authoritative.
