CREATE INDEX IF NOT EXISTS hiking_checkpoint_candidates_reviewed_by_admin_idx
  ON public.hiking_checkpoint_candidates(reviewed_by_admin_id)
  WHERE reviewed_by_admin_id IS NOT NULL;