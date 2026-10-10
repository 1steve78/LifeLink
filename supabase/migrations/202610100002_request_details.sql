begin;

alter table public.blood_requests
  alter column patient_name drop not null,
  add column if not exists patient_reference text,
  add column if not exists patient_age integer,
  add column if not exists contact_person_name text,
  add column if not exists contact_phone text,
  add column if not exists hospital_address text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'blood_requests_patient_age_check'
  ) then
    alter table public.blood_requests
      add constraint blood_requests_patient_age_check
      check (patient_age is null or patient_age between 0 and 120);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'blood_requests_patient_identity_check'
  ) then
    alter table public.blood_requests
      add constraint blood_requests_patient_identity_check
      check (nullif(btrim(patient_name), '') is not null or nullif(btrim(patient_reference), '') is not null);
  end if;
end $$;

commit;
