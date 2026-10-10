-- Add this enum value in its own migration because PostgreSQL requires a
-- transaction boundary before the new value can be used in SQL statements.
alter type public.request_status add value if not exists 'expired';
