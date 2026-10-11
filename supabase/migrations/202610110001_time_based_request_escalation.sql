begin;

-- Radius policy is data so local partners can tune the response without a deploy.
create table if not exists public.escalation_policy (
  urgency public.request_urgency primary key,
  start_km numeric(6,2) not null check (start_km > 0),
  step_minutes integer not null check (step_minutes > 0),
  step_km numeric(6,2) not null check (step_km > 0),
  max_km numeric(6,2) not null check (max_km >= start_km),
  pledge_timeout_minutes integer not null check (pledge_timeout_minutes > 0),
  batch_size integer not null default 50 check (batch_size > 0),
  updated_at timestamptz not null default now()
);
insert into public.escalation_policy
  (urgency, start_km, step_minutes, step_km, max_km, pledge_timeout_minutes)
values
  ('critical', 5, 10, 5, 30, 60),
  ('urgent', 5, 30, 5, 25, 120),
  ('planned', 10, 180, 10, 40, 360)
on conflict (urgency) do nothing;
alter table public.escalation_policy enable row level security;
revoke all on public.escalation_policy from public, anon, authenticated;

alter table public.blood_requests
  add column if not exists escalation_started_at timestamptz,
  add column if not exists current_escalation_tier integer not null default -1
    check (current_escalation_tier >= -1);
-- Existing open requests use the time they became active when available.
update public.blood_requests
set escalation_started_at = coalesce(escalation_started_at, updated_at, created_at)
where status = 'active' and escalation_started_at is null;

create table if not exists public.request_escalation_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  tier integer not null check (tier >= 0),
  radius_km numeric(6,2) not null,
  notified_count integer not null default 0 check (notified_count >= 0),
  created_at timestamptz not null default now(),
  unique (request_id, tier)
);
create index if not exists request_escalation_events_request_created_idx
  on public.request_escalation_events(request_id, created_at desc);
alter table public.request_escalation_events enable row level security;
revoke all on public.request_escalation_events from public, anon, authenticated;

-- Start the escalation clock exactly when a request becomes active.
create or replace function public.set_request_escalation_start()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    new.escalation_started_at := now();
    new.current_escalation_tier := -1;
  end if;
  return new;
end;
$$;
drop trigger if exists blood_request_escalation_start on public.blood_requests;
create trigger blood_request_escalation_start
  before insert or update of status on public.blood_requests
  for each row execute function public.set_request_escalation_start();
revoke all on function public.set_request_escalation_start() from public, anon, authenticated;

-- Runs from pg_cron (or a Supabase scheduled function) as service_role.
-- The function returns only aggregate work counts and never exposes donor rows.
create or replace function public.escalate_blood_requests()
returns integer
language plpgsql security definer
set search_path = public, extensions, pg_temp
as $$
declare
  req record;
  computed_tier integer;
  target_radius_km numeric(6,2);
  uncovered integer;
  inserted_count integer;
  total_events integer := 0;
begin
  for req in
    select r.id, r.urgency, r.blood_group, r.units_needed, r.hospital_location,
           r.escalation_started_at, r.current_escalation_tier, p.*
    from public.blood_requests r
    join public.escalation_policy p on p.urgency = r.urgency
    where r.status = 'active'
      and r.hospital_location is not null
      and coalesce(r.required_by, r.created_at + interval '48 hours') > now()
    order by r.created_at
    for update of r skip locked
  loop
    computed_tier := greatest(0, floor(extract(epoch from (now() - coalesce(req.escalation_started_at, req.created_at))) / 60 / req.step_minutes)::integer);
    computed_tier := least(computed_tier, floor((req.max_km - req.start_km) / req.step_km)::integer);
    if computed_tier <= req.current_escalation_tier then continue; end if;
    target_radius_km := least(req.max_km, req.start_km + req.step_km * computed_tier);

    select greatest(0, req.units_needed
      - coalesce((select sum(dr.units_donated)::integer
                  from public.donor_pledges dp
                  join public.donation_reports dr on dr.pledge_id = dp.id
                  where dp.request_id = req.id and dr.status = 'confirmed'), 0)
      - coalesce((select count(*)::integer
                  from public.donor_pledges dp
                  where dp.request_id = req.id
                    and dp.status in ('pledged', 'accepted')
                    and dp.created_at > now() - make_interval(mins => req.pledge_timeout_minutes)), 0))
      into uncovered;

    -- Leave the stored tier behind while covered. If pledges later lapse, the
    -- next run can still process the current computed radius and find new donors.
    if uncovered <= 0 then continue; end if;

    inserted_count := 0;
    if uncovered > 0 then
      with candidates as (
        select d.id, st_distance(d.location, req.hospital_location) as distance
        from public.profiles d
        where d.role = 'donor'
          and d.available_to_donate = true
          and d.availability_expires_at > now()
          and d.location is not null
          and d.blood_group = any(case req.blood_group
            when 'A+' then array['A+', 'A-', 'O+', 'O-']::text[]
            when 'A-' then array['A-', 'O-']::text[]
            when 'B+' then array['B+', 'B-', 'O+', 'O-']::text[]
            when 'B-' then array['B-', 'O-']::text[]
            when 'AB+' then array['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']::text[]
            when 'AB-' then array['A-', 'B-', 'AB-', 'O-']::text[]
            when 'O+' then array['O+', 'O-']::text[]
            when 'O-' then array['O-']::text[]
            else array[]::text[] end)
          and (d.last_donation_date is null or d.last_donation_date <= current_date - 90)
          and st_dwithin(d.location, req.hospital_location, target_radius_km * 1000)
          and not exists (select 1 from public.donor_notifications n
                          where n.request_id = req.id and n.donor_id = d.id)
          and (req.urgency = 'critical' or (
            select count(*) from public.donor_notifications recent
            where recent.donor_id = d.id and recent.created_at >= date_trunc('day', now())
          ) < 3)
        order by distance
        limit least(req.batch_size, uncovered)
      ), added as (
        insert into public.donor_notifications(donor_id, request_id)
        select id, req.id from candidates
        on conflict (donor_id, request_id) do nothing
        returning 1
      ) select count(*)::integer into inserted_count from added;
    end if;

    update public.blood_requests
    set current_escalation_tier = computed_tier
    where id = req.id;
    insert into public.request_escalation_events(request_id, tier, radius_km, notified_count)
    values (req.id, computed_tier, target_radius_km, inserted_count)
    on conflict (request_id, tier) do nothing;
    total_events := total_events + 1;
  end loop;
  return total_events;
end;
$$;
revoke all on function public.escalate_blood_requests() from public, anon, authenticated;
grant execute on function public.escalate_blood_requests() to service_role;

-- Install a one-minute job when pg_cron is already available in this Supabase project.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('lifelink-request-escalation')
      where exists (select 1 from cron.job where jobname = 'lifelink-request-escalation');
    perform cron.schedule('lifelink-request-escalation', '* * * * *',
      'select public.escalate_blood_requests()');
  end if;
end;
$$;

commit;
