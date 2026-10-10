-- 1. Enable Required Extensions
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- 2. Create Enums
create type public.user_role as enum (
  'requester',
  'donor',
  'moderator'
);

create type public.request_urgency as enum (
  'critical',
  'urgent',
  'planned'
);

create type public.request_status as enum (
  'pending_verification',
  'under_review',
  'active',
  'fulfilled',
  'rejected',
  'cancelled'
);

-- 3. Create Profiles Table (links to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'requester',
  blood_group text,
  last_donation_date date,
  available_to_donate boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_blood_group check (
    blood_group is null or blood_group in (
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    )
  )
);

-- 4. Create Blood Requests Table (with PostGIS Point for hospital location)
create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id),
  patient_name text not null,
  blood_group text not null,
  units_needed integer not null default 1 check (units_needed > 0),
  hospital_name text not null,
  hospital_location geography(point, 4326),
  urgency public.request_urgency not null default 'urgent',
  status public.request_status not null default 'pending_verification',
  verification_passed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_request_blood_group check (
    blood_group in (
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    )
  )
);

-- 5. Create Donor Pledges Table
create table public.donor_pledges (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  donor_id uuid not null references public.profiles(id),
  status text not null default 'pledged' check (status in ('pledged', 'confirmed', 'completed', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (request_id, donor_id)
);

-- 6. Create Indexes
create index blood_requests_status_idx on public.blood_requests(status);
create index blood_requests_location_idx on public.blood_requests using gist(hospital_location);
create index donor_pledges_request_idx on public.donor_pledges(request_id);

-- 7. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.blood_requests enable row level security;
alter table public.donor_pledges enable row level security;
