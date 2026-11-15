-- Allow the public catalog to read component details for public packages only.
-- Row access remains constrained by komponen_paket_public_catalog RLS policy,
-- which calls is_public_catalog_target(usaha_id, NULL, NULL, paket_sewa_id).
GRANT SELECT ON TABLE public.komponen_paket TO anon;
