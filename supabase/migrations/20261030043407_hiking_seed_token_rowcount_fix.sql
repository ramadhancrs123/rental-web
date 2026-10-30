CREATE OR REPLACE FUNCTION public.hiking_consume_seed_token(p_token_hash text,p_action text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_rows integer := 0;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' OR p_action IS NULL OR length(p_action)>40 THEN RETURN false; END IF;
  UPDATE app_private.hiking_seed_tokens
  SET remaining_uses=remaining_uses-1,last_used_at=pg_catalog.now()
  WHERE token_hash=p_token_hash AND p_action=ANY(allowed_actions) AND remaining_uses>0 AND expires_at>pg_catalog.now();
  GET DIAGNOSTICS v_rows=ROW_COUNT;
  RETURN v_rows>0;
END; $function$;

CREATE OR REPLACE FUNCTION public.hiking_validate_refresh_token(p_token_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE v_rows integer := 0;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN RETURN false; END IF;
  UPDATE app_private.hiking_refresh_tokens SET last_used_at=pg_catalog.now()
  WHERE token_hash=p_token_hash AND enabled IS TRUE;
  GET DIAGNOSTICS v_rows=ROW_COUNT;
  RETURN v_rows>0;
END; $function$;
REVOKE ALL ON FUNCTION public.hiking_consume_seed_token(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hiking_consume_seed_token(text,text) TO service_role;
REVOKE ALL ON FUNCTION public.hiking_validate_refresh_token(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.hiking_validate_refresh_token(text) TO service_role;
