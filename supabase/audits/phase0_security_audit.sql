-- Read-only Phase 0 checks. Run each statement in the Supabase SQL Editor.
-- This checks database configuration, not application-level authorization; also
-- exercise the routes with requester, donor, moderator, and unrelated accounts.

-- 1) PostGIS availability and version.
select postgis_version() as postgis_version;

-- 2) Every public table should have RLS enabled.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 3) Review all public schema policies (an enabled RLS table with no policy
-- denies client roles; broad policies deserve particular scrutiny).
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 4) Supporting documents must remain in a private bucket with the expected
-- size and MIME restrictions.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'blood-request-documents';

-- 5) Review all object policies for the private document bucket.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- 6) Tracker events should be in the Realtime publication.
select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by schemaname, tablename;

-- 7) Profile reads must be owner-scoped. After migration 006, this should show
-- both the owner SELECT policy and the restrictive owner predicate. The latter
-- also limits any manually-added permissive SELECT policy.
select policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
  and cmd = 'SELECT'
order by policyname;
