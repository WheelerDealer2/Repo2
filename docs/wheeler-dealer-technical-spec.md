# Wheeler Dealer — Technical Spec (MVP v1: Web)

## 1. Overview

Wheeler Dealer is a multi-seller car marketplace. Anyone can create an account, post a
listing for a car they're selling, and browse/search/filter listings posted by
other sellers. Buyers contact sellers through the app rather than a public
phone number.

This spec covers the **web MVP**. A companion mobile app (React Native) is
planned as phase 2 and is designed to share the same backend (see §8).

A working front-end prototype already exists (`wheeler-dealer.html`) demonstrating
the intended UX for browse, filter, listing detail, and post-a-listing flows.
Use it as the design/interaction reference — this spec adds the real backend,
auth, and persistence behind that UX.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js (App Router, TypeScript) | SSR for SEO on listing pages, one codebase, easy deploy |
| Styling | Tailwind CSS | Matches the prototype's utility-first approach |
| Backend/DB | Supabase (Postgres) | Auth + DB + file storage in one product, generous free tier |
| Auth | Supabase Auth (email/password + Google OAuth) | Built-in, no custom auth server needed |
| Image storage | Supabase Storage | Listing photos, integrates with Supabase Auth for access rules |
| Hosting | Vercel | First-class Next.js support, free tier sufficient for MVP |
| Messaging (v1) | Simple in-app message table (not real-time chat yet) | Keeps MVP scope tight; see §7 for what's deferred |
| Payments | Stripe (Checkout + Webhooks) | Standard for charging a one-time fee per listing; well-documented Next.js integration |

## 3. Database Schema (Postgres / Supabase)

```sql
-- Users are managed by Supabase Auth (auth.users). We extend with a profile table.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  location text,
  avatar_url text,
  created_at timestamptz default now()
);

create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id) on delete cascade not null,
  make text not null,
  model text not null,
  year int not null check (year between 1950 and 2100),
  price numeric not null check (price >= 0),
  mileage int not null check (mileage >= 0),
  location text not null,
  color text,
  description text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','active','sold','removed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table listing_payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  seller_id uuid references profiles(id) not null,
  stripe_checkout_session_id text not null,
  stripe_payment_intent_id text,
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz default now(),
  paid_at timestamptz
);

create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  storage_path text not null,
  sort_order int default 0
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  recipient_id uuid references profiles(id) not null,
  body text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

create table favorites (
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);
```

**Indexes to add:**
- `listings(make, price, year, mileage)` — composite index for filter queries
- `listings(status, created_at desc)` — for the default "newest active" browse query
- `messages(listing_id, recipient_id)` — for inbox queries
- `listing_payments(stripe_checkout_session_id)` — for fast webhook lookups

**Row Level Security (RLS):** enable on all tables.
- `listings`: anyone can `select` where `status = 'active'`; only the owning
  `seller_id` can `insert`/`update`/`delete` their own rows. Listings created
  with `status = 'pending_payment'` are invisible to browse queries until
  payment succeeds flips them to `active` (see §5a).
- `messages`: a user can `select`/`insert` only rows where they are
  `sender_id` or `recipient_id`.
- `favorites`: a user can only read/write their own rows.
- `listing_payments`: a user can only `select` their own rows (`seller_id`);
  all `insert`/`update` happens server-side (via the webhook handler using
  the service role key), never directly from the client.

## 4. Core Screens / Routes

| Route | Purpose |
|---|---|
| `/` | Browse — search bar, filters, listing grid (matches prototype) |
| `/listing/[id]` | Listing detail — spec sheet, description, seller card, contact button |
| `/post` | Post a new listing (auth required) |
| `/listing/[id]/edit` | Edit own listing (auth required, owner only) |
| `/login`, `/signup` | Auth screens |
| `/account` | Profile settings, "My Listings," favorites |
| `/messages` | Inbox — conversations grouped by listing |

## 5. Key Flows

**Posting a listing**
1. User must be logged in (redirect to `/login?redirect=/post` if not).
2. Form fields match the prototype: make, model, year, price, mileage,
   location, color, description, photo upload (multiple, max 10).
3. On submit, create the `listings` row with `status = 'pending_payment'`
   and upload photos to Supabase Storage under `listings/{listing_id}/`
   (so nothing is lost if the user abandons checkout — see §5a).
4. Redirect to Stripe Checkout for the listing fee. On success, the listing
   is flipped to `active` by the webhook (not the browser redirect — see
   §5a) and the user lands on the new listing's detail page.
5. If the user abandons checkout, the listing stays `pending_payment` and
   is hidden from browse/search. Surface these on `/account` as "Unpaid
   drafts" with a "Resume payment" button so nothing is silently lost.

**Browsing & filtering**
- Filters (make, max price, min year, max mileage) map directly to a
  Postgres query with `where` clauses — no need for a search service at
  this scale (Postgres full-text search on `make || ' ' || model` covers
  the search box for MVP).
- Sort options: newest, price asc/desc, mileage asc — same as prototype.

**Contacting a seller**
- Buyer clicks "Contact seller" on a listing → opens a simple message
  composer → inserts a row into `messages` → seller sees it in `/messages`.
- Defer real-time updates (websockets) to phase 2; polling or refresh-on-
  visit is fine for MVP.

## 5a. Charging Sellers Per Listing

**Pricing model (starting assumption — easy to change):** a flat fee per
listing, e.g. **$5 per listing**, charged once at posting time. Alternatives
worth considering later, without changing the underlying plumbing much:
- First listing free, flat fee per listing after that
- Free basic listing + paid "featured" upsell (bumped to top of search,
  highlighted card) — this only requires adding a `featured_until` column
  to `listings` and a second Stripe price
- Subscription for high-volume sellers (e.g., small dealers) — Stripe
  Billing instead of one-off Checkout sessions

**Why the listing is created *before* payment, not after:**
Creating the `listings` row (as `pending_payment`) and uploading photos
before checkout means the user's work is never lost if they close the tab
mid-payment, and it gives Stripe Checkout a concrete `listing_id` to attach
to the session via `metadata`.

**Flow:**
1. Server creates a Stripe Checkout Session (`mode: 'payment'`) with
   `metadata: { listing_id }` and a success/cancel URL back to your app.
2. User completes payment on Stripe's hosted page.
3. Stripe sends a `checkout.session.completed` webhook to
   `/api/webhooks/stripe`.
4. The webhook handler (using the Supabase **service role** key, never the
   anon key) verifies the Stripe signature, looks up `listing_id` from the
   session metadata, inserts/updates the `listing_payments` row to `paid`,
   and flips the `listings.status` to `active`.
5. **Never** flip a listing to `active` from the client-side "success"
   redirect alone — that page can be reached without a real payment (back
   button, replay, etc.). The webhook is the only source of truth for
   payment success.
6. Handle `checkout.session.expired` similarly to mark the payment `failed`
   and leave the listing in `pending_payment` so the user can retry.

**Refunds / removed listings:** if a seller removes a listing early, this
spec does not assume automatic refunds — that's a policy decision (e.g.,
"fees are non-refundable" is the simplest starting policy and common for
this kind of marketplace).

## 6. MVP Feature List (build in this order)

1. Supabase project setup + schema + RLS policies
2. Auth (signup/login/logout, profile creation on first login)
3. Post-a-listing form + photo upload (creates `pending_payment` listing)
4. Stripe Checkout integration + webhook handler (flips listing to `active`)
5. Browse page with real data (replace prototype's mock array)
6. Filters + search + sort, wired to real queries
7. Listing detail page
8. Contact-seller flow (basic message insert, no real-time)
9. My Listings page (edit/mark-as-sold/delete, resume unpaid drafts)
10. Messages inbox
11. Favorites/saved listings

## 7. Explicitly Deferred (not in v1)

- Real-time chat (websockets/Supabase Realtime) — start with basic message
  list, add later
- Listing moderation / fraud detection tooling
- Push notifications
- Map-based search / distance radius filtering
- Featured/boosted listings upsell (paid basic listing fee is now in
  scope — see §5a — but the *featured* upgrade tier is still deferred)
- Refund automation, subscriptions for high-volume sellers

## 8. Path to Mobile (Phase 2)

Because the backend is Supabase (a hosted API, not a custom server tied to
Next.js), a React Native app can talk to the **same Supabase project** —
same auth, same tables, same storage bucket — via `supabase-js`. This means:

- No backend rewrite needed when starting the mobile app
- The two apps can be developed and shipped independently
- Screens map roughly 1:1 from the prototype/web routes to React Native
  screens (Browse, Detail, Post, Account, Messages)

When ready, this is the point to bring in Claude Code again with a new spec
scoped specifically to the React Native app, referencing this same schema.

## 9. Environment / Setup Notes for Claude Code

- Initialize with `create-next-app` (TypeScript, App Router, Tailwind)
- Add `@supabase/supabase-js` and `@supabase/ssr` for auth session handling
- Add `stripe` (server-side) npm package for Checkout Sessions + webhook
  verification
- Store Supabase URL/anon key **and** Stripe secret key + webhook signing
  secret in `.env.local` (never commit); the Supabase **service role** key
  used in the webhook handler is especially sensitive — server-side only,
  never exposed to the client bundle
- Use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
  for local webhook testing
- Reference `wheeler-dealer.html` (the prototype) for exact visual styling:
  color tokens, fonts (Big Shoulders Display / IBM Plex Sans / IBM Plex
  Mono via Google Fonts), and card/spec-sheet layout patterns
