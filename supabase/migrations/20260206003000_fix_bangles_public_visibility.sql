-- Fix bangles_public visibility for legacy rows with NULL is_active

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
WHERE COALESCE(b.is_active, true) = true OR public.has_role('admin', auth.uid()::uuid);

-- Backfill any legacy NULL is_active to true
UPDATE public.bangles SET is_active = true WHERE is_active IS NULL;
