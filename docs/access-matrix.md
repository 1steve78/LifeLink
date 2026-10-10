# LifeLink Access Matrix

This describes the intended authorization boundary for the current app. The table applies to application routes; direct browser/database access is separately constrained by RLS. Because server-side Drizzle uses a privileged connection, role and ownership checks in the API are mandatory.

The current middleware refreshes sessions but does not protect page routes. Client page shells may load without a session; private data and actions must remain behind API authorization and show a sign-in/denied state when access fails.

## Route access

| Path | Public | Requester | Donor | Moderator |
|---|---|---|---|---|
| `/`, `/login`, `/auth/callback` | View/use | View/use | View/use | View/use |
| `/profile/setup` UI; `GET/POST /api/profile` data | UI shell may load; API returns 401 | Own profile only | Own profile only | Own profile only |
| `/requests` UI; `GET /api/requests` data | UI shell may load; API returns 401 | Own requests only | API returns 403 | Allowlisted moderator review queue |
| `POST /api/requests` | No | Create own request | Denied | Denied |
| `POST /api/verify/document`, `POST /api/verify/ai-screen` | No | Own request only | Denied | Not a moderator shortcut |
| `POST /api/requests/{id}/information` | No | Own request in `under_review` with `needs_information` | Denied | Reads response through review queue |
| `/requests/{id}/tracker` UI and API | UI shell may load; API returns 401 | Own request only | API returns 403 | Allowlisted moderator may review/manage |
| `/moderator` UI and `GET /api/requests` queue | UI shell may load; API returns 401 | API returns 403 | API returns 403 | Both moderator role and allowlist required |
| `/api/requests/{id}/review` | No | Denied | Denied | Both `profiles.role = moderator` and `MODERATOR_USER_IDS` allowlist required |
| `/api/requests/{id}/document` | No | No | No | Same role + allowlist; five-minute signed URL |
| `/api/requests/nearby` | No | Own active-request aggregate counts/map only | Denied | No requester map route |
| `/donor/pulse` UI; `/api/pulse/matches` data | UI shell may load; API returns 401 | API returns 403 | Own eligible request shortlist | API returns 403 |
| `/api/pulse/pledges`, `/api/pulse/pledges/{id}` | No | Denied | Create/update own pledge only | Denied |
| `/api/notifications` | No | Denied | Read/mark own notification only | Denied |
| `/api/health`, `/api/supabase-check` | Health/configuration status only | Same | Same | Same |

## Data boundaries

| Data | Public | Requester | Donor | Moderator | Database policy / server boundary |
|---|---|---|---|---|---|
| Profile row, phone, approximate location | None | Own profile | Own profile | Own profile through profile API; no general moderator directory | RLS owner-only SELECT/INSERT/UPDATE. Migration `202610100006_private_profile_reads.sql` adds a restrictive owner predicate; it is applied to the database configured in `.env.local`, but that project's environment has not been identified. |
| Request personal fields and document path | None | Own request fields through API | None | Review queue for pending/under-review requests | `blood_requests` RLS has no user read policy; server routes use Drizzle and enforce role/ownership. |
| Active request location/details | None | Own details and aggregate nearby donor count; no donor pins/distance per donor | Only eligible request details via donor matching/notification APIs | Only as authorized review/management requires | Matching runs server-side; never return a donor list to seekers. |
| Pledges | None | Aggregate counts only in own tracker | Own pledge actions; no other donor identities | No general pledge directory | RLS blocks direct user table access; server APIs scope by donor/request. |
| Tracker events | None | Own request events | None | Authorized review as implemented in server API | RLS uses `can_read_request_tracker(request_id)` for requester ownership. |
| Verification events, moderation audit, clarification responses | None | Own clarification response status/content through tracker where applicable | None | Pending-request review details through authorized server routes | RLS enabled; direct user access is revoked/no policy; server routes mediate reads/writes. |
| Supporting documents | None | Own files under own UID path | None | Five-minute signed URL through allowlisted moderator API | Private bucket and owner-scoped Storage policies. |
| Donor notifications | None | None | Own notifications only | None | RLS policies scope to `auth.uid()`; update privilege limited to `read_at`. |

## Known rollout caveats

- Migration `202610100006_private_profile_reads.sql` is applied to the database configured in `.env.local`; the connection's staging/production identity is unconfirmed. Both the owner SELECT policy and restrictive owner predicate were verified after application.
- The user-provided SQL audit confirmed key objects but did not check every policy/grant or exercise real requester, donor, moderator and unrelated-user sessions.
- Moderator allowlist logic is currently repeated in route handlers. Centralize it during Phase 1; do not assume the current repeated checks are a shared authorization helper.
- The public landing feed is static mock data, not an authorized public request API.

