begin;

alter table public.profiles
  add column if not exists availability_expires_at timestamptz;
-- Existing availability had no age limit, so ask existing donors to opt in again.
update public.profiles
set available_to_donate = false, availability_expires_at = null
where available_to_donate = true;

alter table public.blood_requests drop constraint if exists blood_requests_requester_id_fkey;
alter table public.blood_requests add constraint blood_requests_requester_id_fkey
  foreign key (requester_id) references public.profiles(id) on delete cascade;
alter table public.donor_pledges drop constraint if exists donor_pledges_donor_id_fkey;
alter table public.donor_pledges add constraint donor_pledges_donor_id_fkey
  foreign key (donor_id) references public.profiles(id) on delete cascade;
alter table public.moderation_audit_events drop constraint if exists moderation_audit_events_request_id_fkey;
alter table public.moderation_audit_events add constraint moderation_audit_events_request_id_fkey
  foreign key (request_id) references public.blood_requests(id) on delete cascade;
alter table public.moderation_audit_events drop constraint if exists moderation_audit_events_moderator_id_fkey;
alter table public.moderation_audit_events alter column moderator_id drop not null;
alter table public.moderation_audit_events add constraint moderation_audit_events_moderator_id_fkey
  foreign key (moderator_id) references public.profiles(id) on delete set null;
alter table public.requester_information_responses drop constraint if exists requester_information_responses_request_id_fkey;
alter table public.requester_information_responses add constraint requester_information_responses_request_id_fkey
  foreign key (request_id) references public.blood_requests(id) on delete cascade;
alter table public.requester_information_responses drop constraint if exists requester_information_responses_requester_id_fkey;
alter table public.requester_information_responses add constraint requester_information_responses_requester_id_fkey
  foreign key (requester_id) references public.profiles(id) on delete cascade;
alter table public.request_verification_events drop constraint if exists request_verification_events_performed_by_fkey;
alter table public.request_verification_events add constraint request_verification_events_performed_by_fkey
  foreign key (performed_by) references public.profiles(id) on delete set null;
alter table public.donation_reports drop constraint if exists donation_reports_confirmed_by_fkey;
alter table public.donation_reports add constraint donation_reports_confirmed_by_fkey
  foreign key (confirmed_by) references public.profiles(id) on delete set null;
alter table public.donation_reports drop constraint if exists donation_reports_confirmation_check;
alter table public.donation_reports add constraint donation_reports_confirmation_check check (
  (status = 'reported' and confirmed_at is null and confirmed_by is null)
  or (status = 'confirmed' and confirmed_at is not null)
);

-- Keep audit data immutable during normal use while permitting parent-account deletion
-- cascades and nulling a deleted moderator's identity reference.
create or replace function public.prevent_moderation_audit_mutation()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' and not exists (
    select 1 from public.blood_requests where id = old.request_id
  ) then return old; end if;
  if tg_op = 'UPDATE'
    and old.moderator_id is not null and new.moderator_id is null
    and old.id = new.id and old.request_id = new.request_id
    and old.action = new.action and old.previous_status = new.previous_status
    and old.new_status = new.new_status and old.reason = new.reason
    and old.created_at = new.created_at then return new;
  end if;
  raise exception 'Moderation audit events are append-only';
end;
$$;

create or replace function public.prevent_requester_response_mutation()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' and (
    not exists (select 1 from public.blood_requests where id = old.request_id)
    or not exists (select 1 from public.profiles where id = old.requester_id)
  ) then return old; end if;
  raise exception 'Requester information responses are append-only';
end;
$$;

create table if not exists public.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('request', 'pledge')),
  target_id uuid not null,
  reason text not null check (reason in ('fraud', 'inaccurate', 'harassment', 'other')),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists abuse_reports_status_created_idx on public.abuse_reports(status, created_at);
create index if not exists abuse_reports_target_idx on public.abuse_reports(target_type, target_id);
create unique index if not exists abuse_reports_one_open_per_reporter_target_idx
  on public.abuse_reports(reporter_id, target_type, target_id)
  where status = 'open' and reporter_id is not null;
alter table public.abuse_reports enable row level security;
revoke all on public.abuse_reports from anon, authenticated;

create table if not exists public.rate_limit_buckets (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null
);
alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated;

create or replace function public.expire_donor_availability()
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare expired_count integer;
begin
  update public.profiles
  set available_to_donate = false, availability_expires_at = null, updated_at = now()
  where available_to_donate = true
    and availability_expires_at is not null and availability_expires_at <= now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;
revoke all on function public.expire_donor_availability() from public, anon, authenticated;
grant execute on function public.expire_donor_availability() to service_role;

create or replace function public.find_eligible_donors(target_request_id uuid)
returns table (donor_id uuid, distance_km double precision)
language sql stable security invoker
set search_path = public, extensions
as $$
  select p.id, (st_distance(p.location, r.hospital_location) / 1000.0)::double precision
  from public.blood_requests r
  join public.profiles p on p.role = 'donor'
  where r.id = target_request_id and r.status = 'active'
    and coalesce(r.required_by, r.created_at + interval '48 hours') > now()
    and r.hospital_location is not null and p.location is not null
    and p.available_to_donate = true
    and p.availability_expires_at > now()
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

commit;
