-- Keep the public view invoker-safe while exposing only customer-facing flags.
-- Private source tables remain hidden behind a fixed, no-argument projection.

CREATE OR REPLACE FUNCTION app_private.get_public_home_marketing()
RETURNS TABLE (
  usaha_slug text,
  tolerance_hours numeric(6, 2),
  loyalty_program_enabled boolean,
  checkout_manual_discount_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    u.slug AS usaha_slug,
    coalesce(u.default_tolerance_hours, 10)::numeric(6, 2) AS tolerance_hours,
    EXISTS (
      SELECT 1
      FROM public.program_loyalitas AS loyalty
      WHERE loyalty.usaha_id = u.usaha_id
        AND loyalty.is_enabled IS TRUE
        AND (loyalty.valid_from IS NULL OR loyalty.valid_from <= pg_catalog.now())
        AND (loyalty.valid_until IS NULL OR loyalty.valid_until >= pg_catalog.now())
    ) AS loyalty_program_enabled,
    EXISTS (
      SELECT 1
      FROM public.kebijakan_diskon_checkout AS checkout_policy
      WHERE checkout_policy.usaha_id = u.usaha_id
        AND checkout_policy.manual_discount_enabled IS TRUE
    ) AS checkout_manual_discount_enabled
  FROM public.usaha AS u
  WHERE u.status = 'active';
$function$;

REVOKE ALL ON FUNCTION app_private.get_public_home_marketing()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION app_private.get_public_home_marketing()
  TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_public_home_marketing
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  marketing.usaha_slug,
  marketing.tolerance_hours::numeric(6, 2) AS tolerance_hours,
  marketing.loyalty_program_enabled,
  marketing.checkout_manual_discount_enabled
FROM app_private.get_public_home_marketing() AS marketing;

REVOKE ALL ON TABLE public.v_public_home_marketing FROM PUBLIC;
REVOKE ALL ON TABLE public.v_public_home_marketing FROM anon, authenticated;
GRANT SELECT ON TABLE public.v_public_home_marketing TO anon, authenticated;

COMMENT ON FUNCTION app_private.get_public_home_marketing() IS
  'Returns only active-business homepage benefit flags and default tolerance. Discount amounts, percentages, loyalty thresholds, and internal policy limits remain private.';

COMMENT ON VIEW public.v_public_home_marketing IS
  'Invoker-safe public marketing projection. Uses a restricted private helper and exposes only active-business benefit availability and tolerance.';

NOTIFY pgrst, 'reload schema';
