# Auth Guidelines

## Provider
Supabase Auth — magic link (OTP) by default.

## Session Management
- `src/proxy.ts` — refreshes sessions on every request via cookie exchange (Next.js proxy, formerly middleware)
- `src/infrastructure/database/server.ts` — SSR client reads/writes cookies
- `src/infrastructure/database/auth-session.ts` — `getCurrentUser()` / `getCurrentUserOrNull()`

## Usage

**Protected API route:**
```typescript
const user = await getCurrentUser(); // throws UnauthorizedError if not signed in
```

**Protected page (layout):**
```typescript
const user = await getCurrentUserOrNull();
if (!user) redirect('/auth/sign-in');
```

**Sign-in flow:**
1. User submits email → `supabase.auth.signInWithOtp()`
2. Email link → `/auth/callback?code=...`
3. `exchangeCodeForSession(code)` → redirect to `/dashboard`

## Adding OAuth
```typescript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${origin}/auth/callback` },
});
```

## Row Level Security
Enable RLS on all tables. Default policy: users can only access their own rows.

```sql
alter table your_table enable row level security;
create policy "users own data" on your_table
  for all using (auth.uid() = user_id);
```

---

## Two authorization axes — do not conflate them

Authentication answers *who*. Authorization here has **two independent axes**, and a role from one can never answer a question from the other.

| Axis | Question it answers | Where it lives |
|------|--------------------|----------------|
| **Tenant / account** | What may this user do *inside their own account*? | Whatever per-account role model the product adds (owner, member, permissions) |
| **Platform operator** | May this user see *across* accounts — internal tooling, support screens, cross-tenant reports? | `public.platform_admins` + `public.is_admin()` |

**The failure this prevents:** gating a cross-tenant screen on a tenant role such as `role_name = 'Account Owner'`. Every customer owns their own account, so every customer passes that gate, and the screen leaks other tenants' data. The check *looks* restrictive and is effectively `true`.

### Using the platform gate

```typescript
// Route handler or server component
const operator = await requirePlatformAdmin(); // 401 no session, 403 not an operator
```

`requirePlatformAdmin()` lives in `src/infrastructure/database/platform-admin-session.ts` and composes `getCurrentUser()` with `AssertPlatformAdminService`. Use `isCurrentUserPlatformAdmin()` when a page renders a different view per role instead of refusing.

Worked example: `src/app/api/v1/admin/whoami/route.ts`.

### The database half

The migration is `supabase/migrations/20260827000000_platform_admin.sql`.

- `platform_admins` is **empty by default** — fail-closed. Nobody is an operator until a row exists.
- Seed the first operator **out-of-band by `user_id`**, in its own migration. Never by email lookup inside the migration (the insert silently matches nothing if the account does not exist yet, and the migration still reports success), and never through a self-service flow.
- The policy on `platform_admins` itself reads `auth.uid()` directly and **must not** call `is_admin()`: that function selects from the same table, so the policy would recurse into itself (Postgres `42P17`).
- Every other admin-only or cross-tenant table gates on the function:

```sql
revoke all on public.some_table from anon, authenticated;
grant  select on public.some_table to authenticated;

create policy some_table_admin_reads
  on public.some_table for select to authenticated
  using ((select public.is_admin()));
```

Three details in those four lines, each of which silently breaks the gate if dropped:

1. **The `revoke`/`grant` pair is not optional.** RLS answers "which rows"; `GRANT` answers "may this role touch the table at all". A policy with no grant is never evaluated — the request fails with `42501` instead. And on stacks where new tables still arrive with full privileges for `anon`/`authenticated`, writing no grant hands over everything rather than withholding it.
2. **`(select public.is_admin())`, not `public.is_admin()`.** The wrapper makes it an InitPlan: evaluated once per query instead of once per row.
3. **Read on the session client** (`infrastructure/database/server.ts`), never the service-role client (`admin.ts`). Service-role bypasses RLS, so the policy never runs and the application check becomes the entire authorization. Gate in the app *and* policy in the database is two layers; policy plus service-role is zero.
