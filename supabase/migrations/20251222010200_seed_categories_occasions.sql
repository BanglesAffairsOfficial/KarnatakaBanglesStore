-- Seed initial categories and occasions
INSERT INTO public.categories (name, description, display_order, is_active)
VALUES
  ('Glass Bangles', 'Classic glass bangles collection', 1, true),
  ('Silk Thread', 'Silk thread bangles', 2, true),
  ('Lac Bangles', 'Lac collections', 3, true),
  ('Bridal Collection', 'Special bridal pieces', 4, true),
  ('Oxidized', 'Oxidized style bangles', 5, true),
  ('Kids Special', 'Designs for kids', 6, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.occasions (name, description, display_order, is_active)
VALUES
  ('Wedding', 'Perfect for your special day', 1, true),
  ('Festival', 'Celebrate in style', 2, true),
  ('Daily Wear', 'Everyday elegance', 3, true),
  ('Party', 'Stand out at events', 4, true)
ON CONFLICT (name) DO NOTHING;
