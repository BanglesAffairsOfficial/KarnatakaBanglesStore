-- Allow public select of active reels

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reels' AND policyname = 'reels_select_public'
  ) THEN
    CREATE POLICY reels_select_public
      ON public.reels
      FOR SELECT
      USING (is_active = true OR public.has_role('admin', auth.uid()::uuid));
  END IF;
END$$;
