-- Use independent SRTM30m + ASTER30m agreement for clearly labeled provisional estimates.
-- This never represents a field survey or the effective terrain height of BMKG's model.
INSERT INTO public.hiking_data_sources (
  code,name,source_type,source_url,attribution_text,license_name,license_url,
  permission_status,is_public,is_active,notes
) VALUES (
  'opentopodata-dem-consensus',
  'OpenTopoData — SRTM30m + ASTER30m',
  'elevation_dem',
  'https://www.opentopodata.org/',
  'Elevation estimate from SRTM30m and ASTER30m datasets via OpenTopoData API.',
  'Public DEM datasets',
  'https://www.opentopodata.org/',
  'verified_open',true,true,
  'Automated elevation cross-check. Public elevation model consensus is provisional terrain elevation, not a surveyed/official altitude. Only points where SRTM30m and ASTER30m differ by <=50 m are accepted for provisional temperature estimation. It must never be labeled as surveyed elevation or an official BMKG point forecast.'
)
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name,source_type=EXCLUDED.source_type,source_url=EXCLUDED.source_url,
  attribution_text=EXCLUDED.attribution_text,license_name=EXCLUDED.license_name,
  license_url=EXCLUDED.license_url,permission_status=EXCLUDED.permission_status,
  is_public=EXCLUDED.is_public,is_active=EXCLUDED.is_active,notes=EXCLUDED.notes,
  updated_at=now();

UPDATE public.hiking_weather_areas
SET reference_elevation_source_id = (
      SELECT source_id FROM public.hiking_data_sources WHERE code='opentopodata-dem-consensus'
    ),
    reference_elevation_source_url = 'https://api.opentopodata.org/',
    reference_elevation_verified_at = COALESCE(reference_elevation_verified_at,now()),
    reference_elevation_evidence = jsonb_set(
      COALESCE(reference_elevation_evidence,'{}'::jsonb),
      '{temperatureCorrectionUse}',
      COALESCE(reference_elevation_evidence->'temperatureCorrectionUse','{}'::jsonb)
        || jsonb_build_object(
          'status','provisional_dem_consensus_enabled',
          'enabledForProvisionalEstimate',true,
          'publicPointTemperatureEligible',false,
          'notEquivalentTo','Atmospheric model effective terrain height; output remains a provisional lapse-rate estimate.'
        ),
      true
    ),
    updated_at=now()
WHERE reference_elevation_quality_status='candidate'
  AND reference_elevation_evidence->>'status'='dem_models_agree_provisional'
  AND (reference_elevation_evidence->>'demDifferenceM')::numeric <= 20;

ALTER TABLE public.hiking_checkpoints
  ADD COLUMN IF NOT EXISTS elevation_quality_status text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.hiking_checkpoints
  DROP CONSTRAINT IF EXISTS hiking_checkpoint_elevation_quality_status_check;

ALTER TABLE public.hiking_checkpoints
  ADD CONSTRAINT hiking_checkpoint_elevation_quality_status_check
  CHECK (elevation_quality_status IN ('unknown','dem_consensus_provisional','verified_survey'));

UPDATE public.hiking_checkpoints c
SET elevation_m = ROUND((cc.source_metadata#>>'{elevation,demCrossCheck,demConsensusCandidateM}')::numeric)::integer,
    elevation_source_id = (
      SELECT source_id FROM public.hiking_data_sources WHERE code='opentopodata-dem-consensus'
    ),
    elevation_source_url = 'https://api.opentopodata.org/',
    elevation_quality_status = 'dem_consensus_provisional',
    updated_at=now()
FROM public.hiking_checkpoint_candidates cc
WHERE cc.candidate_code=c.code
  AND cc.source_metadata#>>'{elevation,demCrossCheck,demConsensusCandidateM}' IS NOT NULL
  AND cc.source_metadata#>>'{elevation,demCrossCheck,datasets,srtm30m,elevationM}' IS NOT NULL
  AND cc.source_metadata#>>'{elevation,demCrossCheck,datasets,aster30m,elevationM}' IS NOT NULL
  AND (cc.source_metadata#>>'{elevation,demCrossCheck,demDifferenceM}')::numeric <= 50
  AND c.publication_status='published';

CREATE OR REPLACE VIEW public.v_public_hiking_temperature_checkpoints AS
SELECT
  c.checkpoint_id,
  c.trail_id,
  t.mountain_id,
  m.slug AS mountain_slug,
  t.slug AS trail_slug,
  c.sequence_number,
  c.code,
  c.name,
  c.checkpoint_type,
  c.latitude,
  c.longitude,
  c.elevation_m,
  c.elevation_source_id,
  c.elevation_source_url,
  c.verified_at,
  c.publication_status = 'published'
    AND c.verified_at IS NOT NULL
    AND c.elevation_m IS NOT NULL
    AND c.elevation_quality_status IN ('dem_consensus_provisional','verified_survey')
    AND c.elevation_source_id IS NOT NULL
    AND es.is_active = true
    AND es.is_public = true
    AND es.permission_status = ANY (ARRAY['verified_open'::text,'permission_granted'::text])
    AS temperature_estimate_public_eligible,
  c.elevation_quality_status
FROM public.hiking_checkpoints c
JOIN public.hiking_trails t ON t.trail_id=c.trail_id
JOIN public.hiking_mountains m ON m.mountain_id=t.mountain_id
LEFT JOIN public.hiking_data_sources es ON es.source_id=c.elevation_source_id
WHERE c.publication_status='published'
  AND t.publication_status='published'
  AND m.publication_status='published';
