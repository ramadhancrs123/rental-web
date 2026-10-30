-- Expose the elevation quality classification so the public UI never
-- presents provisional DEM values as surveyed elevations.
CREATE OR REPLACE VIEW public.v_public_hiking_checkpoints AS
SELECT
  c.checkpoint_id,
  c.trail_id,
  t.slug AS trail_slug,
  m.slug AS mountain_slug,
  c.sequence_number,
  c.code,
  c.name,
  c.checkpoint_type,
  c.description,
  c.latitude,
  c.longitude,
  c.elevation_m,
  c.elevation_source_url,
  c.verified_at,
  c.elevation_quality_status
FROM public.hiking_checkpoints c
JOIN public.hiking_trails t
  ON t.trail_id=c.trail_id AND t.publication_status='published'
JOIN public.hiking_mountains m
  ON m.mountain_id=t.mountain_id AND m.publication_status='published'
WHERE c.publication_status='published';
