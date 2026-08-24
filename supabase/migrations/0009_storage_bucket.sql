-- 0009_storage_bucket.sql — bucket book-covers/ público read + admin write.
-- Spec 5.2 (a1): URL predecible, sin signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

-- Public read
create policy "book-covers public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'book-covers');

-- Admin write (usa is_admin() de migration 0007)
create policy "book-covers admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'book-covers' and is_admin());

create policy "book-covers admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'book-covers' and is_admin())
  with check (bucket_id = 'book-covers' and is_admin());

create policy "book-covers admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'book-covers' and is_admin());
