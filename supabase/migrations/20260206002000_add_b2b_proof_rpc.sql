-- RPC to update business proof for the authenticated user

CREATE OR REPLACE FUNCTION public.update_b2b_proof(p_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.b2b_requests
  SET business_proof_url = p_url,
      shop_name = (SELECT shop_name FROM public.profiles WHERE id = auth.uid()),
      status = CASE WHEN status = 'approved' THEN status ELSE 'pending' END
  WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_b2b_proof(text) TO authenticated;
