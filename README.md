# LifeLink 🩸

Emergency Blood & Platelet Coordination Platform connecting donors, requesters, and healthcare facilities with geospatial matching and real-time tracking.

## Tech Stack
- **Framework**: Next.js 14 (App Router, Route Handlers) + TypeScript + Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + PostGIS + Row Level Security + Realtime)
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

### 4. Health Check
```bash
curl http://localhost:3000/api/health
```

### 5. Run Tests
```bash
npm test
```
