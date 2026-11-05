# Work management

Task, projects and leads are part of the existing private Supabase workspace JSON. Older workspaces open with empty lists; no migration is required. Existing quotations, invoices and jobs stay available. The overview and Reports show task totals; Tasks > Today includes overdue work. Dates use the device calendar. Dates shown in the app are not push or email notifica

## Next implementation phases

The following requested features are not connected yet:

- Teams: introduce organizations, memberships and invitations with owner/admin/member roles. Store shared tasks in normalized tables with organization-scoped row-level security. The current owner-only JSON workspace must not be exposed to other users. Add assignees, membership revocation, concurrent-edit handling and activity history before enabling sharing.
- Chat: organization/project channels, membership-scoped messages, pagination and realtime subscriptions. Task comments should come before general chat so discussions stay attached to work.
- Email reminders: server-side scheduled worker, verified sender/provider credentials, timezone and reminder preferences, opt-out, retry/deduplication and delivery logs. Use a daily digest plus upcoming/overdue reminders. No client-side secret or background timer for delivery.
- AI planning: authenticated server endpoint with a server-only provider key, usage limits and request validation. Turn a project brief into editable draft tasks with suggested deadlines; require review before saving. Do not label fixed templates as AI.

Suggested follow-ons: recurring tasks, subtasks/checklists with completion state, calendar/week view, attachments, task comments, saved task templates, lead-to-customer conversion and links from leads to quotations. Reports can later add completion trends, workload per teammate and project deadline risk once historical activity is stored.

## Verification

Run npm run lint, npm run typecheck and npm test. A signed-in smoke test should create a project, add a linked task, edit its deadline, complete/reopen it, create a lead and proposal task, then sign out/in to verify cloud persistence. Also confirm existing documents remain available. Live account flows require a configured Supabase workspace.
