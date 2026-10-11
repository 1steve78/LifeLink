-- DRAFT: Review environment and confirm this is staging before applying.
-- This migration is additive. The existing one-minute escalation job continues
-- to use public.escalation_policy until its function is updated to consume the
-- new per-type policy and donor_capabilities.

begin;

create type public.donor_capability_type as enum (
  'whole_blood',
  'platelets',
  'stem_cell'
);

create type public.donor_capability_status as enum (
  'active',
  'withdrawn'
);

create type public.escalation_reach_mode as enum (
  'radius',
  'regional',
  'national'
);

-- A separate consent row is required for each type. Withdrawal retains the
-- consent history while making the capability ineligible for new notifications.
create table public.donor_capabilities (
  donor_id uuid not null references public.profiles(id) on delete cascade,
  donation_type public.donor_capability_type not null,
  status public.donor_capability_status not null default 'active',
  consented_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (donor_id, donation_type),
  constraint donor_capabilities_status_dates_check check (
    (status = 'active' and withdrawn_at is null)
    or (status = 'withdrawn' and withdrawn_at is not null)
  )
);
create index donor_capabilities_active_type_idx
  on public.donor_capabilities(donation_type, donor_id)
  where status = 'active';
alter table public.donor_capabilities enable row level security;
revoke all on public.donor_capabilities from public, anon, authenticated;
comment on table public.donor_capabilities is
  'Explicit, independently withdrawable donor consent for whole blood, platelet, or stem-cell registry outreach.';

-- New policy for the next escalation-function revision. Keeping this as a
-- separate table means the currently scheduled function cannot accidentally
-- fan each active request out across every donation type during rollout.
create table public.escalation_policy_by_type (
  urgency public.request_urgency not null,
  donation_type public.donor_capability_type not null,
  reach_mode public.escalation_reach_mode not null,
  start_km numeric(6,2),
  step_minutes integer,
  step_km numeric(6,2),
  max_km numeric(6,2),
  pledge_timeout_minutes integer,
  daily_notification_cap integer not null,
  updated_at timestamptz not null default now(),
  primary key (urgency, donation_type),
  constraint escalation_policy_by_type_reach_check check (
    (reach_mode = 'radius'
      and start_km is not null and start_km > 0
      and step_minutes is not null and step_minutes > 0
      and step_km is not null and step_km > 0
      and max_km is not null and max_km >= start_km
      and pledge_timeout_minutes is not null and pledge_timeout_minutes > 0)
    or
    (reach_mode in ('regional', 'national')
      and start_km is null and step_minutes is null and step_km is null
      and max_km is null and pledge_timeout_minutes is null)
  ),
  constraint escalation_policy_by_type_daily_cap_check check (daily_notification_cap > 0)
);
alter table public.escalation_policy_by_type enable row level security;
revoke all on public.escalation_policy_by_type from public, anon, authenticated;
comment on table public.escalation_policy_by_type is
  'Per-urgency, per-capability escalation configuration. Stem-cell reach is registry-region based, not a distance match.';

insert into public.escalation_policy_by_type
  (urgency, donation_type, reach_mode, start_km, step_minutes, step_km, max_km,
   pledge_timeout_minutes, daily_notification_cap)
values
  ('critical', 'whole_blood', 'radius', 5, 10, 5, 30, 60, 3),
  ('urgent',   'whole_blood', 'radius', 5, 30, 5, 25, 120, 3),
  ('planned',  'whole_blood', 'radius', 5, 180, 5, 30, 360, 3),

  ('critical', 'platelets', 'radius', 15, 10, 15, 80, 60, 3),
  ('urgent',   'platelets', 'radius', 15, 30, 15, 60, 120, 3),
  ('planned',  'platelets', 'radius', 15, 180, 15, 60, 360, 3),

  ('critical', 'stem_cell', 'regional', null, null, null, null, null, 1),
  ('urgent',   'stem_cell', 'regional', null, null, null, null, null, 1),
  ('planned',  'stem_cell', 'regional', null, null, null, null, null, 1)
on conflict (urgency, donation_type) do nothing;

commit;
