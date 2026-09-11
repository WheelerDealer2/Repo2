# Supabase setup

Project ref: `pacrrhbylgjqpnoenctn`

## Applying the schema

1. Open the [SQL Editor](https://supabase.com/dashboard/project/pacrrhbylgjqpnoenctn/sql/new) for this project.
2. Paste the contents of `migrations/20260911013000_init_schema.sql`.
3. Run it. It's idempotent (`if not exists` / `drop policy if exists`), so it's
   safe to re-run if you tweak something and paste it again.

Future schema changes should be added as new timestamped files in
`migrations/` and applied the same way (or via `supabase db push` once the
CLI is linked to this project).

## What this creates

- Tables: `profiles`, `listings`, `listing_payments`, `listing_photos`,
  `messages`, `favorites` (see the technical spec §3)
- Indexes for the browse/filter/search queries
- A trigger that keeps `listings.updated_at` current
- A trigger enforcing that only the Stripe webhook (using the service role
  key) can flip a listing from `pending_payment` to `active` — see spec §5a
- RLS policies on every table (see the migration file for the exact rules
  per table)
