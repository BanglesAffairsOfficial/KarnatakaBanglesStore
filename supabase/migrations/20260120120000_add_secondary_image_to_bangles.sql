-- Add a secondary image slot for bangles to support gallery views
ALTER TABLE public.bangles
ADD COLUMN IF NOT EXISTS secondary_image_url TEXT;

COMMENT ON COLUMN public.bangles.secondary_image_url IS 'Optional secondary image for product detail gallery';
