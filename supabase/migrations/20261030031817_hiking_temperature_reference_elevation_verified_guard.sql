DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'hiking_weather_areas_reference_elevation_verified_contract'
      AND conrelid = 'public.hiking_weather_areas'::regclass
  ) THEN
    ALTER TABLE public.hiking_weather_areas
      ADD CONSTRAINT hiking_weather_areas_reference_elevation_verified_contract
      CHECK (
        reference_elevation_quality_status <> 'verified'
        OR (
          reference_elevation_m IS NOT NULL
          AND reference_elevation_source_id IS NOT NULL
          AND reference_elevation_source_url IS NOT NULL
          AND reference_elevation_source_url LIKE 'https://%'
          AND reference_elevation_verified_at IS NOT NULL
        )
      );
  END IF;
END $$;
