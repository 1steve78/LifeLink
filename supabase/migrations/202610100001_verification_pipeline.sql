begin;

do $$ begin
  create type public.verification_gate as enum (
    'basic_validation', 'document_analysis', 'risk_screening', 'moderator_review'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_result_status as enum (
    'pending', 'passed', 'flagged', 'failed', 'error', 'approved', 'rejected'
  );
exception when duplicate_object then null;
end $$;

alter table public.blood_requests
  add column if not exists required_by timestamptz,
  add column if not exists supporting_document_path text,
  add column if not exists document_sha256 text;

create table if not exists public.request_verification_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete cascade,
  gate public.verification_gate not null,
  status public.verification_result_status not null,
  details jsonb not null default '{}'::jsonb,
  model text,
  performed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists request_verification_events_request_idx
  on public.request_verification_events(request_id, created_at);
create index if not exists request_verification_events_gate_status_idx
  on public.request_verification_events(gate, status);
alter table public.request_verification_events enable row level security;

-- Private evidence storage: users can only upload/read/delete files under their own UID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blood-request-documents',
  'blood-request-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Requesters upload their own blood request documents" on storage.objects;
create policy "Requesters upload their own blood request documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'blood-request-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Requesters read their own blood request documents" on storage.objects;
create policy "Requesters read their own blood request documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'blood-request-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Requesters remove their own blood request documents" on storage.objects;
create policy "Requesters remove their own blood request documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'blood-request-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public sign-up metadata must never grant the privileged moderator role.
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

commit;
