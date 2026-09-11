-- Wheeler Dealer — initial schema + RLS
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

-- ============================================================
-- Tables
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  location text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year int not null check (year between 1950 and 2100),
  price numeric not null check (price >= 0),
  mileage int not null check (mileage >= 0),
  location text not null,
  color text,
  description text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'active', 'sold', 'removed')),
  search_text tsvector generated always as (
    to_tsvector('english', make || ' ' || model)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  seller_id uuid not null references profiles(id),
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  amount_cents int not null,
  currency text not null default 'aud',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  recipient_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_listings_filters
  on listings (make, price, year, mileage);

create index if not exists idx_listings_browse
  on listings (status, created_at desc);

create index if not exists idx_listings_search
  on listings using gin (search_text);

create index if not exists idx_messages_inbox
  on messages (listing_id, recipient_id);

create index if not exists idx_listing_payments_session
  on listing_payments (stripe_checkout_session_id);

-- ============================================================
-- Keep listings.updated_at current
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listings_set_updated_at on listings;
create trigger trg_listings_set_updated_at
  before update on listings
  for each row
  execute function set_updated_at();

-- ============================================================
-- Enforce the listing payment state machine at the DB level.
--
-- Per spec §5a: a listing may only move pending_payment -> active
-- via the Stripe webhook handler (which uses the service role key).
-- This trigger blocks that transition for any other role, so even a
-- bug in application code can't let a client flip its own listing live
-- without paying. service_role (the webhook) bypasses this check.
-- ============================================================

create or replace function enforce_listing_status_transition()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if old.status = new.status then
    return new;
  end if;

  if old.status = 'active' and new.status in ('sold', 'removed') then
    return new;
  end if;

  if old.status = 'pending_payment' and new.status = 'removed' then
    return new;
  end if;

  raise exception
    'Only the payment webhook can activate a listing (attempted % -> %)',
    old.status, new.status;
end;
$$;

drop trigger if exists trg_enforce_listing_status_transition on listings;
create trigger trg_enforce_listing_status_transition
  before update on listings
  for each row
  execute function enforce_listing_status_transition();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table listings enable row level security;
alter table listing_payments enable row level security;
alter table listing_photos enable row level security;
alter table messages enable row level security;
alter table favorites enable row level security;

-- ---------- profiles ----------
-- Public read (seller name/location/avatar show on listing cards),
-- but only the owner can create/update their own row.

drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all"
  on profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- listings ----------
-- Anyone can see active listings; owners can also see their own
-- pending/sold/removed listings (needed for "My Listings").

drop policy if exists "listings_select_active_or_own" on listings;
create policy "listings_select_active_or_own"
  on listings for select
  using (status = 'active' or seller_id = auth.uid());

-- New listings must start pending_payment and belong to the caller.
drop policy if exists "listings_insert_own" on listings;
create policy "listings_insert_own"
  on listings for insert
  with check (seller_id = auth.uid() and status = 'pending_payment');

-- Owners can update their own listings; the transition trigger above
-- (not this policy) is what blocks illegitimate status changes.
drop policy if exists "listings_update_own" on listings;
create policy "listings_update_own"
  on listings for update
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

drop policy if exists "listings_delete_own" on listings;
create policy "listings_delete_own"
  on listings for delete
  using (seller_id = auth.uid());

-- ---------- listing_payments ----------
-- Read-only from the client; all writes happen server-side with the
-- service role key (which bypasses RLS), so there are no insert/update
-- policies here at all.

drop policy if exists "listing_payments_select_own" on listing_payments;
create policy "listing_payments_select_own"
  on listing_payments for select
  using (seller_id = auth.uid());

-- ---------- listing_photos ----------
-- Visibility follows the parent listing's visibility; only the
-- listing's owner can attach/reorder/remove photos.

drop policy if exists "listing_photos_select" on listing_photos;
create policy "listing_photos_select"
  on listing_photos for select
  using (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and (l.status = 'active' or l.seller_id = auth.uid())
    )
  );

drop policy if exists "listing_photos_insert_own" on listing_photos;
create policy "listing_photos_insert_own"
  on listing_photos for insert
  with check (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and l.seller_id = auth.uid()
    )
  );

drop policy if exists "listing_photos_update_own" on listing_photos;
create policy "listing_photos_update_own"
  on listing_photos for update
  using (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and l.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and l.seller_id = auth.uid()
    )
  );

drop policy if exists "listing_photos_delete_own" on listing_photos;
create policy "listing_photos_delete_own"
  on listing_photos for delete
  using (
    exists (
      select 1 from listings l
      where l.id = listing_photos.listing_id
        and l.seller_id = auth.uid()
    )
  );

-- ---------- messages ----------
-- Only the two participants in a conversation can see or send messages;
-- only the recipient can mark a message read.

drop policy if exists "messages_select_participant" on messages;
create policy "messages_select_participant"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists "messages_insert_as_sender" on messages;
create policy "messages_insert_as_sender"
  on messages for insert
  with check (auth.uid() = sender_id and sender_id <> recipient_id);

drop policy if exists "messages_update_recipient_read" on messages;
create policy "messages_update_recipient_read"
  on messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- ---------- favorites ----------
-- Fully private to the user who created them.

drop policy if exists "favorites_select_own" on favorites;
create policy "favorites_select_own"
  on favorites for select
  using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on favorites;
create policy "favorites_insert_own"
  on favorites for insert
  with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on favorites;
create policy "favorites_delete_own"
  on favorites for delete
  using (user_id = auth.uid());
