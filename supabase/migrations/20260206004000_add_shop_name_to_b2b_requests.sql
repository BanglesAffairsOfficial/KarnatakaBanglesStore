-- Add shop name to b2b_requests
ALTER TABLE public.b2b_requests
  ADD COLUMN IF NOT EXISTS shop_name text;
