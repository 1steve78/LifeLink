# LifeLink Product and Operations Decisions

Short Phase 0 decision record. Items marked **Proposed** are safe working defaults, not a substitute for the owner's confirmation or appropriate legal review.

## Product scope

| Decision | Current decision |
|---|---|
| Product geography | **India-wide product goal.** Build for state/city expansion, but launch in supervised regions in stages. A nationwide launch is not the same as operating every region safely on day one. |
| First pilot area | **Open:** choose one campus/city and surrounding area where the team can supervise early requests. |
| Languages | **Proposed:** English and Hindi as initial cross-region languages; add Bengali and each rollout region's primary languages before opening that region. Confirm based on the pilot community. |
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
| Supporting document retention | **Open:** choose a fixed deletion interval after moderator decision (candidate range: 7–30 days) and record the selected value in the privacy notice. Keep only necessary extracted fields, document hash, and decision after deletion. |
| Closed/rejected request retention | **Open:** define a fixed period, then anonymize or delete personal data. Keep only minimal audit data justified for safety/accountability. |
| Account deletion exceptions | **Open:** enumerate the minimum audit/safety records retained, purpose, and retention period. Provide user export/deletion controls consistent with the approved retention policy. |
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

- [ ] Choose the first supervised pilot area and initial language set.
- [ ] Confirm the proposed defaults or replace them; decide document, closed-request, and audit retention periods.
- [ ] Identify whether the configured Supabase project is staging or production. Create/link a separate staging project and configure Supabase CLI; establish migration history and compare schema drift there. Ensure migration `006` is present in each required environment.
- [ ] Check PostGIS, RLS on every public table, required policies, Storage owner scoping, and Realtime publication in staging.
- [ ] Test access as requester, donor, moderator, and unrelated signed-in user against an agreed access matrix.
- [ ] Perform a staging restore test and verify monitoring and application rollback.
- [x] Draft the architecture/data-flow diagram, access matrix, request-state transition table, privacy notice, terms and consent text. These are working drafts; obtain appropriate legal review and finalize retention/contact details before public launch.
- [x] Prepare the Phase 0 read-only database audit script and local profile-privacy migration.
- [ ] Add/link a staging project, apply migration `006`, run CLI history/drift checks, and test role/RLS behavior against real accounts.
- [ ] Confirm the pilot area/languages and finalize document, request and audit retention values with appropriate review.
- [ ] Complete the staging restore, monitoring, and deployment rollback exercise.
- [ ] Record the production migration backup/forward-fix procedure and confirm a monitored staging deployment.

