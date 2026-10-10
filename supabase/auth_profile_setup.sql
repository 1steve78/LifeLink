-- 1. Enable RLS Policies on profiles
alter table public.profiles enable row level security;

-- Drop existing policies if any
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Profile reads are owner-restricted" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Profile rows contain donor contact/location data; users may only read their own.
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- A restrictive predicate also constrains any other permissive SELECT policy
-- that may have been added manually in an existing project.
create policy "Profile reads are owner-restricted"
  on public.profiles as restrictive for select
  to authenticated
  using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS policies cannot restrict individual columns; prevent a user from changing their own role.
create or replace function public.prevent_profile_role_escalation()
returns trigger as $$
begin
  if auth.uid() = old.id and new.role is distinct from old.role then
    raise exception 'Profile role changes require an administrative action';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_profile_role_escalation();

-- 2. Automatic Profile Creation Trigger on auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, blood_group, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.raw_user_meta_data->>'role' in ('requester', 'donor')
        then (new.raw_user_meta_data->>'role')::public.user_role
      else 'requester'::public.user_role
    end,
    nullif(new.raw_user_meta_data->>'blood_group', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = coalesce(excluded.role, profiles.role),
    blood_group = coalesce(excluded.blood_group, profiles.blood_group),
    phone = coalesce(excluded.phone, profiles.phone);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
