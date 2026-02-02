-- Add social links, whatsapp, email and logo_url to settings table (idempotent)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS instagram_link text,
  ADD COLUMN IF NOT EXISTS facebook_link text,
  ADD COLUMN IF NOT EXISTS twitter_link text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Ensure there is a single settings row (single-row store)
INSERT INTO public.settings (site_name, whatsapp_number, social_links, email, logo_url)
SELECT 'Online Bangles Site', '', '{}'::jsonb, '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- Create storage buckets if missing
-- Note: running these requires privileges; alternatively create buckets in the Supabase dashboard
INSERT INTO storage.buckets (id, name, public)
VALUES ('bangle-images', 'bangle-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pics', 'profile-pics', true)
ON CONFLICT (id) DO NOTHING;

-- (Optional) You can add storage policies here if desired; many projects configure policies via the Dashboard
