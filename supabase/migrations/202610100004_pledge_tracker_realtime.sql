begin;

alter table public.donor_pledges
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists donor_pledges_request_donor_unique_idx
  on public.donor_pledges(request_id, donor_id);

create table if not exists public.request_tracker_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  event_type text not null check (event_type in (
    'request_submitted', 'request_under_review', 'request_activated', 'request_rejected',
    'request_cancelled', 'request_fulfilled', 'donor_pledged', 'donor_confirmed', 'donor_withdrew'
  )),
  request_status public.request_status not null,
  pledge_count integer not null default 0 check (pledge_count >= 0),
  confirmed_count integer not null default 0 check (confirmed_count >= 0),
  created_at timestamptz not null default now()
);
create index if not exists request_tracker_events_request_created_idx
  on public.request_tracker_events(request_id, created_at);
alter table public.request_tracker_events enable row level security;

create or replace function public.can_read_request_tracker(target_request_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.blood_requests r
    where r.id = target_request_id and r.requester_id = auth.uid()
  );
$$;
revoke all on function public.can_read_request_tracker(uuid) from public, anon;
grant execute on function public.can_read_request_tracker(uuid) to authenticated;

drop policy if exists "Requesters read their own tracker events" on public.request_tracker_events;
create policy "Requesters read their own tracker events"
  on public.request_tracker_events for select to authenticated
  using (public.can_read_request_tracker(request_id));
revoke all on public.request_tracker_events from anon, authenticated;
grant select on public.request_tracker_events to authenticated;

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
      else null
    end;
  else
    return new;
  end if;

  select count(*) filter (where status in ('pledged', 'confirmed'))::integer,
         count(*) filter (where status = 'confirmed')::integer
    into current_pledges, current_confirmed
  from public.donor_pledges where request_id = new.id;

  insert into public.request_tracker_events(request_id, event_type, request_status, pledge_count, confirmed_count)
  values (new.id, event_name, new.status, coalesce(current_pledges, 0), coalesce(current_confirmed, 0));
  return new;
end;
$$;

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
      when 'confirmed' then 'donor_confirmed'
      when 'withdrawn' then 'donor_withdrew'
      else null
    end;
  else
    return new;
  end if;
  if event_name is null then return new; end if;

  select status into current_status from public.blood_requests where id = new.request_id;
  select count(*) filter (where status in ('pledged', 'confirmed'))::integer,
         count(*) filter (where status = 'confirmed')::integer
    into current_pledges, current_confirmed
  from public.donor_pledges where request_id = new.request_id;

  insert into public.request_tracker_events(request_id, event_type, request_status, pledge_count, confirmed_count)
  values (new.request_id, event_name, current_status, coalesce(current_pledges, 0), coalesce(current_confirmed, 0));
  return new;
end;
$$;

revoke all on function public.log_request_tracker_status() from public, anon, authenticated;
revoke all on function public.log_request_tracker_pledge() from public, anon, authenticated;

drop trigger if exists request_tracker_status_event on public.blood_requests;
create trigger request_tracker_status_event
  after insert or update of status on public.blood_requests
  for each row execute function public.log_request_tracker_status();

drop trigger if exists request_tracker_pledge_event on public.donor_pledges;
create trigger request_tracker_pledge_event
  after insert or update of status on public.donor_pledges
  for each row execute function public.log_request_tracker_pledge();

insert into public.request_tracker_events(request_id, event_type, request_status, pledge_count, confirmed_count)
select r.id, 'request_activated', r.status,
       count(p.id) filter (where p.status in ('pledged', 'confirmed'))::integer,
       count(p.id) filter (where p.status = 'confirmed')::integer
from public.blood_requests r
left join public.donor_pledges p on p.request_id = r.id
where r.status = 'active'
  and not exists (
    select 1 from public.request_tracker_events e
    where e.request_id = r.id and e.event_type = 'request_activated'
  )
group by r.id, r.status;

do $$ begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Supabase Realtime publication is unavailable';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'request_tracker_events'
  ) then
    alter publication supabase_realtime add table public.request_tracker_events;
  end if;
end $$;

commit;
