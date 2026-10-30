
DO $migration$
DECLARE v_job_id bigint;
BEGIN
  SELECT jobid INTO v_job_id
  FROM cron.job
  WHERE jobname='hiking-bmkg-alerts-jawa-barat';

  IF v_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(v_job_id);
  END IF;

  PERFORM cron.schedule(
    'hiking-bmkg-alerts-jawa-barat',
    '*/5 * * * *',
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
