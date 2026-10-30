-- Preserve unknown volcanic classification instead of silently treating it as non-volcanic.
ALTER TABLE public.hiking_mountains
  ALTER COLUMN is_volcanic DROP NOT NULL,
  ALTER COLUMN is_volcanic DROP DEFAULT;
ALTER TABLE public.hiking_mountains DROP CONSTRAINT IF EXISTS hiking_volcanic_status_consistency;
ALTER TABLE public.hiking_mountains ADD CONSTRAINT hiking_volcanic_status_consistency
  CHECK (is_volcanic IS NULL OR (is_volcanic IS TRUE AND volcanic_status <> 'not_applicable') OR (is_volcanic IS FALSE AND volcanic_status = 'not_applicable'));

CREATE OR REPLACE VIEW public.v_public_hiking_mountains
WITH (security_invoker = true, security_barrier = true) AS
SELECT m.mountain_id,m.code,m.slug,m.name,m.aliases,m.description,m.elevation_m,m.province,m.regency,m.latitude,m.longitude,m.is_volcanic,
  CASE WHEN m.is_volcanic IS TRUE THEN COALESCE(m.volcanic_status,'unknown'::text)
       WHEN m.is_volcanic IS FALSE THEN 'not_applicable'::text ELSE 'unknown'::text END AS volcanic_status,
  m.volcanic_status_source_url,m.volcanic_status_checked_at,o.name AS operator_name,o.website_url AS operator_website_url,m.verified_at,
  ARRAY(SELECT wa.adm4_code FROM public.hiking_mountain_weather_areas mwa
        JOIN public.hiking_weather_areas wa ON wa.weather_area_id=mwa.weather_area_id
        WHERE mwa.mountain_id=m.mountain_id AND wa.is_active
        ORDER BY mwa.is_primary DESC,wa.province_name,wa.regency_name,wa.village_name) AS bmkg_adm4_codes
FROM public.hiking_mountains m
LEFT JOIN public.hiking_operators o ON o.operator_id=m.operator_id AND o.is_public AND o.verification_status='verified'
WHERE m.publication_status='published';

ALTER TABLE public.hiking_mountain_weather_areas
  ADD COLUMN IF NOT EXISTS selection_basis text,
  ADD COLUMN IF NOT EXISTS mapping_caveat text,
  ADD COLUMN IF NOT EXISTS mapping_checked_at timestamptz;
ALTER TABLE public.hiking_weather_areas
  ADD COLUMN IF NOT EXISTS reference_elevation_evidence jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.hiking_route_candidates (
  route_candidate_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mountain_id uuid NOT NULL REFERENCES public.hiking_mountains(mountain_id) ON DELETE CASCADE,
  import_id uuid NOT NULL REFERENCES public.hiking_route_imports(import_id) ON DELETE CASCADE,
  candidate_code text NOT NULL, source_track_index integer NOT NULL, source_track_name text,
  source_type text NOT NULL DEFAULT 'track', segment_count integer NOT NULL, point_count integer NOT NULL,
  distance_m integer, elevation_min_candidate_m numeric, elevation_max_candidate_m numeric,
  elevation_coverage_percent numeric NOT NULL DEFAULT 0, route_geojson jsonb NOT NULL,
  trail_association_status text NOT NULL DEFAULT 'not_assigned_to_public_trail',
  verification_status text NOT NULL DEFAULT 'candidate_requires_review',
  source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hiking_route_candidates_code_nonempty CHECK (length(btrim(candidate_code)) BETWEEN 1 AND 120),
  CONSTRAINT hiking_route_candidates_source_type CHECK (source_type IN ('track','route')),
  CONSTRAINT hiking_route_candidates_segment_count CHECK (segment_count > 0),
  CONSTRAINT hiking_route_candidates_point_count CHECK (point_count >= 2),
  CONSTRAINT hiking_route_candidates_distance CHECK (distance_m IS NULL OR distance_m >= 0),
  CONSTRAINT hiking_route_candidates_elevation_coverage CHECK (elevation_coverage_percent BETWEEN 0 AND 100),
  CONSTRAINT hiking_route_candidates_geojson_type CHECK (jsonb_typeof(route_geojson)='object' AND route_geojson->>'type'='MultiLineString' AND jsonb_typeof(route_geojson->'coordinates')='array'),
  CONSTRAINT hiking_route_candidates_association CHECK (trail_association_status IN ('not_assigned_to_public_trail','candidate_association','reviewed_association')),
  CONSTRAINT hiking_route_candidates_verification CHECK (verification_status IN ('candidate_requires_review','needs_correction','reviewed_candidate','rejected')),
  CONSTRAINT hiking_route_candidates_elevation_range CHECK (elevation_min_candidate_m IS NULL OR elevation_max_candidate_m IS NULL OR elevation_min_candidate_m<=elevation_max_candidate_m),
  CONSTRAINT hiking_route_candidates_import_code_key UNIQUE (import_id,candidate_code)
);

CREATE TABLE IF NOT EXISTS public.hiking_checkpoint_candidates (
  checkpoint_candidate_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mountain_id uuid NOT NULL REFERENCES public.hiking_mountains(mountain_id) ON DELETE CASCADE,
  import_id uuid NOT NULL REFERENCES public.hiking_route_imports(import_id) ON DELETE CASCADE,
  candidate_code text NOT NULL, source_index integer NOT NULL, name text NOT NULL,
  checkpoint_type_candidate text NOT NULL DEFAULT 'waypoint',
  location_role_candidate text NOT NULL DEFAULT 'unknown',
  latitude numeric NOT NULL, longitude numeric NOT NULL,
  gpx_elevation_m numeric, waypoint_label_elevation_m numeric, candidate_elevation_m numeric,
  verified_elevation_m integer,
  elevation_verification_status text NOT NULL DEFAULT 'pending_review',
  trail_association_status text NOT NULL DEFAULT 'not_assigned_to_public_trail',
  source_reference_url text, source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by_admin_id uuid REFERENCES public.akun_admin(akun_admin_id) ON DELETE SET NULL,
  reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hiking_checkpoint_candidates_code_key UNIQUE (import_id,candidate_code),
  CONSTRAINT hiking_checkpoint_candidates_source_index CHECK (source_index>0),
  CONSTRAINT hiking_checkpoint_candidates_name CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  CONSTRAINT hiking_checkpoint_candidates_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT hiking_checkpoint_candidates_longitude CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT hiking_checkpoint_candidates_elevation_status CHECK (elevation_verification_status IN
    ('pending_review','dem_cross_checked_consistent_pending_ground_truth','track_profile_dem_corroborated_pending_manual_review',
     'dem_only_estimate_pending_manual_review','source_elevation_value_suspicious_pending_review',
     'dem_models_disagree_pending_review','gpx_waypoint_and_name_label_conflict','verified','rejected')),
  CONSTRAINT hiking_checkpoint_candidates_verified_provenance CHECK (
    verified_elevation_m IS NULL OR (elevation_verification_status='verified' AND reviewed_by_admin_id IS NOT NULL
      AND reviewed_at IS NOT NULL AND source_reference_url ~* '^https://')
  )
);

CREATE INDEX IF NOT EXISTS hiking_route_candidates_mountain_created_idx ON public.hiking_route_candidates(mountain_id,created_at DESC);
CREATE INDEX IF NOT EXISTS hiking_route_candidates_import_idx ON public.hiking_route_candidates(import_id);
CREATE INDEX IF NOT EXISTS hiking_checkpoint_candidates_mountain_name_idx ON public.hiking_checkpoint_candidates(mountain_id,lower(name));
CREATE INDEX IF NOT EXISTS hiking_checkpoint_candidates_import_idx ON public.hiking_checkpoint_candidates(import_id);
ALTER TABLE public.hiking_route_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiking_checkpoint_candidates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hiking_route_candidates FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.hiking_checkpoint_candidates FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hiking_route_candidates TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hiking_checkpoint_candidates TO service_role;

CREATE TABLE IF NOT EXISTS app_private.hiking_seed_tokens (
  token_hash text PRIMARY KEY, allowed_actions text[] NOT NULL, remaining_uses integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz,
  CONSTRAINT hiking_seed_tokens_hash_format CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT hiking_seed_tokens_remaining_uses CHECK (remaining_uses>=0),
  CONSTRAINT hiking_seed_tokens_actions CHECK (cardinality(allowed_actions)>0)
);
ALTER TABLE app_private.hiking_seed_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.hiking_seed_tokens FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON app_private.hiking_seed_tokens TO service_role;

CREATE TABLE IF NOT EXISTS app_private.hiking_refresh_tokens (
  token_hash text PRIMARY KEY, enabled boolean NOT NULL DEFAULT true, purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz,
  CONSTRAINT hiking_refresh_tokens_hash_format CHECK (token_hash ~ '^[0-9a-f]{64}$')
);
ALTER TABLE app_private.hiking_refresh_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.hiking_refresh_tokens FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON app_private.hiking_refresh_tokens TO service_role;

CREATE OR REPLACE FUNCTION public.hiking_consume_seed_token(p_token_hash text,p_action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_consumed boolean:=false;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' OR p_action IS NULL OR length(p_action)>40 THEN RETURN false; END IF;
  UPDATE app_private.hiking_seed_tokens SET remaining_uses=remaining_uses-1,last_used_at=pg_catalog.now()
  WHERE token_hash=p_token_hash AND p_action=ANY(allowed_actions) AND remaining_uses>0 AND expires_at>pg_catalog.now();
  GET DIAGNOSTICS v_consumed=ROW_COUNT;
  RETURN v_consumed;
END; $function$;

CREATE OR REPLACE FUNCTION public.hiking_validate_refresh_token(p_token_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_valid boolean:=false;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  UPDATE app_private.hiking_refresh_tokens SET last_used_at=pg_catalog.now() WHERE token_hash=p_token_hash AND enabled IS TRUE;
  GET DIAGNOSTICS v_valid=ROW_COUNT;
  RETURN v_valid;
END; $function$;

REVOKE ALL ON FUNCTION public.hiking_consume_seed_token(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hiking_consume_seed_token(text,text) TO service_role;
REVOKE ALL ON FUNCTION public.hiking_validate_refresh_token(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hiking_validate_refresh_token(text) TO service_role;
