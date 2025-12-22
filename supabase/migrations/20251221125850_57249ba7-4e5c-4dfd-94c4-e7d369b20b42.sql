-- Create hero_slides table for admin-editable carousel content
CREATE TABLE public.hero_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Anyone can view active slides
CREATE POLICY "Anyone can view active hero slides"
ON public.hero_slides
FOR SELECT
USING (is_active = true);

-- Admins can manage all slides
CREATE POLICY "Admins can manage hero slides"
ON public.hero_slides
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hero_slides_updated_at
BEFORE UPDATE ON public.hero_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();