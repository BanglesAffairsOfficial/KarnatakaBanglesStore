-- Decrement stock after order creation

CREATE OR REPLACE FUNCTION public.decrement_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bangles b
  SET number_of_stock = GREATEST(COALESCE(b.number_of_stock, 0) - s.qty, 0)
  FROM (
    SELECT bangle_id, SUM(GREATEST(quantity - COALESCE(cancelled_qty, 0), 0))::integer AS qty
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY bangle_id
  ) s
  WHERE b.id = s.bangle_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid) TO authenticated, anon;
