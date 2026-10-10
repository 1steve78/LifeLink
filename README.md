# LifeLink 🩸

Emergency Blood & Platelet Coordination Platform connecting donors, requesters, and healthcare facilities with geospatial matching and real-time tracking.

## Tech Stack
- **Framework**: Next.js 14 (App Router, Route Handlers) + TypeScript + Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + PostGIS + Row Level Security + Realtime)
- **SQL ORM**: Drizzle ORM + Drizzle Kit (PostgreSQL migrations and schema)
- **Mapping**: Leaflet + React Leaflet
- **AI Verification**: NVIDIA NIM API
- **Testing**: Vitest

## Implementation Roadmap
- [x] **Step 1**: Project Foundation (Next.js 14, Mapbox, Vitest, directory structure, health check)
- [ ] **Step 2**: Supabase & Database (PostGIS schema, indexes, RLS, seed data)
- [ ] **Step 3**: Authentication & Roles (Sessions, profiles, requester/donor/moderator permissions)
- [ ] **Step 4**: Request Creation & Three-Gate Verification (OTP, document validation, AI risk screening)
- [x] **Step 5**: Emergency Pulse (Geospatial donor matching & notifications)
- [x] **Step 6**: Pledges & Live Tracker (One-tap pledge, Realtime updates)
- [x] **Step 7**: Moderator Dashboard & UI Polish (Review flagged requests, error states)
- [ ] **Step 8**: Integration Tests & Deployment (End-to-end tests, Vercel deployment)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase PostgreSQL and Drizzle

Keep the Supabase URL and anon key for Supabase Auth, browser sessions, and RLS-aware queries. Drizzle connects directly to the Supabase PostgreSQL database from server-side code. Set `DATABASE_URL` in `.env.local` using the connection string shown in **Supabase Dashboard → Project Settings → Database**. For serverless deployments, use the Supavisor session pooler connection string and keep `sslmode=require` (the app configures TLS for the connection).

The Drizzle schema is in `lib/db/schema.ts`; import `db` from `lib/db` in server-only code. The connection is not created until that module is imported, so auth-only routes do not require a database URL. The schema describes the existing tables in `supabase/schema.sql`; apply that base schema to a new Supabase project first, including the PostGIS extension and RLS policies. The auth profile trigger and policies remain managed in `supabase/auth_profile_setup.sql`.

Generate and apply future schema migrations with:

```bash
npm run db:generate
npm run db:migrate
```

`npm run db:push` is available for local prototyping. Review generated migrations before applying them to a shared or production database. Keep RLS enabled and use the Supabase client for user-scoped access; direct Drizzle access runs with the database connection role and should only be used in trusted server code with explicit authorization checks.

### Request verification pipeline

Before deploying the request routes, apply `supabase/migrations/202610100001_verification_pipeline.sql` in the Supabase SQL Editor. It adds the request deadline, private document bucket and owner-only storage policies, the verification event log, and a profile trigger that prevents public sign-up metadata from assigning the moderator role.

Before enabling Emergency Pulse, apply `supabase/migrations/202610100003_emergency_pulse.sql` after the verification migration. It adds approximate donor geography, private donor notifications, and the server-only `find_eligible_donors` PostGIS query. The separate `202610100002_request_details.sql` migration adds patient and hospital request fields. Donors should save an approximate map location in profile setup; requesters provide the hospital point. Radius tiers are 15 km (critical), 8 km (urgent), and 5 km (planned). The initial 90-day donation interval is a product screening rule only; clinicians determine eligibility.

For donor pledges and the requester progress tracker, apply `supabase/migrations/202610100004_pledge_tracker_realtime.sql` after migrations `001`–`003`. It adds the unique pledge guard, pledge update timestamp, privacy-safe tracker events, status triggers, and the Supabase Realtime publication entry. Donors pledge, confirm that coordination has started, or withdraw through `/donor/pulse`. Requesters can open `/requests/{requestId}/tracker` from the successful request submission screen, follow aggregate pledge updates, and mark an active request fulfilled or cancelled. The tracker reveals no donor identity. Fulfilment and cancellation require the requester or an allowlisted moderator; a pledge is not proof of donation. Hospital or blood bank staff confirm compatibility and eligibility.

The human review checkpoint is `/moderator`. Apply `supabase/migrations/202610100005_moderator_safety_checkpoint.sql` after `001`–`004`; it adds the separate `review_state`, append-only moderation decisions and requester clarification records. Moderator APIs independently require both the `moderator` profile role and a user ID in `MODERATOR_USER_IDS`. Private documents are opened through a five-minute signed URL issued only after that authorization check, which requires `SUPABASE_SERVICE_ROLE_KEY` on the server. Approvals require completed basic validation, document analysis, risk screening and a hospital location. Flagged approvals require a reason; unavailable AI checks never count as passes. Requesters can see the reason and send clarifications from their tracker. Decision updates and audit writes commit together, and a revision guard rejects competing decisions.

Migration `202610100006_private_profile_reads.sql` narrows direct Supabase profile reads to the authenticated profile owner and adds a restrictive owner predicate so custom permissive policies cannot broaden reads. It has been applied to the database configured in `.env.local`; confirm whether that is staging or production and apply/reconcile it in other environments. Without it, an older profile policy may allow any signed-in user to read other profiles, including donor contact/location fields. Run the read-only checks in `supabase/audits/phase0_security_audit.sql` before the staging role-access review. Do not treat SQL object presence alone as proof that RLS policies behave correctly for each user role.

Configure `NVIDIA_NIM_API_KEY` and optionally `NVIDIA_NIM_MODEL` for risk screening and JPG/PNG photo analysis. The default model is `meta/llama-3.2-90b-vision-instruct`. Supporting documents must be uploaded as JPG or PNG photos; PDFs are rejected at validation. If the provider is unavailable, verification records an error and the request stays pending. No automated gate activates a request. Configure `MODERATOR_USER_IDS` as a comma-separated list of trusted auth user IDs, and assign those users `moderator` in `public.profiles` through an administrative database session. Both the allowlist and the profile role are required for review.

`POST /api/requests` authenticates the user, validates required fields and document signature, then stores the request as `pending_verification` with the document in private storage. `POST /api/verify/document` compares extracted hospital, blood group, units, and required-by date; `POST /api/verify/ai-screen` combines duplicate/history rules with AI risk signals. `GET /api/requests` returns the caller's own requests, or the review queue to an allowlisted moderator. `POST /api/requests/{requestId}/review` records an approval or rejection and reason. Approval is the only operation that changes a pending request to `active`.

Donor matching uses `getEligibleRequestsForDonorMatching(donorId)` from `lib/pulse/eligible-requests.ts`, backed by `find_eligible_donors`. The SQL requires an `active` request, compatible red-cell blood groups, an available donor, a location inside the urgency radius, and the 90-day screening interval. Moderator approval activates the request and creates notifications in one transaction. Donors can view matches at `/donor/pulse` and pledge only while the request is still active and still matches their profile. The map exposes hospital points, never donor home coordinates or patient contact details. Hospital staff must confirm blood compatibility and donor eligibility.

### 4. Health Check
```bash
curl http://localhost:3000/api/health
```

### 5. Run Tests
```bash
npm test
```
