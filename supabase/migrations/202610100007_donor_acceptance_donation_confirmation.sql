begin;

alter table public.donor_pledges
  drop constraint if exists donor_pledges_status_check;
alter table public.donor_pledges
  add constraint donor_pledges_status_check
  check (status in ('pledged', 'accepted', 'confirmed', 'completed', 'withdrawn'));

alter table public.request_tracker_events
  drop constraint if exists request_tracker_events_event_type_check;
alter table public.request_tracker_events
  drop constraint if exists request_tracker_event_type_check;
alter table public.request_tracker_events
  add constraint request_tracker_event_type_check
  check (event_type in (
    'request_submitted', 'request_under_review', 'request_activated', 'request_rejected',
    'request_cancelled', 'request_fulfilled', 'request_information_needed',
    'donor_pledged', 'donor_accepted', 'donor_confirmed', 'donor_withdrew',
    'donor_donation_reported', 'donor_donation_confirmed'
  ));

create table if not exists public.donation_reports (
  id uuid primary key default gen_random_uuid(),
  pledge_id uuid not null unique references public.donor_pledges(id) on delete cascade,
  units_donated integer not null check (units_donated between 1 and 10),
  status text not null default 'reported' check (status in ('reported', 'confirmed')),
  reported_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  constraint donation_reports_confirmation_check check (
    (status = 'reported' and confirmed_at is null and confirmed_by is null)
    or (status = 'confirmed' and confirmed_at is not null and confirmed_by is not null)
  )
);
create index if not exists donation_reports_status_reported_idx
  on public.donation_reports(status, reported_at);
alter table public.donation_reports enable row level security;
revoke all on public.donation_reports from anon, authenticated;

create or replace function public.log_request_tracker_pledge()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  event_name text;
  current_status public.request_status;
  current_pledges integer;
  current_confirmed integer;
begin
  if tg_op = 'INSERT' then
    event_name := 'donor_pledged';
  elsif old.status is distinct from new.status then
    event_name := case new.status
      when 'pledged' then 'donor_pledged'
      when 'accepted' then 'donor_accepted'
      when 'confirmed' then 'donor_confirmed'
      when 'withdrawn' then 'donor_withdrew'
      else null
    end;
  else
    return new;
  end if;
  if event_name is null then return new; end if;

  select status into current_status from public.blood_requests where id = new.request_id;
  select count(*) filter (where status in ('pledged', 'accepted', 'confirmed', 'completed'))::integer,
         count(*) filter (where status in ('confirmed', 'completed'))::integer
    into current_pledges, current_confirmed
  from public.donor_pledges where request_id = new.request_id;

  insert into public.request_tracker_events(request_id, event_type, request_status, pledge_count, confirmed_count)
  values (new.request_id, event_name, current_status, coalesce(current_pledges, 0), coalesce(current_confirmed, 0));
  return new;
end;
$$;
revoke all on function public.log_request_tracker_pledge() from public, anon, authenticated;

create or replace function public.log_request_tracker_donation()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  event_name text;
  target_request_id uuid;
  current_status public.request_status;
  current_pledges integer;
  current_confirmed integer;
begin
  if tg_op = 'INSERT' then
    event_name := 'donor_donation_reported';
  elsif old.status is distinct from new.status and new.status = 'confirmed' then
    event_name := 'donor_donation_confirmed';
  else
    return new;
  end if;

  select request_id into target_request_id
  from public.donor_pledges where id = new.pledge_id;
  select status into current_status from public.blood_requests where id = target_request_id;
  select count(*) filter (where status in ('pledged', 'accepted', 'confirmed', 'completed'))::integer,
         count(*) filter (where status in ('confirmed', 'completed'))::integer
    into current_pledges, current_confirmed
  from public.donor_pledges where request_id = target_request_id;

  insert into public.request_tracker_events(request_id, event_type, request_status, pledge_count, confirmed_count)
  values (target_request_id, event_name, current_status, coalesce(current_pledges, 0), coalesce(current_confirmed, 0));
  return new;
end;
$$;
revoke all on function public.log_request_tracker_donation() from public, anon, authenticated;

drop trigger if exists request_tracker_pledge_event on public.donor_pledges;
create trigger request_tracker_pledge_event
  after insert or update of status on public.donor_pledges
  for each row execute function public.log_request_tracker_pledge();
drop trigger if exists request_tracker_donation_event on public.donation_reports;
create trigger request_tracker_donation_event
  after insert or update of status on public.donation_reports
  for each row execute function public.log_request_tracker_donation();

commit;
