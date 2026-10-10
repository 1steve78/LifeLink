begin;

alter table public.profiles add column if not exists location geography(point, 4326);
create index if not exists profiles_location_idx on public.profiles using gist (location);

create table if not exists public.donor_notifications (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint donor_notifications_donor_request_key unique (donor_id, request_id)
);
create index if not exists donor_notifications_donor_created_idx
  on public.donor_notifications(donor_id, created_at desc);
alter table public.donor_notifications enable row level security;

drop policy if exists "Donors read their own notifications" on public.donor_notifications;
create policy "Donors read their own notifications"
  on public.donor_notifications for select to authenticated
  using (donor_id = auth.uid());
drop policy if exists "Donors mark their own notifications read" on public.donor_notifications;
create policy "Donors mark their own notifications read"
  on public.donor_notifications for update to authenticated
  using (donor_id = auth.uid()) with check (donor_id = auth.uid());
revoke update on public.donor_notifications from authenticated;
grant update (read_at) on public.donor_notifications to authenticated;

create or replace function public.find_eligible_donors(target_request_id uuid)
returns table (donor_id uuid, distance_km double precision)
language sql stable security invoker
set search_path = public, extensions
as $$
  select p.id,
         (st_distance(p.location, r.hospital_location) / 1000.0)::double precision
  from public.blood_requests r
  join public.profiles p on p.role = 'donor'
  where r.id = target_request_id
    and r.status = 'active'
    and r.hospital_location is not null
    and p.location is not null
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
    and st_dwithin(
      p.location,
      r.hospital_location,
      case r.urgency when 'critical' then 15000 when 'urgent' then 8000 else 5000 end
    )
  order by st_distance(p.location, r.hospital_location);
$$;

revoke all on function public.find_eligible_donors(uuid) from public, anon, authenticated;
grant execute on function public.find_eligible_donors(uuid) to service_role;

commit;
