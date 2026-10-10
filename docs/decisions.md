# LifeLink Product and Operations Decisions

Short Phase 0 decision record. Items marked **Proposed** are safe working defaults, not a substitute for the owner's confirmation or appropriate legal review.

## Product scope

| Decision | Current decision |
|---|---|
| Product geography | **India-wide product goal.** Build for state/city expansion, but launch in supervised regions in stages. A nationwide launch is not the same as operating every region safely on day one. |
| First pilot area | **Decided:** Kolkata metropolitan area, starting with neighborhoods the moderator team can actively cover. Expand only when moderation and hospital/blood-bank escalation coverage is staffed there. India-wide remains the product goal, with staged regional launches. |
| Languages | **Decided for pilot:** English and Bengali. Add Hindi and each region's primary languages before opening those regions; do not imply national support until support and moderation flows are ready. |
| Account age and consent | **Proposed:** donors confirm they are 18+ without storing date of birth. Store `adult_confirmed_at`, `consent_version`, and `consent_at`; require current consent to complete onboarding and re-prompt when the version changes. A requester may coordinate for a patient of any age; do not make the patient's age a required field. No phone OTP for the pilot. |
| Operations | **Proposed:** owner plus one or two trusted moderators on a rota. For urgent cases, tell users to contact the hospital or blood bank directly while LifeLink coordinates. Confirm named moderators and contact procedure before pilot. |
| Medical role | LifeLink connects people; it does not determine clinical eligibility or compatibility. Hospital or licensed blood-bank staff make those decisions. |
| Payment | No payment for blood. Donations and coordination must take place through hospitals or licensed blood banks, not private addresses. |

## Data and retention

| Data area | Decision |
|---|---|
| Request fields | Collect blood group, units, urgency, hospital, area/location needed for matching, required-by time, and supporting requisition document. Keep patient and contact identifiers out of public pages; make optional any field not needed for verification or coordination. |
| Donor fields | Blood group, coarse location, availability, and only the eligibility/coordination fields required by the workflow. Never expose donor search or profiles to seekers. |
| Donor availability | **Proposed:** availability expires after 72 hours unless reconfirmed; confirm or tune this during the supervised pilot. Matching must check expiry directly, even if a cleanup job is delayed. |
| Public request | Only blood group, units, urgency, hospital or area, live status, and expiry. Never patient name/reference, phone number, exact address, seeker identity, or donor identity. |
| Contact reveal | Keep in-app or masked. Reveal only minimum coordination details to an accepted donor; expire and remove the reveal when the request closes. |
| Supporting document retention | **Decided:** keep the private image only while needed for verification. Delete it within 30 days after a final moderator decision; if no decision occurs, delete it within 30 days after cancellation or expiry. Keep only necessary extracted fields, a document hash and the verdict, subject to audit retention below. |
| Closed/rejected request retention | **Decided:** retain the request and linked coordination data for up to 90 days after closure, then delete or irreversibly anonymize it. Keep non-identifying aggregate counts only. |
| Account deletion exceptions | **Decided:** remove account/profile/contact data and private documents from active systems within 30 days of a verified deletion request, after closing active requests. Retain minimal moderation/security audit entries for up to 12 months after the event and abuse-report reason/status/target reference for up to 12 months after resolution; null the reporter identity on account deletion. Retain longer only for a documented legal hold, then delete promptly when it ends. Backup expiry follows the configured provider backup cycle and must be disclosed once verified; do not promise immediate removal from backups. |
| Operational log retention | **Decided:** application/security logs 30 days, with personal fields redacted; incident-specific records may be retained up to 12 months when needed for investigation. |
| Export and deletion | Export only the user's authorized profile, requests, pledges and notifications after recent authentication. Before deleting an account, close active requests, remove private documents and personal/dependent data, then delete the Auth user. Review foreign keys and anonymize only the minimal records explicitly approved for retention. |
| Abuse controls | Start with configurable per-user request limits and duplicate detection. Review Supabase Auth limits; add per-IP controls or CAPTCHA only if abuse requires them. Provide a minimal report flow and a documented moderator response procedure. |
| Hospital directory | Skip a live directory for the initial pilot. Use free-text hospital details with moderator checking; maintain a small manually verified local list if useful. Expand only with an owner for updates. |

## Environments and operations

| Decision | Current decision |
|---|---|
| Environments | Local development, separate staging Supabase project plus Vercel preview, and production. Use separate credentials and environment variables. |
| Migration workflow | Apply reviewed migrations in order through Supabase CLI. Do not use dashboard edits as the normal migration workflow. Back up before production migrations; use forward-fix migrations for database rollback. |
| Backups | Check the current Supabase plan and restore capabilities, then perform a test restore into staging before pilot. |
| Monitoring | Proposed: Sentry for application errors and an external uptime check on `/api/health`. Confirm project/account setup before launch. |
| Deployment rollback | Use Vercel deployment rollback for the application. For database changes, prefer a forward-fix migration because application code may already depend on the new schema; restore from the pre-migration backup only when a forward fix is unsafe and the restore's data-loss window is understood. Exercise both procedures in staging before production use. |

## Phase 0 technical check — current evidence

- The user ran the read-only SQL object audit in Supabase SQL Editor; all 17 displayed checks returned **OK**. This verifies the checked core objects from migrations `001`–`005`, including key tables, columns, triggers, private document bucket, donor matching function, and tracker Realtime publication.
- Repository review found that the old profile SELECT policy in `supabase/auth_profile_setup.sql` allowed every authenticated user to read all profile rows. This included donor contact and approximate location fields. The public landing page also displayed hard-coded sample patient names and misleading “live/verified” claims. Migration `202610100006_private_profile_reads.sql` has now been applied to the database configured in `.env.local`; verification found the owner-only SELECT policy and restrictive owner guard, with the old broad policy absent. The landing section now uses de-identified sample content and no fake pledge/share actions.
- A read-only database audit script is available at `supabase/audits/phase0_security_audit.sql`.
- Architecture/data-flow, access matrix, request-state and privacy/terms drafts are now in `docs/architecture.md`, `docs/access-matrix.md`, `docs/request-state-machine.md`, and `docs/privacy-and-terms-draft.md`.
- The migration history table queried earlier was absent. The SQL audit does not prove complete migration application or detect all schema drift.
- Supabase CLI and `supabase/config.toml` are not present in the repository at the time of this record. Therefore `supabase migration list` and `supabase db diff` have not been run.
- The database connection in `.env.local` was used to apply migration `006`; its environment (staging or production) is not identified. The CLI migration history is still unavailable, and no donor/requester/moderator/unrelated-user RLS access test or restore test has been recorded.

## Phase 0 exit checklist

- [x] Choose the first supervised pilot area and initial language set: Kolkata metropolitan area; English and Bengali.
- [x] Decide retention defaults: documents 30 days after decision/closure, closed request data 90 days, minimal audit/report records 12 months, operational logs 30 days.
- [ ] Identify whether the configured Supabase project is staging or production. Create/link a separate staging project and configure Supabase CLI; establish migration history and compare schema drift there. Ensure migration `006` is present in each required environment.
- [ ] Check PostGIS, RLS on every public table, required policies, Storage owner scoping, and Realtime publication in staging.
- [ ] Test access as requester, donor, moderator, and unrelated signed-in user against an agreed access matrix.
- [ ] Perform a staging restore test and verify monitoring and application rollback.
- [x] Draft the architecture/data-flow diagram, access matrix, request-state transition table, privacy notice, terms and consent text. These are working drafts; obtain appropriate legal review and finalize retention/contact details before public launch.
- [x] Prepare the Phase 0 read-only database audit script and local profile-privacy migration.
- [ ] Add/link a staging project, apply migration `006`, run CLI history/drift checks, and test role/RLS behavior against real accounts.
- [x] Record the pilot area/languages and retention defaults. Verify code enforcement and obtain legal review before public launch.
- [ ] Complete the staging restore, monitoring, and deployment rollback exercise.
- [ ] Record the production migration backup/forward-fix procedure and confirm a monitored staging deployment.

