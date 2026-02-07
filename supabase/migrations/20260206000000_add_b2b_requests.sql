-- Add B2B requests table for admin review

CREATE TABLE IF NOT EXISTS public.b2b_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  full_name text,
  phone text,
  gst_number text,
  business_link text,
  business_proof_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_requests_user_id ON public.b2b_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_requests_status ON public.b2b_requests (status);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_b2b_requests') THEN
    CREATE TRIGGER trg_set_updated_at_b2b_requests
      BEFORE UPDATE ON public.b2b_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

ALTER TABLE IF EXISTS public.b2b_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'b2b_requests' AND policyname = 'b2b_requests_select_admin_or_owner') THEN
    CREATE POLICY b2b_requests_select_admin_or_owner
      ON public.b2b_requests
      FOR SELECT
      USING (public.has_role('admin', auth.uid()::uuid) OR user_id = auth.uid()::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'b2b_requests' AND policyname = 'b2b_requests_insert_owner') THEN
    CREATE POLICY b2b_requests_insert_owner
      ON public.b2b_requests
      FOR INSERT
      WITH CHECK (user_id = auth.uid()::uuid);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'b2b_requests' AND policyname = 'b2b_requests_update_admin') THEN
    CREATE POLICY b2b_requests_update_admin
      ON public.b2b_requests
      FOR UPDATE
      USING (public.has_role('admin', auth.uid()::uuid))
      WITH CHECK (public.has_role('admin', auth.uid()::uuid));
  END IF;
END$$;
