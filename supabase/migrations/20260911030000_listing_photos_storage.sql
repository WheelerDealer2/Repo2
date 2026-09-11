-- Storage bucket for listing photos, uploaded to paths shaped like
-- {listing_id}/{filename}. Kept private (not `public`) so visibility can
-- mirror the parent listing's status, same as the listing_photos table's
-- RLS — a pending/removed listing's photos aren't fetchable by strangers
-- just because they guessed the URL.

insert into storage.buckets (id, name, public)
values ('listings', 'listings', false)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by default on Supabase projects,
-- and that table is owned by supabase_storage_admin, not postgres, so we
-- can't (and don't need to) ALTER TABLE it here — only add policies.

drop policy if exists "listings_bucket_select" on storage.objects;
create policy "listings_bucket_select"
  on storage.objects for select
  using (
    bucket_id = 'listings'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(objects.name))[1]
        and (l.status = 'active' or l.seller_id = auth.uid())
    )
  );

drop policy if exists "listings_bucket_insert" on storage.objects;
create policy "listings_bucket_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'listings'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(objects.name))[1]
        and l.seller_id = auth.uid()
    )
  );

drop policy if exists "listings_bucket_update" on storage.objects;
create policy "listings_bucket_update"
  on storage.objects for update
  using (
    bucket_id = 'listings'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(objects.name))[1]
        and l.seller_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'listings'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(objects.name))[1]
        and l.seller_id = auth.uid()
    )
  );

drop policy if exists "listings_bucket_delete" on storage.objects;
create policy "listings_bucket_delete"
  on storage.objects for delete
  using (
    bucket_id = 'listings'
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(objects.name))[1]
        and l.seller_id = auth.uid()
    )
  );
