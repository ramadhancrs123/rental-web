-- Point every public provenance link to ASTACALA's current public Bank Data page.
UPDATE public.hiking_mountains
SET source_reference_url='https://astacala.org/bank-data', updated_at=now()
WHERE primary_source_id='4b0ca5c7-0edb-4f06-a03e-470556f36974';

UPDATE public.hiking_trails
SET route_source_reference_url='https://astacala.org/bank-data', updated_at=now()
WHERE route_source_id='4b0ca5c7-0edb-4f06-a03e-470556f36974';

UPDATE public.hiking_route_imports
SET source_reference_url='https://astacala.org/bank-data'
WHERE source_id='4b0ca5c7-0edb-4f06-a03e-470556f36974';

UPDATE public.hiking_checkpoint_candidates
SET source_reference_url='https://astacala.org/bank-data'
WHERE source_reference_url LIKE '%pmpa.astacala.org%';

UPDATE public.hiking_checkpoints c
SET source_reference_url='https://astacala.org/bank-data', updated_at=now()
FROM public.hiking_trails t
WHERE t.trail_id=c.trail_id
  AND t.route_source_id='4b0ca5c7-0edb-4f06-a03e-470556f36974';
