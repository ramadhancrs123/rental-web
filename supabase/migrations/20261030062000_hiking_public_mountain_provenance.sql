
CREATE OR REPLACE VIEW public.v_public_hiking_mountains
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  m.mountain_id,
  m.code,
  m.slug,
  m.name,
  m.aliases,
  m.description,
  m.elevation_m,
  m.province,
  m.regency,
  m.latitude,
  m.longitude,
  m.is_volcanic,
  CASE
    WHEN m.is_volcanic IS TRUE THEN COALESCE(m.volcanic_status, 'unknown'::text)
    WHEN m.is_volcanic IS FALSE THEN 'not_applicable'::text
    ELSE 'unknown'::text
  END AS volcanic_status,
  CASE
    WHEN m.is_volcanic IS TRUE
      AND m.volcanic_status <> 'unknown'
      AND vs.source_id IS NOT NULL
      THEN m.volcanic_status_source_url
    ELSE NULL::text
  END AS volcanic_status_source_url,
  m.volcanic_status_checked_at,
  o.name AS operator_name,
  o.website_url AS operator_website_url,
  m.verified_at,
  ARRAY(
    SELECT wa.adm4_code
    FROM public.hiking_mountain_weather_areas mwa
    JOIN public.hiking_weather_areas wa ON wa.weather_area_id = mwa.weather_area_id
    WHERE mwa.mountain_id = m.mountain_id AND wa.is_active
    ORDER BY mwa.is_primary DESC, wa.province_name, wa.regency_name, wa.village_name
  ) AS bmkg_adm4_codes,
  CASE WHEN ps.source_id IS NOT NULL THEN m.source_reference_url ELSE NULL::text END AS source_reference_url,
  ps.name AS primary_source_name
FROM public.hiking_mountains m
LEFT JOIN public.hiking_operators o
  ON o.operator_id = m.operator_id AND o.is_public AND o.verification_status = 'verified'
LEFT JOIN public.hiking_data_sources ps
  ON ps.source_id = m.primary_source_id
 AND ps.is_active = true
 AND ps.is_public = true
 AND ps.permission_status IN ('verified_open', 'permission_granted')
LEFT JOIN public.hiking_data_sources vs
  ON vs.source_id = m.volcanic_status_source_id
 AND vs.is_active = true
 AND vs.is_public = true
 AND vs.permission_status IN ('verified_open', 'permission_granted')
WHERE m.publication_status = 'published';
