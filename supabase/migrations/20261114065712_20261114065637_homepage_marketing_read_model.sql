-- Public-safe marketing flags and rental tolerance for the homepage.
-- Exposes only customer-facing benefit availability, never discount rules or amounts.

CREATE OR REPLACE VIEW public.v_public_home_marketing
WITH (security_barrier = true)
AS
SELECT
  u.slug AS usaha_slug,
  coalesce(u.default_tolerance_hours, 10)::numeric(6, 2) AS tolerance_hours,
  EXISTS (
    SELECT 1
    FROM public.program_loyalitas AS loyalty
    WHERE loyalty.usaha_id = u.usaha_id
      AND loyalty.is_enabled IS TRUE
      AND (loyalty.valid_from IS NULL OR loyalty.valid_from <= now())
      AND (loyalty.valid_until IS NULL OR loyalty.valid_until >= now())
  ) AS loyalty_program_enabled,
  EXISTS (
    SELECT 1
    FROM public.kebijakan_diskon_checkout AS checkout_policy
    WHERE checkout_policy.usaha_id = u.usaha_id
      AND checkout_policy.manual_discount_enabled IS TRUE
  ) AS checkout_manual_discount_enabled
FROM public.usaha AS u
WHERE u.status = 'active';

REVOKE ALL ON TABLE public.v_public_home_marketing FROM PUBLIC;
REVOKE ALL ON TABLE public.v_public_home_marketing FROM anon, authenticated;
GRANT SELECT ON TABLE public.v_public_home_marketing TO anon, authenticated;

COMMENT ON VIEW public.v_public_home_marketing IS
  'Customer-safe homepage marketing projection: active business tolerance and availability flags only. Does not expose discount percentages, amounts, loyalty thresholds, or internal checkout policy limits.';
