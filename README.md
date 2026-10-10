# LifeLink 🩸

Emergency Blood & Platelet Coordination Platform connecting donors, requesters, and healthcare facilities with geospatial matching and real-time tracking.

## Tech Stack
- **Framework**: Next.js 14 (App Router, Route Handlers) + TypeScript + Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + PostGIS + Row Level Security + Realtime)
- **SQL ORM**: Drizzle ORM + Drizzle Kit (PostgreSQL migrations and schema)
- **Mapping**: Mapbox GL JS
- **AI Verification**: Claude API
- **Testing**: Vitest

## Implementation Roadmap
- [x] **Step 1**: Project Foundation (Next.js 14, Mapbox, Vitest, directory structure, health check)
- [ ] **Step 2**: Supabase & Database (PostGIS schema, indexes, RLS, seed data)
- [ ] **Step 3**: Authentication & Roles (Sessions, profiles, requester/donor/moderator permissions)
- [ ] **Step 4**: Request Creation & Three-Gate Verification (OTP, document validation, AI risk screening)
- [ ] **Step 5**: Emergency Pulse (Geospatial donor matching & notifications)
- [ ] **Step 6**: Pledges & Live Tracker (One-tap pledge, Realtime updates)
- [ ] **Step 7**: Moderator Dashboard & UI Polish (Review flagged requests, error states)
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

### 4. Health Check
```bash
curl http://localhost:3000/api/health
```

### 5. Run Tests
```bash
npm test
```
