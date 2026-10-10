# LifeLink Implementation Plan

This plan is based on the repository as it exists now. Existing features are recorded so a phase implementation can extend them instead of rebuilding them. Product decisions and Phase 0 evidence are tracked in [decisions.md](decisions.md). When asked to **implement phase N**, implement the unchecked work for that phase, preserve the privacy rules below, and report any external setup that the code alone cannot complete.

## Current project snapshot

LifeLink is a Next.js App Router app using Supabase Auth/PostgreSQL, PostGIS, Drizzle ORM, and TypeScript. The repository contains a base SQL schema and five Supabase migrations. App code includes profile setup, authenticated request creation, private document storage, verification checks, moderator review, geospatial matching, donor pledges, realtime requester tracking, and a requester map that shows aggregate nearby availability rather than donor pins.

The repository does **not** prove whether those migrations have been applied to the hosted Supabase project, whether production credentials are configured, or whether a deployment exists. Treat those as deployment checks, not completed code work.

### Status at a glance

| Phase | Scope | Repo status |
|---|---|---|
| 0 | Foundation and product decisions | Partial: app, schema, Drizzle, and local health route exist; pilot decisions, policy/consent, retention, deployment and monitoring remain |
| 1 | Accounts, profiles, trust and abuse controls | Partial: Supabase login and profile setup exist; deletion/export, age gate, tiers, rate limits/CAPTCHA and report/ban flow remain |
| 2 | Request creation and verification | Substantially implemented: authenticated request submission, private documents, validation, AI checks, moderator review and clarification flow exist; async/manual fallback and document retention cleanup need work |
| 3 | Matching and alerts | Partial: PostGIS compatibility/radius shortlist and donor in-app notifications exist; push, scheduled radius escalation, fatigue controls and blood-bank fallback remain |
| 4 | Accept, reveal and confirmed donations | Partial: donors can pledge/confirm coordination/withdraw and seekers can track aggregate progress; accept-then-reveal, chat, check-ins and confirmed donation records are missing |
| 4.5 | Pilot and hardening | Not started / must be verified operationally |
| 5 | Shareable approved request pages | Not implemented |
| 6 | Expiry and closure behavior | Partial: requester/moderator can fulfill or cancel; automatic expiry, closed public link behavior and reveal cleanup remain |
| 7 | Telegram intake | Not implemented |
| 8 | Reliability and fraud tooling | Partial: request risk screening and moderation signals exist; donor reliability and usage-based alert tuning do not |
| 9 | Partner tools and broadcasts | Not implemented |
| 10 | Scale and extensions | Not implemented |

## Rules that apply to every phase

- **Public privacy:** never show a patient's name, patient reference, phone number, exact address, requester identity, or donor identity on a public page or social preview. Public request pages may show only blood group, units, urgency, hospital or area, status, and expiry.
- **No donor directory:** seekers never browse or search donor profiles. Matching and availability are handled by server-side LifeLink logic. Seeker-facing maps may show coarse aggregate availability, never donor pins, home coordinates, or individual distances.
- **Temporary contact:** keep contact masked or in-app. Reveal only the minimum fields to an accepted donor, with authorization and an expiry. Remove active reveals when a request closes.
- **Data minimization:** collect only fields needed for verification and coordination. Provide account data export/deletion controls and define any narrowly required safety/audit retention.
- **Deterministic safety rules:** code decides compatibility, eligibility filters, radius, access, status transitions and reveal rules. AI may extract fields or flag risk; it cannot approve a request or decide medical eligibility.
- **Human fallback:** model failure or delay routes to human review and never activates a request.
- **Clinical boundary:** LifeLink coordinates. Hospital or licensed blood-bank staff confirm compatibility and medical eligibility. No payment for blood and no donation at private addresses.
- **External group boundaries:** no scraping/auto-reading existing Facebook or WhatsApp groups, unofficial WhatsApp clients, or automatic posting into existing groups. Share links and opt-in bot forwards are the supported pattern.
- **Database safety:** retain Supabase RLS. Drizzle direct database access is trusted server-only code and must perform explicit authorization checks. Migrations must be reviewed and applied in order in each environment.

## Phase 0 — Foundation and decisions

**Goal:** settle the choices that affect safety, storage and launch. LifeLink's product goal is India-wide; launch and operations should expand region by region, starting with a supervised pilot where the team can support requests directly.

### Existing

- [x] Next.js app, TypeScript, Supabase Auth/PostgreSQL, PostGIS schema, Drizzle schema/config, and health endpoint are present.
- [x] Request states, verification gates, donor matching and tracker events have initial database representations.
- [x] Added repo-specific architecture/data-flow, access matrix, request-state, and privacy/terms/consent drafts; see the linked documents in `docs/`.
- [x] Changed `/api/health` to check the server-side PostgreSQL connection, rather than using a public client query that could appear healthy under RLS while returning no rows.
- [x] Tightened direct profile reads to the profile owner in setup SQL and migration `202610100006_private_profile_reads.sql` after finding an authenticated-wide profile read policy. Applied migration `006` to the database configured in `.env.local` and verified both owner policies; the target environment is not identified. Removed names and false live/verification claims from the public landing sample feed.
- [x] The earlier SQL Editor audit reported all 17 selected core-object checks as present; a broader audit script is available at `supabase/audits/phase0_security_audit.sql`.

### Remaining

- [ ] Confirm the India-wide product scope and choose the first supervised city/campus pilot, initial languages, age policy and operational coverage. Do not equate national product scope with an unsupervised all-India launch.
- [ ] Review/confirm the drafted architecture, access matrix, state transitions, privacy notice, terms and consent. Select retention periods and deletion exceptions; obtain appropriate legal review before launch.
- [ ] Decide which patient/contact fields are truly required and when they are deleted. Do not copy the pasted plan’s blanket “delete all documents immediately” without ensuring the human review workflow has completed.
- [ ] Identify the currently configured Supabase project as staging or production. Create/link a separate staging Supabase project, install/configure Supabase CLI and `supabase/config.toml`, establish migration history, apply/reconcile migrations `001`–`006` there, and compare schema drift. Migration `006` is applied only to the configured target; other environment status is unknown.
- [ ] Run the broader SQL audit, then test the direct RLS and API route boundaries as requester, donor, moderator and unrelated signed-in user. Verify no user can list other profiles.
- [ ] Confirm local/staging/production environment variables, backups, monitoring, error reporting, deployment and rollback procedures. A staging restore and deployment rollback are external operational checks.
- [ ] Decide whether blood-bank directory data is needed for the pilot and how it will be maintained.

**Done when:** product/privacy decisions are written down in [decisions.md](decisions.md), staging is separate and checked against migrations, role-based access is tested, and a monitored staging deploy and rollback/restore procedure have been exercised.

## Phase 1 — Accounts, profiles and abuse controls

**Goal:** authenticated donors and requesters have the minimum profile and account controls needed for safe pilot use.

### Existing

- [x] Supabase login/callback and profile setup UI/API exist.
- [x] Profiles include role, blood group, locality, approximate location, availability and last donation date.
- [x] Profile coordinates are rounded before storage; moderator access is additionally allowlisted in server routes.

### Remaining

- [ ] Centralize server authorization in shared helpers such as `requireUser()` and `requireRole()`. Move moderator profile-role and `MODERATOR_USER_IDS` checks out of individual route handlers into the shared authorization path. Ensure suspended accounts are rejected there.
- [ ] Write a route access table (route, allowed roles, unauthenticated behavior, denied-role behavior) and exercise it with requester, donor, moderator, and unrelated signed-in accounts. Drizzle server access bypasses RLS, so every Drizzle route must authorize before querying or mutating data.
- [ ] Use one post-login destination rule: incomplete profile → setup; donor → Emergency Pulse; requester → requests; moderator → moderator queue. Apply it consistently to OAuth callback and normal login.
- [ ] Add an adult-confirmation timestamp and consent version/timestamp to the profile. Require explicit 18+ confirmation and current consent before profile completion; do not collect date of birth or add phone OTP without a justified need. Re-prompt when the consent version changes.
- [ ] Add donor availability expiry (proposed pilot window: 72 hours, to be confirmed). Set expiry when availability is enabled, require expiry to be in the future inside the matching query, and provide a one-tap reconfirm action. A scheduled cleanup may clear stale availability for display, but matching must be safe even if that job is delayed.
- [ ] Add configurable request rate limits using database-backed per-user counts and duplicate detection (blood group, hospital, time). Review Supabase Auth limits. Add per-IP/upload protection or CAPTCHA only where abuse risk justifies the extra service/friction.
- [ ] Add account export as a recent-authenticated JSON download containing only the user's permitted profile, requests, pledges and notifications.
- [ ] Add account deletion before pilot data accumulates: cancel/close active requests, delete private documents and personal data, remove dependent pledges/notifications, and delete the Supabase Auth user through server-only admin credentials. Preserve only explicitly approved minimal audit records.
- [ ] Review and migrate foreign keys/retention behavior before implementing deletion. Current schema references profiles from requests and audit/response records without a complete anonymize-on-delete policy; deletion must not fail or erase required audit history. Test that no unintended personal data remains after deleting a test account.
- [ ] Add a minimal reports table and “Report a problem” actions for requests/pledges. Add active/suspended account state and make shared authorization reject suspended accounts. Document who reviews reports, how often, and the suspension/escalation steps.
- [ ] Defer interpersonal blocking until before in-app chat or contact reveal ships; there is no chat/reveal flow in the current app yet.

**Suggested implementation order:** (1) shared route authorization and route table, (2) age/current-consent gate, (3) availability expiry, (4) rate and duplicate controls, (5) export/deletion and retention migration, (6) reports and suspension. Defer blocking until before Phase 4 chat/reveal.

**Done when:** each role is limited to its routes and tested, incomplete profiles cannot bypass age/consent, stale donors are excluded by the matching query, a test account can be exported and deleted under the approved retention policy, and reports have a named operational owner.

## Phase 2 — Requests and verification

**Goal:** an authenticated requester submits a minimal request that stays private until approved.

### Existing

- [x] Request API validates the authenticated requester and required fields, and saves new requests as `pending_verification`.
- [x] Supporting documents use a private Supabase Storage bucket with upload validation and owner-scoped access.
- [x] Document extraction/comparison and risk-screening endpoints record verification outcomes; model signals do not activate requests.
- [x] Moderator review supports approval/rejection, reasons, requests for more information, audit events and protected document access.
- [x] Requester tracker supports clarification replies.

### Remaining

- [ ] Confirm required fields are minimal and consistent across form, API, Drizzle schema and SQL schema.
- [ ] Add asynchronous processing if verification latency requires it; keep a clear retry/manual review path. Current README describes direct verification requests rather than a queue worker.
- [ ] Define document retention and deletion after extraction/review, including failed/flagged cases and audit needs.
- [ ] Add rate limiting and duplicate request controls if absent; ensure logs and model inputs redact unnecessary personal data.
- [ ] Review the form’s consent and error states for unavailable AI, invalid documents and urgent medical emergencies.

**Done when:** all request submissions remain private and non-matchable until the required checks and human approval have succeeded.

## Phase 3 — Matching and alerts

**Goal:** notify eligible, nearby donors without exposing their identities or exact locations to seekers.

### Existing

- [x] PostGIS matching function and server-side rules shortlist donors using active request status, blood-group compatibility, availability, approximate geography and a screening interval.
- [x] Moderator approval activates requests and creates donor notifications.
- [x] Donors have an Emergency Pulse page; requesters can see aggregate nearby availability/map information.
- [x] Seeker-facing matching does not return a donor directory or individual donor locations.

### Remaining

- [ ] Verify current radius rules and operational behavior against the pilot area; document that compatibility is a shortlist, not medical clearance.
- [ ] Add staged radius escalation and a scheduler only if donor density and response data show it is needed.
- [ ] Decide and implement push/web-push delivery; current in-app notification records are not a complete push pipeline.
- [ ] Add alert caps, quiet hours, retries and delivery observability before broad fan-out.
- [ ] Decide whether a verified blood-bank directory is available as fallback; do not fabricate live inventory.

**Done when:** matching is server-authorized and privacy-preserving, and donor notifications can be monitored and safely retried.

## Phase 4 — Accept, coordinate and confirm donations

**Goal:** take the current pledge flow through a safe, confirmed outcome.

### Existing

- [x] Donors can pledge, confirm coordination has started, or withdraw.
- [x] Requesters have a realtime tracker with aggregate pledge/confirmation counts and can fulfill or cancel their request.
- [x] The tracker does not expose donor identity; pledge counts are not presented as proof of donation.

### Remaining

- [ ] Define a donor acceptance state separately from a pledge, including capacity/standby behavior for multi-unit requests.
- [ ] Implement accept-then-reveal: only accepted donors see the necessary hospital and masked/in-app contact; requester sees only the approved minimum donor identity.
- [ ] Implement in-app messaging or another masked contact method before revealing direct contact details.
- [ ] Add donor progress/check-in states (on the way, reached, donation reported) and safe backup handling.
- [ ] Add confirmed donation records with confirmation by requester or hospital/blood bank and confirmed unit count. Only confirmed units may drive partial/full fulfillment.
- [ ] Expire and delete contact reveals on every closure path; add audit events without putting private details in logs.
- [ ] Apply donor cooldown only after confirmed donation; communicate that clinical staff make final eligibility decisions.

**Done when:** a request can proceed from alert to accepted donor, private coordination and confirmed donation without public contact exposure.

## Phase 4.5 — Supervised pilot and hardening

**Goal:** validate the complete core flow with a small, supervised group before adding public reach.

- [ ] Select one city/campus and recruit a small donor group with a partner.
- [ ] Apply and verify migrations `001`–`005` in the target Supabase environment; confirm RLS, Storage policies, Realtime and PostGIS behavior there.
- [ ] Run simulated end-to-end workflows: pending, flagged, approved, matched, pledge, closure, cancellation and fulfillment.
- [ ] Review authorization, privacy leakage, document access, rate limits, backups, monitoring and recovery procedures.
- [ ] Prepare moderator coverage and a direct hospital/blood-bank escalation instruction for urgent needs.
- [ ] Collect pilot feedback and fix critical issues before Phase 5.

**Done when:** pilot operators can complete and support the core flow, no known privacy/access-control issues remain, and migration/deployment state is recorded.

## Phase 5 — Shareable approved request pages

**Goal:** let people share a safe LifeLink link as the source of truth.

- [ ] Add an unguessable public slug for approved, active requests; keep authorization and rate limits explicit.
- [ ] Public page shows only blood group, units, urgency, hospital or area, live status and expiry. Never show patient name/reference, seeker/donor identity, phone number or exact address.
- [ ] Add server-generated Open Graph preview image and metadata containing only the same approved public fields.
- [ ] Add a WhatsApp click-to-chat share button with a prefilled message; the user chooses the recipient/group and sends it.
- [ ] Add a nearby visitor help action that leads through login/profile setup and the normal donor matching/acceptance process; do not expose donors for browsing.
- [ ] Keep public request pages out of search indexing and prevent enumeration of request IDs/slugs.
- [ ] Show partial progress only from confirmed donation units, never from pledges alone.

**Done when:** the shared page and preview disclose only approved fields and immediately reflect the request’s current state.

## Phase 6 — Expiry and closure

**Goal:** prevent stale links, alerts and contact access from continuing after a request is no longer live.

### Existing

- [x] Requesters/moderators can fulfill or cancel; donor matching queries require active status.

### Remaining

- [ ] Add a scheduled expiry process based on required-by/deadline with idempotent, audited transitions.
- [ ] Define whether a request may be extended and require requester/moderator action for extension.
- [ ] For fulfilled, expired, cancelled or rejected requests, stop matching/notifications, remove active reveals and show a closed state at any public URL.
- [ ] Ensure Open Graph metadata/cache behavior cannot keep stale urgency or active status circulating longer than intended.
- [ ] Add closure reminders to the seeker and require an explicit extension before the request deadline is changed.

**Done when:** every closing path makes the request non-matchable, removes temporary access and presents a clear closed state.

## Phase 7 — Telegram forwarded-request intake

**Goal:** let people bring a request they choose to forward into a private LifeLink draft flow.

- [ ] Create an official Telegram bot used in private chat; do not make it a group-scraping bot.
- [ ] Add an authenticated HTTPS webhook with secret validation, rate limits and safe retry/idempotency behavior.
- [ ] Extract blood group, units, urgency, hospital/area and required time into a draft; avoid sending unnecessary patient/contact details to an external model.
- [ ] Show the extracted draft to the sender for correction and confirmation before saving.
- [ ] Route confirmed intake into the existing request/document/moderator verification flow; mark its source as forwarded and never publish/activate it directly.
- [ ] Handle missing documents, sensitive data, duplicate forwards and unsupported languages with clear manual next steps.
- [ ] Review provider data retention and bot privacy/retention settings before launch.

**Done when:** all bot submissions are confirmed drafts, duplicates are controlled, and no bot-created request can bypass normal verification and moderator approval.

## Phase 8 — Reliability and fraud signals

**Goal:** use real pilot data to improve trust and response speed without automated medical decisions.

- [ ] Establish baseline metrics from the pilot before scoring or ranking.
- [ ] Add transparent donor reliability signals from responses and confirmed show-up outcomes; do not use them to hide a donor from a critical request.
- [ ] Add moderator-only fraud signals and duplicate patterns; human moderators make the final decision.
- [ ] Tune alert wording/timing using measured response and opt-out rates.
- [ ] Measure false positives and provide correction/appeal paths for consequential flags.

**Done when:** each signal has a measured purpose, an accountable human owner and a way to monitor harm/false positives.

## Phase 9 — Partner tools and controlled broadcasts

**Goal:** help organizations distribute verified requests through official, opt-in channels.

- [ ] Add a partner intake/status view with scoped organization accounts and audit trail.
- [ ] Verify hospital/blood-bank partners before granting trusted workflow shortcuts; preserve human review where required.
- [ ] Consider Telegram channel, WhatsApp Channel or Facebook Page publishing only after checking current official API capabilities, permissions, costs and account eligibility.
- [ ] Publish only approved, current, privacy-safe request links; support revocation/closure updates where the channel allows it.
- [ ] Consider blood drives/event pages after emergency request operations are stable.

**Done when:** a partner can submit and track requests safely, and any broadcast has a verified owner and current official API setup.

## Phase 10 — Scale and extensions

Prioritize from pilot evidence and support capacity. India-wide expansion is the product goal; rollout remains staged by city/state, language coverage, moderation capacity, clinical partners and support readiness:

- [ ] Optional phone verification or verified badges.
- [ ] Masked calling, SMS/IVR or other low-bandwidth fallback.
- [ ] Verified blood-bank inventory integrations.
- [ ] Additional components (platelets/plasma), recurring needs and rare-group workflows with clinical partner input.
- [ ] Additional cities, languages and partner organizations.
- [ ] WhatsApp Business API bot only if official eligibility, supported interaction model, costs and limits fit the use case. It must not read existing community groups.

**Done when:** each extension has an operational owner, safety review, cost model and evidence from current users.

## Do not build

- Scraping or automatically reading existing Facebook or WhatsApp groups.
- Unofficial WhatsApp clients/libraries or automatic posting into existing groups.
- Public patient names, direct contact details, exact addresses, donor identities or donor search/browse tools.
- AI decisions for blood compatibility, donor medical eligibility, final request approval or contact reveal.
- Payment for blood or donation coordination at private addresses.

## Success measures

Track only what is useful to operate the service, and avoid identifying people in analytics:

- Time from approval to first donor response and to confirmed donation.
- Requests fulfilled and reasons requests close unfulfilled.
- Moderator review time and unresolved queue size.
- Donor alert response, withdrawal, no-show and opt-out rates.
- Public share link visits to successful donor signup/response, without exposing personal data.
- Privacy/security incidents, deletion completion and document retention compliance.

