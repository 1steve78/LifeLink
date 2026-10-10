# LifeLink 🩸

Emergency Blood & Platelet Coordination Platform connecting donors, requesters, and healthcare facilities with geospatial matching, AI-assisted verification, and real-time coordination.

---

## 🌟 Overview

LifeLink solves critical delays in emergency blood and platelet procurement. Built on a privacy-preserving and security-first architecture, the platform features:

1. **Geospatial Emergency Pulse**: Matches urgent blood requests with compatible nearby donors using PostGIS spatial indexing and urgency-based radius tiers.
2. **Three-Gate Request Verification**: Combines cryptographic file validation, NVIDIA NIM multimodal AI document analysis, and deterministic heuristic risk screening.
3. **Human-in-the-Loop Moderator Checkpoint**: Dual-authenticated administrative review queue for flagged requests, protected by strict allowlists and audit trails.
4. **Live Coordination & Realtime Tracker**: One-tap donor pledges, live aggregate status updates via Supabase Realtime, and mutual donation confirmation with clinical cooldown enforcement.
5. **Account Privacy & Abuse Controls**: Strict Row-Level Security (RLS), private supporting document storage, donor availability toggles, and report intake workflows.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components, Route Handlers)
- **Language & Styling**: [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 15, PostGIS extension, Row Level Security, Realtime, Storage)
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) + Drizzle Kit
- **AI Verification**: [NVIDIA NIM](https://build.nvidia.com/) API (`meta/llama-3.2-11b-vision-instruct`)
- **Mapping & Geospatial**: [Leaflet](https://leafletjs.com/) / [React Leaflet](https://react-leaflet.js.org/) + [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Scheduled Tasks**: [Vercel Cron](https://vercel.com/docs/cron-jobs)

---

## 🏗️ Architecture & Verification Pipeline

```mermaid
flowchart TD
    A[Blood Request Submission] --> B[Gate 1: Validation & Signature Check]
    B -->|Passed| C[Gate 2: NVIDIA NIM Document Analysis]
    C -->|Extracted Fields Match| D[Gate 3: AI Screening & Heuristic Rules]
    C -->|Mismatch / Unreadable| M[Flagged for Moderator Review]
    D -->|Low Risk & Valid| P[Pending Moderator Approval]
    D -->|Risk Signals Detected| M
    M -->|Human Review Approved| E[Active Request]
    P -->|Moderator Approval| E
    E --> F[Emergency Pulse: PostGIS Matching]
    F --> G[Nearby Compatible Donors Notified]
    G --> H[Pledge & Mutual Donation Confirmation]
```

### Verification Pipeline
- **Gate 1**: Validates patient, hospital, units, deadline, and verifies upload magic bytes (rejects non-image or spoofed files; JPG/PNG only).
- **Gate 2**: Calls NVIDIA NIM Vision API to extract blood group, requested units, hospital name, and required-by date, comparing them against submission details.
- **Gate 3**: Combines deterministic rules (request frequency, identical hashes across accounts, conflicting records) with AI risk assessment.
- **Fail-Closed Guarantee**: If the AI model or provider is unavailable, requests fail safely to `under_review` / `error` without prematurely alerting donors.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.18.0 or newer
- **Supabase Project**: With PostGIS extension enabled
- **NVIDIA NIM API Key**: Free API key from [build.nvidia.com](https://build.nvidia.com/)
- **Mapbox Access Token** (optional for Mapbox GL)

### 2. Installation
```bash
git clone https://github.com/1steve78/LifeLink.git
cd LifeLink/lifelink
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase PostgreSQL Connection String (Session pooler for serverless)
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:5432/postgres

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-access-token

# AI Verification (NVIDIA NIM)
NVIDIA_NIM_API_KEY=nvapi-your-key
NVIDIA_NIM_MODEL=meta/llama-3.2-11b-vision-instruct

# Moderator Authorization (Comma-separated Supabase Auth UUIDs)
MODERATOR_USER_IDS=uuid-1,uuid-2

# Vercel Cron Authorization Secret
CRON_SECRET=your-secure-cron-secret
```

---

## 🗄️ Database Migrations

Apply the migration scripts in sequential order inside the **Supabase SQL Editor**:

1. `supabase/schema.sql` - Base tables, PostGIS extension, and initial RLS policies.
2. `supabase/migrations/202610100001_verification_pipeline.sql` - Verification logs, private document storage bucket & security.
3. `supabase/migrations/202610100002_request_details.sql` - Hospital coordinates and patient metadata.
4. `supabase/migrations/202610100003_emergency_pulse.sql` - PostGIS `find_eligible_donors` function & donor notifications.
5. `supabase/migrations/202610100004_pledge_tracker_realtime.sql` - Pledges, Realtime tracker publications, and status guards.
6. `supabase/migrations/202610100005_moderator_safety_checkpoint.sql` - Moderator decisions, signed URLs, and clarification logs.
7. `supabase/migrations/202610100006_private_profile_reads.sql` - Restrictive RLS for donor and requester profile privacy.
8. `supabase/migrations/202610100007_donor_acceptance_donation_confirmation.sql` - Mutual coordination, donation verification, and 90-day cooldown enforcement.
9. `supabase/migrations/202610100008_expired_request_status.sql` - Added `expired` lifecycle state for unfulfilled requests.
10. `supabase/migrations/202610100009_request_automatic_expiry.sql` - Server-side automated request expiry logic.
11. `supabase/migrations/202610100010_account_controls_and_abuse.sql` - Abuse reports table, account settings, and rate limiting tables.

---

## 🧪 Testing & Health Checks

Run the Vitest test suite:
```bash
npm test
```

Run TypeScript compiler validation:
```bash
npx tsc --noEmit
```

Test the health check endpoint:
```bash
curl http://localhost:3000/api/health
```

Expected output:
```json
{
  "status": "ok",
  "app": "LifeLink",
  "checks": {
    "database": "connected"
  },
  "timestamp": "2026-10-10T..."
}
```

---

## 🛡️ Security & Privacy Principles

- **No Medical Data Scraping**: AI models process documents strictly in memory; files are stored in private Supabase buckets accessible only by owners and dual-authorized moderators via time-limited signed URLs.
- **Privacy-Preserving Tracking**: The public tracker reveals only aggregate pledged counts and status changes. Donor identities, personal addresses, and contact numbers are never exposed.
- **Strict Role Boundaries**: Moderator capabilities require both `moderator` role assignment in database profiles AND explicit inclusion in `MODERATOR_USER_IDS`.
- **Fail-Closed AI**: Automated models cannot unilaterally approve requests; critical errors, ambiguities, and model outages route requests to human moderators.
- **Clinical Cooldown**: Donors confirming donation automatically enter a 90-day cooldown interval before appearing in future Emergency Pulse matching queries.

---

## 📄 License

This project is licensed under the MIT License.
