-- Add stock field to bangles table
ALTER TABLE public.bangles
ADD COLUMN IF NOT EXISTS number_of_stock integer DEFAULT 0;

-- Create an index on stock for filtering
CREATE INDEX IF NOT EXISTS idx_bangles_stock ON public.bangles(number_of_stock);

-- Add comment for documentation
COMMENT ON COLUMN public.bangles.number_of_stock IS 'Total available stock for this bangle product';
