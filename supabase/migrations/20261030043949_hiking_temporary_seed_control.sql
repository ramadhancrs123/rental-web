CREATE TABLE IF NOT EXISTS app_private.hiking_seed_control (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton IS TRUE),
  enabled boolean NOT NULL DEFAULT false,
  allowed_actions text[] NOT NULL DEFAULT ARRAY[]::text[],
  remaining_calls integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_call_at timestamptz,
  CONSTRAINT hiking_seed_control_remaining CHECK (remaining_calls >= 0)
);
ALTER TABLE app_private.hiking_seed_control ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app_private.hiking_seed_control FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON app_private.hiking_seed_control TO service_role;
INSERT INTO app_private.hiking_seed_control(singleton,enabled,allowed_actions,remaining_calls)
VALUES (true,false,ARRAY[]::text[],0)
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION public.hiking_consume_seed_action(p_action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_rows integer := 0;
BEGIN
  IF p_action IS NULL OR length(p_action)>40 THEN RETURN false; END IF;
  UPDATE app_private.hiking_seed_control
  SET remaining_calls=remaining_calls-1,last_call_at=pg_catalog.now(),updated_at=pg_catalog.now()
  WHERE singleton IS TRUE AND enabled IS TRUE
    AND expires_at IS NOT NULL AND expires_at>pg_catalog.now()
    AND remaining_calls>0 AND p_action=ANY(allowed_actions);
  GET DIAGNOSTICS v_rows=ROW_COUNT;
  RETURN v_rows>0;
END; $function$;
REVOKE ALL ON FUNCTION public.hiking_consume_seed_action(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hiking_consume_seed_action(text) TO service_role;
