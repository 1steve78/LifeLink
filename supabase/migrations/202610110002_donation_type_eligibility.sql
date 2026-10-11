begin;

create type public.donation_type as enum (
  'whole_blood',
  'single_platelet_apheresis',
  'double_platelet_apheresis'
);

-- Keep the interval rule set editable. Whole-blood eligibility uses the
-- conservative 120-day interval for every donor until sex-specific data and
-- product policy are explicitly established by the operating blood centre.
create table public.eligibility_rules (
  id bigint generated always as identity primary key,
  previous_type public.donation_type not null,
  requested_type public.donation_type not null,
  minimum_interval interval not null,
  red_cell_reinfusion boolean,
  rule_note text not null,
  updated_at timestamptz not null default now(),
  constraint eligibility_rules_interval_positive check (minimum_interval > interval '0')
);
insert into public.eligibility_rules
  (previous_type, requested_type, minimum_interval, red_cell_reinfusion, rule_note)
values
  ('whole_blood', 'whole_blood', interval '120 days', null, 'Conservative whole-blood interval; current Indian guidance specifies 90 days for males and 120 days for females.'),
  ('whole_blood', 'single_platelet_apheresis', interval '28 days', null, '2025 Indian donor selection guidance.'),
  ('whole_blood', 'double_platelet_apheresis', interval '28 days', null, '2025 Indian donor selection guidance.'),
  ('single_platelet_apheresis', 'whole_blood', interval '7 days', true, '2025 Indian donor selection guidance; after complete red-cell reinfusion.'),
  ('single_platelet_apheresis', 'whole_blood', interval '90 days', false, 'After incomplete red-cell reinfusion.'),
  ('double_platelet_apheresis', 'whole_blood', interval '7 days', true, '2025 Indian donor selection guidance; after complete red-cell reinfusion.'),
  ('double_platelet_apheresis', 'whole_blood', interval '90 days', false, 'After incomplete red-cell reinfusion.'),
  ('single_platelet_apheresis', 'single_platelet_apheresis', interval '48 hours', null, 'Minimum single-apheresis interval.'),
  ('single_platelet_apheresis', 'double_platelet_apheresis', interval '7 days', null, 'Conservative interval before a double plateletpheresis.'),
  ('double_platelet_apheresis', 'single_platelet_apheresis', interval '7 days', null, 'Conservative interval after a double plateletpheresis.'),
  ('double_platelet_apheresis', 'double_platelet_apheresis', interval '7 days', null, 'Minimum double plateletpheresis interval.');
alter table public.eligibility_rules enable row level security;
revoke all on public.eligibility_rules from public, anon, authenticated;

alter table public.profiles
  add column last_whole_blood_at timestamptz,
  add column last_whole_blood_source text check (last_whole_blood_source in ('self_reported', 'confirmed')),
  add column last_apheresis_at timestamptz,
  add column last_apheresis_type public.donation_type,
  add column last_apheresis_red_cells_reinfused boolean,
  add column last_apheresis_source text check (last_apheresis_source in ('self_reported', 'confirmed'));
comment on column public.profiles.last_whole_blood_at is 'Last known whole-blood donation; self-reported until a confirmed report replaces it.';
comment on column public.profiles.last_apheresis_at is 'Last known apheresis donation; self-reported until a confirmed report replaces it.';

-- The previous generic date field did not capture donation type. Treat legacy
-- dates as self-reported whole blood and use the conservative whole-blood rule.
update public.profiles
set last_whole_blood_at = last_donation_date::timestamptz,
    last_whole_blood_source = 'self_reported'
where last_donation_date is not null;

create or replace function public.sync_self_reported_whole_blood_date()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if new.last_donation_date is distinct from old.last_donation_date
      and new.last_donation_date is not null
      and (new.last_whole_blood_at is null or new.last_whole_blood_source = 'self_reported') then
    new.last_whole_blood_at := new.last_donation_date::timestamptz;
    new.last_whole_blood_source := 'self_reported';
  elsif new.last_donation_date is distinct from old.last_donation_date
      and new.last_donation_date is null and new.last_whole_blood_source = 'self_reported' then
    new.last_whole_blood_at := null;
    new.last_whole_blood_source := null;
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_sync_self_reported_whole_blood_date on public.profiles;
create trigger profiles_sync_self_reported_whole_blood_date
  before insert or update of last_donation_date on public.profiles
  for each row execute function public.sync_self_reported_whole_blood_date();
revoke all on function public.sync_self_reported_whole_blood_date() from public, anon, authenticated;

alter table public.blood_requests
  add column donation_type public.donation_type not null default 'whole_blood';
alter table public.donation_reports
  add column donation_type public.donation_type not null default 'whole_blood',
  add column donation_date date,
  add column red_cells_reinfused boolean;
update public.donation_reports set donation_date = reported_at::date where donation_date is null;
alter table public.donation_reports alter column donation_date set default current_date;
alter table public.donation_reports alter column donation_date set not null;
alter table public.donation_reports
  add constraint donation_reports_apheresis_reinfusion_check
  check (donation_type = 'whole_blood' or red_cells_reinfused is not null);

-- Existing confirmed reports were generic; conservatively treat them as whole blood.
with latest_confirmed as (
  select distinct on (dp.donor_id) dp.donor_id, dr.donation_date
  from public.donation_reports dr
  join public.donor_pledges dp on dp.id = dr.pledge_id
  where dr.status = 'confirmed' and dr.donation_type = 'whole_blood'
  order by dp.donor_id, dr.donation_date desc
)
update public.profiles p set
  last_whole_blood_at = greatest(coalesce(p.last_whole_blood_at, '-infinity'::timestamptz), lc.donation_date::timestamptz),
  last_whole_blood_source = 'confirmed'
from latest_confirmed lc
where p.id = lc.donor_id
  and (p.last_whole_blood_at is null or lc.donation_date::timestamptz >= p.last_whole_blood_at);

create or replace function public.next_eligible_at(target_donor_id uuid, target_type public.donation_type)
returns timestamptz
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
  donor public.profiles%rowtype;
  next_at timestamptz;
  rule_interval interval;
begin
  select * into donor from public.profiles where id = target_donor_id and role = 'donor';
  if not found then return null; end if;

  if donor.last_whole_blood_at is not null then
    select minimum_interval into rule_interval
    from public.eligibility_rules
    where previous_type = 'whole_blood' and requested_type = target_type
      and red_cell_reinfusion is null;
    if found then next_at := donor.last_whole_blood_at + rule_interval; end if;
  end if;

  if donor.last_apheresis_at is not null and donor.last_apheresis_type is not null then
    select minimum_interval into rule_interval
    from public.eligibility_rules
    where previous_type = donor.last_apheresis_type and requested_type = target_type
      and (red_cell_reinfusion is null or donor.last_apheresis_red_cells_reinfused is null
           or red_cell_reinfusion = donor.last_apheresis_red_cells_reinfused)
    order by minimum_interval desc
    limit 1;
    if found then next_at := greatest(coalesce(next_at, '-infinity'::timestamptz), donor.last_apheresis_at + rule_interval); end if;
  end if;
  return next_at;
end;
$$;
revoke all on function public.next_eligible_at(uuid, public.donation_type) from public, anon, authenticated;
grant execute on function public.next_eligible_at(uuid, public.donation_type) to service_role;

create or replace function public.update_confirmed_donation_eligibility()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare donor uuid; donation_kind public.donation_type; donation_day date; reinfused boolean;
begin
  if new.status <> 'confirmed' or (tg_op = 'UPDATE' and old.status = 'confirmed') then return new; end if;
  select donor_id into donor from public.donor_pledges where id = new.pledge_id;
  donation_kind := new.donation_type;
  donation_day := new.donation_date;
  reinfused := new.red_cells_reinfused;
  if donation_kind = 'whole_blood' then
    update public.profiles set
      last_whole_blood_at = greatest(coalesce(last_whole_blood_at, '-infinity'::timestamptz), donation_day::timestamptz),
      last_whole_blood_source = case when last_whole_blood_at is null or donation_day::timestamptz >= last_whole_blood_at then 'confirmed' else last_whole_blood_source end,
      updated_at = now()
    where id = donor;
  else
    update public.profiles set
      last_apheresis_at = greatest(coalesce(last_apheresis_at, '-infinity'::timestamptz), donation_day::timestamptz),
      last_apheresis_type = donation_kind,
      last_apheresis_red_cells_reinfused = reinfused,
      last_apheresis_source = 'confirmed', updated_at = now()
    where id = donor;
  end if;
  return new;
end;
$$;
drop trigger if exists donation_reports_update_eligibility on public.donation_reports;
create trigger donation_reports_update_eligibility
  after insert or update of status on public.donation_reports
  for each row execute function public.update_confirmed_donation_eligibility();
revoke all on function public.update_confirmed_donation_eligibility() from public, anon, authenticated;

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
    and p.available_to_donate = true and p.availability_expires_at > now()
    and p.blood_group = any(case r.blood_group
      when 'A+' then array['A+', 'A-', 'O+', 'O-']::text[]
      when 'A-' then array['A-', 'O-']::text[]
      when 'B+' then array['B+', 'B-', 'O+', 'O-']::text[]
      when 'B-' then array['B-', 'O-']::text[]
      when 'AB+' then array['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']::text[]
      when 'AB-' then array['A-', 'B-', 'AB-', 'O-']::text[]
      when 'O+' then array['O+', 'O-']::text[]
      when 'O-' then array['O-']::text[]
      else array[]::text[] end)
    and (public.next_eligible_at(p.id, r.donation_type) is null
      or public.next_eligible_at(p.id, r.donation_type) <= now())
    and st_dwithin(p.location, r.hospital_location, case r.urgency when 'critical' then 15000 when 'urgent' then 8000 else 5000 end)
  order by st_distance(p.location, r.hospital_location);
$$;
revoke all on function public.find_eligible_donors(uuid) from public, anon, authenticated;
grant execute on function public.find_eligible_donors(uuid) to service_role;

commit;
