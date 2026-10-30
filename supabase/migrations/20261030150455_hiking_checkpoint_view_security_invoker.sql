-- Ensure the public checkpoint view runs with caller privileges and applies base-table RLS.
ALTER VIEW public.v_public_hiking_checkpoints SET (security_invoker = true);
