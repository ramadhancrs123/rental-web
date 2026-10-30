
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hiking_route_candidates' AND policyname='hiking_route_candidates_deny_client_roles') THEN
    CREATE POLICY hiking_route_candidates_deny_client_roles
      ON public.hiking_route_candidates
      FOR ALL TO anon, authenticated
      USING (false) WITH CHECK (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hiking_checkpoint_candidates' AND policyname='hiking_checkpoint_candidates_deny_client_roles') THEN
    CREATE POLICY hiking_checkpoint_candidates_deny_client_roles
      ON public.hiking_checkpoint_candidates
      FOR ALL TO anon, authenticated
      USING (false) WITH CHECK (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hiking_route_versions' AND policyname='hiking_route_versions_deny_client_roles') THEN
    CREATE POLICY hiking_route_versions_deny_client_roles
      ON public.hiking_route_versions
      FOR ALL TO anon, authenticated
      USING (false) WITH CHECK (false);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='hiking_admin_audit' AND policyname='hiking_admin_audit_deny_client_roles') THEN
    CREATE POLICY hiking_admin_audit_deny_client_roles
      ON public.hiking_admin_audit
      FOR ALL TO anon, authenticated
      USING (false) WITH CHECK (false);
  END IF;
END
$$;
