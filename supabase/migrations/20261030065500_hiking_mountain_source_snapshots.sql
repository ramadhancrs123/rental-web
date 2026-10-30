
CREATE TABLE IF NOT EXISTS public.hiking_mountain_source_snapshots (
  source_snapshot_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mountain_id uuid NOT NULL REFERENCES public.hiking_mountains(mountain_id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.hiking_data_sources(source_id) ON DELETE RESTRICT,
  manifest_sha256 text NOT NULL,
  manifest_schema_version text NOT NULL,
  manifest_retrieved_at date NOT NULL,
  source_row jsonb NOT NULL,
  content_sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hiking_mountain_source_snapshots_manifest_hash CHECK (manifest_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT hiking_mountain_source_snapshots_content_hash CHECK (content_sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT hiking_mountain_source_snapshots_json_object CHECK (jsonb_typeof(source_row)='object'),
  CONSTRAINT hiking_mountain_source_snapshots_unique_manifest UNIQUE(mountain_id,manifest_sha256)
);
CREATE INDEX IF NOT EXISTS hiking_mountain_source_snapshots_source_idx
  ON public.hiking_mountain_source_snapshots(source_id,manifest_retrieved_at DESC);
ALTER TABLE public.hiking_mountain_source_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hiking_mountain_source_snapshots FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.hiking_mountain_source_snapshots TO service_role;
CREATE POLICY hiking_mountain_source_snapshots_deny_client_roles
  ON public.hiking_mountain_source_snapshots
  FOR ALL TO anon,authenticated
  USING(false) WITH CHECK(false);
