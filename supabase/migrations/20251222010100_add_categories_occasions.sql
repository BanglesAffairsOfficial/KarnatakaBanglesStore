-- Create categories and occasions tables and link to bangles
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Many-to-many relation between bangles and occasions
CREATE TABLE public.bangle_occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bangle_id UUID REFERENCES public.bangles(id) ON DELETE CASCADE NOT NULL,
  occasion_id UUID REFERENCES public.occasions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category reference to bangles
ALTER TABLE public.bangles ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bangle_occasions ENABLE ROW LEVEL SECURITY;

-- Policies: public can view active categories/occasions, admins manage all
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active occasions" ON public.occasions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage occasions" ON public.occasions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage bangle_occasions" ON public.bangle_occasions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp triggers
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_occasions_updated_at
  BEFORE UPDATE ON public.occasions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
