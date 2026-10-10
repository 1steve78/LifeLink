begin;

alter table public.blood_requests
  add column if not exists review_state text not null default 'open',
  add column if not exists review_revision integer not null default 0;
alter table public.blood_requests
  drop constraint if exists blood_requests_review_state_check;
alter table public.blood_requests
  add constraint blood_requests_review_state_check
  check (review_state in ('open', 'needs_information'));
alter table public.blood_requests
  drop constraint if exists blood_requests_review_revision_check;
alter table public.blood_requests
  add constraint blood_requests_review_revision_check check (review_revision >= 0);

alter table public.request_tracker_events
  drop constraint if exists request_tracker_events_event_type_check;
alter table public.request_tracker_events
  add constraint request_tracker_events_event_type_check
  check (event_type in (
    'request_submitted', 'request_under_review', 'request_activated', 'request_rejected',
    'request_cancelled', 'request_fulfilled', 'request_information_needed',
    'donor_pledged', 'donor_confirmed', 'donor_withdrew'
  ));

create table if not exists public.moderation_audit_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id),
  moderator_id uuid not null references public.profiles(id),
  action text not null check (action in ('approve', 'reject', 'request_information')),
  previous_status public.request_status not null,
  new_status public.request_status not null,
  reason text not null check (length(btrim(reason)) >= 5),
  created_at timestamptz not null default now()
);
create index if not exists moderation_audit_events_request_created_idx
  on public.moderation_audit_events(request_id, created_at desc);

create table if not exists public.requester_information_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id),
  requester_id uuid not null references public.profiles(id),
  message text not null check (length(btrim(message)) between 5 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists requester_information_responses_request_created_idx
  on public.requester_information_responses(request_id, created_at desc);
alter table public.requester_information_responses enable row level security;
revoke all on public.requester_information_responses from anon, authenticated;

create or replace function public.prevent_requester_response_mutation()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Requester information responses are append-only';
end;
$$;
drop trigger if exists requester_information_responses_append_only on public.requester_information_responses;
create trigger requester_information_responses_append_only
  before update or delete on public.requester_information_responses
  for each row execute function public.prevent_requester_response_mutation();
revoke all on function public.prevent_requester_response_mutation() from public, anon, authenticated;

alter table public.moderation_audit_events enable row level security;
revoke all on public.moderation_audit_events from anon, authenticated;

create or replace function public.prevent_moderation_audit_mutation()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Moderation audit events are append-only';
end;
$$;
drop trigger if exists moderation_audit_events_append_only on public.moderation_audit_events;
create trigger moderation_audit_events_append_only
  before update or delete on public.moderation_audit_events
  for each row execute function public.prevent_moderation_audit_mutation();
revoke all on function public.prevent_moderation_audit_mutation() from public, anon, authenticated;

commit;
