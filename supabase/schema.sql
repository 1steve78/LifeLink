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

create type public.verification_gate as enum (
  'basic_validation', 'document_analysis', 'risk_screening', 'moderator_review'
);

create type public.verification_result_status as enum (
  'pending', 'passed', 'flagged', 'failed', 'error', 'approved', 'rejected'
);

-- 3. Create Profiles Table (links to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role public.user_role not null default 'requester',
  blood_group text,
  locality text,
  location geography(point, 4326),
  last_donation_date date,
  available_to_donate boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_blood_group check (
    blood_group is null or blood_group in (
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'
    )
  )
);

-- 4. Create Blood Requests Table (with PostGIS Point for hospital location)
create table public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id),
  patient_name text,
  patient_reference text,
  patient_age integer check (patient_age is null or patient_age between 0 and 120),
  contact_person_name text,
  contact_phone text,
  blood_group text not null,
  units_needed integer not null default 1 check (units_needed > 0),
  hospital_name text not null,
  hospital_address text,
  hospital_location geography(point, 4326),
  required_by timestamptz,
  supporting_document_path text,
  document_sha256 text,
  urgency public.request_urgency not null default 'urgent',
  status public.request_status not null default 'pending_verification',
  review_state text not null default 'open' check (review_state in ('open', 'needs_information')),
  review_revision integer not null default 0,
  verification_passed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_requests_patient_identity_check check (
    nullif(btrim(patient_name), '') is not null or nullif(btrim(patient_reference), '') is not null
  ),
  constraint valid_request_blood_group check (
    blood_group in (
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    )
  )
);

-- Append-only audit trail for each automated gate and moderator decision.
create table public.request_verification_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  gate public.verification_gate not null,
  status public.verification_result_status not null,
  details jsonb not null default '{}'::jsonb,
  model text,
  performed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.moderation_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id),
  moderator_id uuid not null references public.profiles(id),
  action text not null check (action in ('approve', 'reject', 'request_information')),
  previous_status public.request_status not null,
  new_status public.request_status not null,
  reason text not null check (length(btrim(reason)) >= 5),
  created_at timestamptz not null default now()
);

create table public.requester_information_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id),
  requester_id uuid not null references public.profiles(id),
  message text not null check (length(btrim(message)) between 5 and 2000),
  created_at timestamptz not null default now()
);

-- 5. Create Donor Pledges Table
create table public.donor_pledges (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  donor_id uuid not null references public.profiles(id),
  status text not null default 'pledged' check (status in ('pledged', 'confirmed', 'completed', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, donor_id)
);

-- Safe requester-facing progress. This table intentionally contains no donor identifiers.
create table public.request_tracker_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  event_type text not null check (event_type in (
    'request_submitted', 'request_under_review', 'request_activated', 'request_rejected',
    'request_cancelled', 'request_fulfilled', 'request_information_needed', 'donor_pledged', 'donor_confirmed', 'donor_withdrew'
  )),
  request_status public.request_status not null,
  pledge_count integer not null default 0 check (pledge_count >= 0),
  confirmed_count integer not null default 0 check (confirmed_count >= 0),
  created_at timestamptz not null default now()
);

create table public.donor_notifications (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint donor_notifications_donor_request_key unique (donor_id, request_id)
);

-- 6. Create Indexes
create index blood_requests_status_idx on public.blood_requests(status);
create index profiles_location_idx on public.profiles using gist(location);
create index blood_requests_location_idx on public.blood_requests using gist(hospital_location);
create index donor_pledges_request_idx on public.donor_pledges(request_id);
create index request_tracker_events_request_created_idx on public.request_tracker_events(request_id, created_at);
create index donor_notifications_donor_created_idx on public.donor_notifications(donor_id, created_at desc);
create index request_verification_events_request_idx on public.request_verification_events(request_id, created_at);
create index request_verification_events_gate_status_idx on public.request_verification_events(gate, status);
create index moderation_audit_events_request_created_idx on public.moderation_audit_events(request_id, created_at desc);
create index requester_information_responses_request_created_idx on public.requester_information_responses(request_id, created_at desc);

-- 7. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.blood_requests enable row level security;
alter table public.donor_pledges enable row level security;
alter table public.request_tracker_events enable row level security;
alter table public.donor_notifications enable row level security;

create policy "Donors read their own notifications" on public.donor_notifications
  for select to authenticated using (donor_id = auth.uid());
create policy "Donors mark their own notifications read" on public.donor_notifications
  for update to authenticated using (donor_id = auth.uid()) with check (donor_id = auth.uid());
revoke update on public.donor_notifications from authenticated;
grant update (read_at) on public.donor_notifications to authenticated;
alter table public.request_verification_events enable row level security;
alter table public.moderation_audit_events enable row level security;
alter table public.requester_information_responses enable row level security;
revoke all on public.moderation_audit_events, public.requester_information_responses from anon, authenticated;

create or replace function public.prevent_audit_row_mutation()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin raise exception 'Audit and requester response events are append-only'; end;
$$;
create trigger moderation_audit_events_append_only before update or delete on public.moderation_audit_events
  for each row execute function public.prevent_audit_row_mutation();
create trigger requester_information_responses_append_only before update or delete on public.requester_information_responses
  for each row execute function public.prevent_audit_row_mutation();
revoke all on function public.prevent_audit_row_mutation() from public, anon, authenticated;

create or replace function public.can_read_request_tracker(target_request_id uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.blood_requests r
    where r.id = target_request_id and r.requester_id = auth.uid());
$$;
revoke all on function public.can_read_request_tracker(uuid) from public, anon;
grant execute on function public.can_read_request_tracker(uuid) to authenticated;
create policy "Requesters read their own tracker events" on public.request_tracker_events
  for select to authenticated using (public.can_read_request_tracker(request_id));
revoke all on public.request_tracker_events from anon, authenticated;
grant select on public.request_tracker_events to authenticated;

create or replace function public.find_eligible_donors(target_request_id uuid)
returns table (donor_id uuid, distance_km double precision)
language sql stable security invoker
set search_path = public, extensions
as $$
  select p.id, (st_distance(p.location, r.hospital_location) / 1000.0)::double precision
  from public.blood_requests r
  join public.profiles p on p.role = 'donor'
  where r.id = target_request_id and r.status = 'active'
    and r.hospital_location is not null and p.location is not null
    and p.available_to_donate = true
    and p.blood_group = any(case r.blood_group
      when 'A+' then array['A+', 'A-', 'O+', 'O-']::text[]
      when 'A-' then array['A-', 'O-']::text[]
      when 'B+' then array['B+', 'B-', 'O+', 'O-']::text[]
      when 'B-' then array['B-', 'O-']::text[]
      when 'AB+' then array['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']::text[]
      when 'AB-' then array['A-', 'B-', 'AB-', 'O-']::text[]
      when 'O+' then array['O+', 'O-']::text[]
      when 'O-' then array['O-']::text[]
      else array[]::text[]
    end)
    and (p.last_donation_date is null or p.last_donation_date <= current_date - 90)
    and st_dwithin(p.location, r.hospital_location,
      case r.urgency when 'critical' then 15000 when 'urgent' then 8000 else 5000 end)
  order by st_distance(p.location, r.hospital_location);
$$;

revoke all on function public.find_eligible_donors(uuid) from public, anon, authenticated;
grant execute on function public.find_eligible_donors(uuid) to service_role;
