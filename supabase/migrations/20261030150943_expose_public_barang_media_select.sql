-- Keep public catalog media readable without exposing private inventory assets.
-- The existing FORCE RLS policy limits anon rows to valid media attached to public catalog items.
grant select (
  barang_id,
  storage_bucket,
  storage_path,
  media_type,
  urutan,
  is_cover,
  status
) on table public.barang_media to anon;

notify pgrst, 'reload schema';
