begin;

-- Profile rows contain contact and approximate donor-location data. Keep direct
-- Supabase reads owner-scoped; trusted server routes perform role-checked matching.
alter table public.profiles enable row level security;
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Profile reads are owner-restricted" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Restrictive policies are ANDed with permissive ones, so an older/custom
-- permissive policy cannot make another user's profile visible.
create policy "Profile reads are owner-restricted"
  on public.profiles as restrictive for select
  to authenticated
  using (auth.uid() = id);

commit;
