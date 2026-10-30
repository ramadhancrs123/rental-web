ALTER TABLE public.hiking_weather_areas
  ADD COLUMN IF NOT EXISTS reference_elevation_m integer,
  ADD COLUMN IF NOT EXISTS reference_elevation_quality_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS reference_elevation_source_id uuid,
  ADD COLUMN IF NOT EXISTS reference_elevation_source_url text,
  ADD COLUMN IF NOT EXISTS reference_elevation_verified_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hiking_weather_areas_reference_elevation_range' AND conrelid = 'public.hiking_weather_areas'::regclass) THEN
    ALTER TABLE public.hiking_weather_areas ADD CONSTRAINT hiking_weather_areas_reference_elevation_range CHECK (reference_elevation_m IS NULL OR reference_elevation_m BETWEEN -500 AND 9000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hiking_weather_areas_reference_elevation_quality' AND conrelid = 'public.hiking_weather_areas'::regclass) THEN
    ALTER TABLE public.hiking_weather_areas ADD CONSTRAINT hiking_weather_areas_reference_elevation_quality CHECK (reference_elevation_quality_status IN ('unknown','candidate','verified','rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hiking_weather_areas_reference_elevation_source_fk' AND conrelid = 'public.hiking_weather_areas'::regclass) THEN
    ALTER TABLE public.hiking_weather_areas ADD CONSTRAINT hiking_weather_areas_reference_elevation_source_fk FOREIGN KEY (reference_elevation_source_id) REFERENCES public.hiking_data_sources(source_id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS hiking_weather_areas_reference_elevation_source_idx ON public.hiking_weather_areas(reference_elevation_source_id) WHERE reference_elevation_source_id IS NOT NULL;

CREATE OR REPLACE VIEW public.v_public_hiking_temperature_checkpoints WITH (security_invoker = true) AS
SELECT c.checkpoint_id, c.trail_id, t.mountain_id, m.slug AS mountain_slug, t.slug AS trail_slug,
  c.sequence_number, c.code, c.name, c.checkpoint_type, c.latitude, c.longitude, c.elevation_m,
  c.elevation_source_id, c.elevation_source_url, c.verified_at,
  (c.publication_status = 'published' AND c.verified_at IS NOT NULL AND c.elevation_m IS NOT NULL
    AND c.elevation_source_id IS NOT NULL AND es.is_active = true AND es.is_public = true
    AND es.permission_status IN ('verified_open','permission_granted')) AS temperature_estimate_public_eligible
FROM public.hiking_checkpoints c
JOIN public.hiking_trails t ON t.trail_id = c.trail_id
JOIN public.hiking_mountains m ON m.mountain_id = t.mountain_id
LEFT JOIN public.hiking_data_sources es ON es.source_id = c.elevation_source_id
WHERE c.publication_status = 'published' AND t.publication_status = 'published' AND m.publication_status = 'published';

REVOKE ALL ON public.v_public_hiking_temperature_checkpoints FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.v_public_hiking_temperature_checkpoints TO service_role;
