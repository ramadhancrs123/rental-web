-- Materialize validated PMPA ASTACALA GPX route and waypoint candidates.
-- Idempotent: existing rows are updated in place and remain unpublished drafts.
-- Raw GPX originals and full source-row JSON snapshots remain stored separately.

INSERT INTO public.hiking_trails (
  mountain_id, code, slug, name, description, route_geojson, route_geometry,
  distance_m, difficulty_grade, difficulty_grade_status, operational_status,
  route_source_id, route_source_reference_url, source_version,
  publication_status, published_at, verified_at
)
SELECT
  rc.mountain_id,
  rc.candidate_code,
  rc.candidate_code,
  COALESCE(NULLIF(BTRIM(rc.source_track_name), ''), 'Track ' || LPAD(rc.source_track_index::text, 3, '0')),
  'Rekaman track GPX PMPA ASTACALA untuk data uji langsung Akasha Outdoor. '
    || rc.point_count::text || ' titik GPS, ' || rc.segment_count::text || ' segmen, '
    || COALESCE(ROUND(rc.distance_m::numeric / 1000, 2)::text || ' km.', 'jarak belum dihitung.')
    || ' Nama track mengikuti file sumber dan tidak diubah menjadi klaim jalur resmi.',
  rc.route_geojson,
  ST_SetSRID(ST_GeomFromGeoJSON(rc.route_geojson::text), 4326),
  rc.distance_m,
  NULL,
  'not_assessed',
  'unknown',
  m.primary_source_id,
  COALESCE(i.source_reference_url, m.source_reference_url),
  i.source_version,
  'draft',
  NULL,
  NULL
FROM public.hiking_route_candidates rc
JOIN public.hiking_mountains m ON m.mountain_id = rc.mountain_id
JOIN public.hiking_route_imports i ON i.import_id = rc.import_id
WHERE jsonb_typeof(rc.route_geojson) = 'object'
  AND rc.route_geojson->>'type' = 'MultiLineString'
  AND jsonb_array_length(rc.route_geojson->'coordinates') > 0
ON CONFLICT (mountain_id, code) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  route_geojson = EXCLUDED.route_geojson,
  route_geometry = EXCLUDED.route_geometry,
  distance_m = EXCLUDED.distance_m,
  route_source_id = EXCLUDED.route_source_id,
  route_source_reference_url = EXCLUDED.route_source_reference_url,
  source_version = EXCLUDED.source_version,
  publication_status = 'draft',
  published_at = NULL,
  verified_at = NULL,
  updated_at = now();

INSERT INTO public.hiking_checkpoints (
  trail_id, sequence_number, code, name, checkpoint_type, description,
  latitude, longitude, elevation_m, source_id, source_reference_url,
  publication_status, verified_at
)
SELECT
  t.trail_id,
  c.source_index,
  c.candidate_code,
  c.name,
  CASE WHEN c.checkpoint_type_candidate IN (
    'basecamp','pos','water_source','camping_area','summit',
    'emergency_point','viewpoint','shelter','waypoint','other'
  ) THEN c.checkpoint_type_candidate ELSE 'waypoint' END,
  'Waypoint GPX sumber PMPA ASTACALA. Kedekatan ke track kandidat terdekat '
    || COALESCE(ROUND((c.source_metadata#>>'{trackProximity,nearestTrackCandidate,distanceToTrackM}')::numeric, 1)::text || ' m.', 'tidak tersedia.')
    || ' Elevasi kandidat tetap tersedia pada data sumber; elevation_m tidak diisi sebagai elevasi terverifikasi.',
  c.latitude,
  c.longitude,
  NULL,
  m.primary_source_id,
  c.source_reference_url,
  'draft',
  NULL
FROM public.hiking_checkpoint_candidates c
JOIN public.hiking_route_candidates rc
  ON rc.mountain_id = c.mountain_id
 AND rc.candidate_code = c.source_metadata#>>'{trackProximity,nearestTrackCandidate,trackCandidateId}'
JOIN public.hiking_trails t
  ON t.mountain_id = rc.mountain_id
 AND t.code = rc.candidate_code
JOIN public.hiking_mountains m ON m.mountain_id = c.mountain_id
WHERE c.latitude BETWEEN -90 AND 90
  AND c.longitude BETWEEN -180 AND 180
ON CONFLICT (trail_id, code) DO UPDATE SET
  sequence_number = EXCLUDED.sequence_number,
  name = EXCLUDED.name,
  checkpoint_type = EXCLUDED.checkpoint_type,
  description = EXCLUDED.description,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  elevation_m = NULL,
  source_id = EXCLUDED.source_id,
  source_reference_url = EXCLUDED.source_reference_url,
  publication_status = 'draft',
  verified_at = NULL,
  updated_at = now();

INSERT INTO public.hiking_trail_weather_areas (
  trail_id, weather_area_id, purpose, is_primary, verified_at, source_reference_url
)
SELECT
  t.trail_id,
  mwa.weather_area_id,
  'reference',
  mwa.is_primary,
  NULL,
  mwa.source_reference_url
FROM public.hiking_trails t
JOIN public.hiking_mountain_weather_areas mwa
  ON mwa.mountain_id = t.mountain_id
 AND mwa.purpose = 'reference'
ON CONFLICT (trail_id, weather_area_id, purpose) DO UPDATE SET
  is_primary = EXCLUDED.is_primary,
  source_reference_url = EXCLUDED.source_reference_url;

-- Put each mapped mountain marker on its highest source waypoint labeled as a
-- summit. Salak's "SALAK 1/2" summit labels are included by their GPX name.
-- Elevation itself remains unset on hiking_mountains (candidate evidence only).
WITH ranked AS (
  SELECT
    c.mountain_id,
    c.latitude,
    c.longitude,
    ROW_NUMBER() OVER (
      PARTITION BY c.mountain_id
      ORDER BY
        CASE WHEN c.waypoint_label_elevation_m IS NOT NULL THEN 0 ELSE 1 END,
        c.candidate_elevation_m DESC NULLS LAST,
        c.source_index
    ) AS rank_no
  FROM public.hiking_checkpoint_candidates c
  JOIN public.hiking_mountains m ON m.mountain_id = c.mountain_id
  WHERE c.latitude BETWEEN -90 AND 90
    AND c.longitude BETWEEN -180 AND 180
    AND (
      c.location_role_candidate = 'summit'
      OR (m.code = 'JAB_SALAK' AND c.name ~* '^SALAK [12]([[:space:]]|$)')
    )
)
UPDATE public.hiking_mountains m
SET latitude = r.latitude,
    longitude = r.longitude,
    updated_at = now()
FROM ranked r
WHERE r.mountain_id = m.mountain_id
  AND r.rank_no = 1
  AND (m.latitude IS DISTINCT FROM r.latitude OR m.longitude IS DISTINCT FROM r.longitude);
