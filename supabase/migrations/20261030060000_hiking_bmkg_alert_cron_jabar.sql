
DO $migration$
DECLARE
  v_secret text;
  v_hash text;
  v_job_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'hiking_internal_refresh_token'
  LIMIT 1;

  IF v_secret IS NULL THEN
    v_secret := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
    v_hash := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(v_secret, 'UTF8'), 'sha256'
    ), 'hex');

    INSERT INTO app_private.hiking_refresh_tokens(token_hash, enabled, purpose)
    VALUES (v_hash, true, 'Supabase Cron: BMKG Jawa Barat CAP refresh')
    ON CONFLICT (token_hash) DO UPDATE
      SET enabled = true, purpose = EXCLUDED.purpose;

    PERFORM vault.create_secret(
      v_secret,
      'hiking_internal_refresh_token',
      'Private token used only by pg_cron to invoke the protected BMKG Jawa Barat alert refresh.'
    );
  ELSE
    v_hash := pg_catalog.encode(extensions.digest(
      pg_catalog.convert_to(v_secret, 'UTF8'), 'sha256'
    ), 'hex');

    INSERT INTO app_private.hiking_refresh_tokens(token_hash, enabled, purpose)
    VALUES (v_hash, true, 'Supabase Cron: BMKG Jawa Barat CAP refresh')
    ON CONFLICT (token_hash) DO UPDATE
      SET enabled = true, purpose = EXCLUDED.purpose;
  END IF;

  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname = 'hiking-bmkg-alerts-jawa-barat';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'hiking-bmkg-alerts-jawa-barat',
    '* * * * *',
    $cron$
      SELECT net.http_get(
        url := 'https://nbirkybutpvtrqifaxlt.supabase.co/functions/v1/hiking-weather-alerts?province=Jawa%20Barat&refresh=1',
        headers := jsonb_build_object(
          'Accept', 'application/json',
          'x-akasha-refresh-token',
          (SELECT decrypted_secret
           FROM vault.decrypted_secrets
           WHERE name = 'hiking_internal_refresh_token'
           LIMIT 1)
        ),
        timeout_milliseconds := 15000
      ) AS request_id;
    $cron$
  );
END;
$migration$;
