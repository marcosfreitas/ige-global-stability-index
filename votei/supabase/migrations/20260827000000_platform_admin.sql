-- Platform super-admin: the operator of the software, above every tenant.
--
-- This is a SEPARATE axis from any per-tenant/per-account role the product may
-- add later. A tenant role ("account owner", "member") answers "what may this
-- user do inside their own account". It can never answer "is this user allowed
-- to see across accounts" — every customer owns their own account, so gating a
-- cross-tenant screen on a tenant role lets every customer through.
--
-- Empty by default: fail-closed. Seed the first super-admin out-of-band by
-- user_id (see the note at the bottom). There is deliberately no self-service
-- path into this table.

create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.platform_admins is
  'Platform operators. Separate axis from tenant roles; empty means nobody.';

alter table public.platform_admins enable row level security;

-- Policy on this table reads auth.uid() DIRECTLY and never calls is_admin():
-- is_admin() selects from this same table, so using it here would make the
-- policy recurse into itself (Postgres 42P17, "infinite recursion detected in
-- policy for relation").
--
-- The (select ...) wrapper turns the call into an InitPlan: evaluated once per
-- query instead of once per row.
drop policy if exists platform_admins_read_own on public.platform_admins;
create policy platform_admins_read_own
  on public.platform_admins
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Writes are intentionally unreachable from anon/authenticated: no insert,
-- update or delete policy exists, and the grants below withhold the privilege
-- as well. Membership changes go through a migration or a service-role script.

-- RLS answers "which rows"; GRANT answers "may this role touch the table at
-- all". A policy without the grant is never evaluated. The revoke is a no-op on
-- stacks where new tables already arrive locked down, and is the entire lock on
-- stacks where they still arrive with full privileges for anon/authenticated —
-- which is not knowable from the CLI version, so write both lines.
revoke all on public.platform_admins from anon, authenticated;
grant select on public.platform_admins to authenticated;

-- is_admin(): the platform gate, for use inside other tables' policies.
--
-- SECURITY DEFINER because the caller is generally NOT allowed to read
-- platform_admins rows other than their own (see the policy above) — the
-- function has to see the whole table to answer the question.
-- STABLE so Postgres may cache it within a statement.
-- SET search_path pins name resolution so a caller-controlled search_path
-- cannot swap out the table this function reads.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where user_id = (select auth.uid())
  );
$$;

comment on function public.is_admin() is
  'True when the current session belongs to a platform operator. Fail-closed: '
  'returns false for anon and for any user absent from platform_admins.';

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Using it on an admin-only or cross-tenant table
-- ---------------------------------------------------------------------------
--
--   revoke all on public.some_table from anon, authenticated;
--   grant  select on public.some_table to authenticated;
--
--   create policy some_table_admin_reads
--     on public.some_table
--     for select
--     to authenticated
--     using ((select public.is_admin()));
--
-- The read MUST run on the session-scoped client (infrastructure/database/
-- server.ts). A service-role client bypasses RLS entirely, so pairing this
-- policy with the admin client leaves the application check as the ONLY
-- authorization and the policy never runs at all.
--
-- ---------------------------------------------------------------------------
-- Seeding the first super-admin
-- ---------------------------------------------------------------------------
--
-- Out-of-band, by user_id, so the statement is deterministic and reviewable.
-- Look the id up first, then write it into its own migration:
--
--   select id, email from auth.users where email = 'operator@example.com';
--
--   insert into public.platform_admins (user_id, note)
--   values ('00000000-0000-0000-0000-000000000000', 'founding operator')
--   on conflict (user_id) do nothing;
--
-- Do not seed by email lookup inside the migration: the row silently does not
-- appear if the account has not been created yet, and the migration still
-- reports success.
