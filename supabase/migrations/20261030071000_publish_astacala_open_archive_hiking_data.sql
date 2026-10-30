-- Publish the public ASTACALA bank-data archive after deterministic integrity checks.
-- "verified_at" records source/structure validation only, not field conditions.
UPDATE public.hiking_data_sources
SET source_url = 'https://astacala.org/bank-data',
    permission_status = 'verified_open',
    is_public = true,
    notes = 'Arsip terbuka resmi ASTACALA. Panduan publik ASTACALA menjelaskan Bank Data Publik menyediakan berkas GPX/KMZ/PDF dan menyatakan berkas boleh digunakan untuk persiapan serta navigasi dengan mencantumkan sumber. Referensi: https://astacala.org/bank-data dan https://astacala.org/panduan-publik/lengkap. Pemeriksaan otomatis Akasha: SHA-256 setiap berkas cocok dengan manifest; jumlah track dan waypoint GPX cocok dengan JSON; geometri dan koordinat lulus validasi struktur. Status ini hanya menyatakan integritas sumber/struktur, bukan verifikasi kondisi lapangan, status operasional, izin pendakian, atau elevasi checkpoint. Raw GPX tetap disimpan privat.',
    updated_at = now()
WHERE source_id = '4b0ca5c7-0edb-4f06-a03e-470556f36974';

UPDATE public.hiking_mountains
SET publication_status = 'published',
    published_at = COALESCE(published_at, now()),
    verified_at = COALESCE(verified_at, now()),
    updated_at = now()
WHERE primary_source_id = '4b0ca5c7-0edb-4f06-a03e-470556f36974';

UPDATE public.hiking_trails
SET publication_status = 'published',
    published_at = COALESCE(published_at, now()),
    verified_at = COALESCE(verified_at, now()),
    updated_at = now()
WHERE route_source_id = '4b0ca5c7-0edb-4f06-a03e-470556f36974'
  AND route_geometry IS NOT NULL
  AND ST_IsValid(route_geometry);

UPDATE public.hiking_checkpoints c
SET publication_status = 'published',
    verified_at = COALESCE(c.verified_at, now()),
    updated_at = now()
FROM public.hiking_trails t
WHERE t.trail_id = c.trail_id
  AND t.route_source_id = '4b0ca5c7-0edb-4f06-a03e-470556f36974'
  AND c.latitude BETWEEN -90 AND 90
  AND c.longitude BETWEEN -180 AND 180;
