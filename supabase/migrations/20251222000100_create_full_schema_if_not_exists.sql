-- Idempotent schema bootstrap for a fresh Supabase project.
-- Run this in Supabase SQL editor (or adapt into your migration pipeline).

-- Ensure required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
  END IF;
END$$;

-- Create user_roles mapping table (tracks which user is admin)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  PRIMARY KEY (user_id, role)
);

-- Helper: has_role(role, user_uuid) -> boolean
CREATE OR REPLACE FUNCTION public.has_role(r public.app_role, u uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u AND ur.role = r);
$$;

-- A generic trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles table (basic shape, references auth.users where possible)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_profiles') THEN
    CREATE TRIGGER trg_set_updated_at_profiles
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- Settings table (single-row store for site settings)
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text,
  whatsapp_number text,
  social_links jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_settings') THEN
    CREATE TRIGGER trg_set_updated_at_settings
      BEFORE UPDATE ON public.settings
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- Hero slides
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  subtitle text,
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_hero_slides') THEN
    CREATE TRIGGER trg_set_updated_at_hero_slides
      BEFORE UPDATE ON public.hero_slides
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- Bangles (products)
CREATE TABLE IF NOT EXISTS public.bangles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  price numeric(10,2) DEFAULT 0,
  images jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_bangles') THEN
    CREATE TRIGGER trg_set_updated_at_bangles
      BEFORE UPDATE ON public.bangles
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- Orders and order_items
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  total numeric(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_orders') THEN
    CREATE TRIGGER trg_set_updated_at_orders
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  bangle_id uuid REFERENCES public.bangles(id) ON DELETE SET NULL,
  quantity integer DEFAULT 1,
  unit_price numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_order_items') THEN
    CREATE TRIGGER trg_set_updated_at_order_items
      BEFORE UPDATE ON public.order_items
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- Delivery addresses
CREATE TABLE IF NOT EXISTS public.delivery_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text,
  address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_delivery_addresses') THEN
    CREATE TRIGGER trg_set_updated_at_delivery_addresses
      BEFORE UPDATE ON public.delivery_addresses
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END$$;

-- Enable RLS for tables that commonly need it (profiles, settings, bangles are read by clients)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bangles ENABLE ROW LEVEL SECURITY;

-- Example policies: adjust as needed for your app. These policies allow SELECT to authenticated users and full access to admins.
-- Note: policies referencing auth.uid() assume your Supabase auth is in use.

DO $$
BEGIN
  -- Profiles: allow users to read their own profile, admins can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_select_authenticated') THEN
    CREATE POLICY profiles_select_authenticated
      ON public.profiles
      FOR SELECT
      USING (auth.role() = 'authenticated' OR public.has_role('admin', auth.uid()::uuid));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_manage_admins') THEN
    CREATE POLICY profiles_manage_admins
      ON public.profiles
      FOR ALL
      USING (public.has_role('admin', auth.uid()::uuid))
      WITH CHECK (public.has_role('admin', auth.uid()::uuid));
  END IF;

  -- Settings: admins only for write, everyone can select (adjust as desired)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'settings_select_public') THEN
    CREATE POLICY settings_select_public
      ON public.settings
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'settings_manage_admins') THEN
    CREATE POLICY settings_manage_admins
      ON public.settings
      FOR ALL
      USING (public.has_role('admin', auth.uid()::uuid))
      WITH CHECK (public.has_role('admin', auth.uid()::uuid));
  END IF;

  -- Bangles: public read, admins manage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bangles' AND policyname = 'bangles_select_public') THEN
    CREATE POLICY bangles_select_public
      ON public.bangles
      FOR SELECT
      USING (is_active = true OR public.has_role('admin', auth.uid()::uuid));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bangles' AND policyname = 'bangles_manage_admins') THEN
    CREATE POLICY bangles_manage_admins
      ON public.bangles
      FOR ALL
      USING (public.has_role('admin', auth.uid()::uuid))
      WITH CHECK (public.has_role('admin', auth.uid()::uuid));
  END IF;
END$$;

-- Seed a default settings row if none exists
INSERT INTO public.settings (site_name, whatsapp_number, social_links)
SELECT 'Online Bangles Site', '', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.settings);

-- Done. You can now run this file in Supabase SQL editor or include it in your migration pipeline.

