-- VOTEI — anonymous, single-purchase orders.
--
-- An order holds the voter's declared ballot number and a pointer to their
-- photo. Both are sensitive personal data under the LGPD (political opinion +
-- biometric-adjacent image), so `spec` and `photo_key` are nulled out by the
-- purge job once the order's TTL passes. The billing row survives; the opinion
-- does not.

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'paid', 'delivered', 'expired')),
  amount_cents  integer not null check (amount_cents > 0),
  txid          text not null unique,
  spec          jsonb,
  photo_key     text,
  created_at    timestamptz not null default now(),
  -- When the Pix charge stops being payable.
  expires_at    timestamptz not null,
  -- When the photo and spec are erased. Longer than expires_at: a buyer who
  -- paid can still come back for the file after the charge window closed.
  purge_after   timestamptz not null,
  delivered_at  timestamptz
);

create index if not exists orders_user_id_created_at_idx
  on public.orders (user_id, created_at desc);

-- Drives the purge job: only rows that still carry something to erase.
create index if not exists orders_purgeable_idx
  on public.orders (purge_after)
  where spec is not null or photo_key is not null;

alter table public.orders enable row level security;

-- The app never queries orders from the browser; every write goes through the
-- service role. This policy is the backstop if the anon key is ever used
-- directly: a visitor can read their own orders and nothing else.
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Private bucket. No storage policies are created, so only the service role
-- can read or write: the uploaded photo is never addressable from a browser.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'votei-photos',
  'votei-photos',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
