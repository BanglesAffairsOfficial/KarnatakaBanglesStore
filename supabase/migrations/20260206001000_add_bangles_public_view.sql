-- Public bangles view with wholesale price protection

CREATE OR REPLACE FUNCTION public.can_wholesale(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT uid IS NOT NULL
    AND (
      public.has_role('admin', uid)
      OR EXISTS (
        SELECT 1
        FROM public.b2b_requests br
        WHERE br.user_id = uid
          AND br.status = 'approved'
      )
    );
$$;

CREATE OR REPLACE VIEW public.bangles_public AS
SELECT
  b.id,
  b.name,
  b.description,
  CASE
    WHEN public.can_wholesale(auth.uid()::uuid) THEN b.price
    ELSE COALESCE(b.retail_price, b.price)
  END AS price,
  COALESCE(b.retail_price, b.price) AS retail_price,
  b.image_url,
  b.secondary_image_url,
  b.available_sizes,
  b.available_colors,
  b.is_active,
  b.created_at,
  b.updated_at,
  b.category_id,
  b.number_of_stock
FROM public.bangles b
WHERE b.is_active = true OR public.has_role('admin', auth.uid()::uuid);

-- Prevent direct public select from base table
DROP POLICY IF EXISTS bangles_select_public ON public.bangles;

-- Optional explicit admin select policy (admins already covered by bangles_manage_admins)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'bangles' AND policyname = 'bangles_select_admins'
  ) THEN
    CREATE POLICY bangles_select_admins
      ON public.bangles
      FOR SELECT
      USING (public.has_role('admin', auth.uid()::uuid));
  END IF;
END$$;

-- Grant view access to public roles
GRANT SELECT ON public.bangles_public TO anon, authenticated;

-- Revoke direct base table select from public roles
REVOKE SELECT ON public.bangles FROM anon, authenticated;
