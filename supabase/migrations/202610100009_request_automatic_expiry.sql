begin;

alter table public.blood_requests
  add column if not exists required_by timestamptz;
create index if not exists blood_requests_open_required_by_idx
  on public.blood_requests(required_by)
  where status in ('pending_verification', 'under_review', 'active');

-- Legacy rows may not have a deadline; give them a 48-hour window from creation.
update public.blood_requests
set required_by = created_at + interval '48 hours'
where required_by is null;

alter table public.request_tracker_events
  drop constraint if exists request_tracker_events_event_type_check;
alter table public.request_tracker_events
  drop constraint if exists request_tracker_event_type_check;
alter table public.request_tracker_events
  add constraint request_tracker_event_type_check
  check (event_type in (
    'request_submitted', 'request_under_review', 'request_activated', 'request_rejected',
    'request_cancelled', 'request_fulfilled', 'request_expired', 'request_information_needed',
    'donor_pledged', 'donor_accepted', 'donor_confirmed', 'donor_withdrew',
    'donor_donation_reported', 'donor_donation_confirmed'
  ));

create or replace function public.log_request_tracker_status()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  event_name text;
  current_pledges integer;
  current_confirmed integer;
begin
  if tg_op = 'INSERT' then
    event_name := case new.status
      when 'active' then 'request_activated'
      when 'under_review' then 'request_under_review'
      when 'rejected' then 'request_rejected'
      when 'cancelled' then 'request_cancelled'
      when 'fulfilled' then 'request_fulfilled'
      when 'expired' then 'request_expired'
      else 'request_submitted'
    end;
  elsif old.status is distinct from new.status then
    event_name := case new.status
      when 'pending_verification' then 'request_submitted'
      when 'active' then 'request_activated'
      when 'under_review' then 'request_under_review'
      when 'rejected' then 'request_rejected'
      when 'cancelled' then 'request_cancelled'
      when 'fulfilled' then 'request_fulfilled'
      when 'expired' then 'request_expired'
      else null
    end;
  else
    return new;
  end if;

  select count(*) filter (where status in ('pledged', 'accepted', 'confirmed', 'completed'))::integer,
         count(*) filter (where status in ('confirmed', 'completed'))::integer
    into current_pledges, current_confirmed
  from public.donor_pledges where request_id = new.id;

  insert into public.request_tracker_events(request_id, event_type, request_status, pledge_count, confirmed_count)
  values (new.id, event_name, new.status, coalesce(current_pledges, 0), coalesce(current_confirmed, 0));
  return new;
end;
$$;
revoke all on function public.log_request_tracker_status() from public, anon, authenticated;

create or replace function public.expire_blood_requests()
returns integer
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  expired_count integer;
begin
  update public.blood_requests
  set status = 'expired', review_state = 'open', updated_at = now()
  where status in ('pending_verification', 'under_review', 'active')
    and coalesce(required_by, created_at + interval '48 hours') <= now();
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;
revoke all on function public.expire_blood_requests() from public, anon, authenticated;
grant execute on function public.expire_blood_requests() to service_role;

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
