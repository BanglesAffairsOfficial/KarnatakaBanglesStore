-- Idempotent migration: ensure app_role enum, normalize user_roles, add has_role(), and fix RLS policies

-- 1) Ensure app_role enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
  END IF;
END$$;

-- 2) Ensure user_roles table exists with (user_id, role) mapping or at least an index
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_roles' AND relnamespace = 'public'::regnamespace) THEN
    CREATE TABLE public.user_roles (
      user_id uuid NOT NULL,
      role public.app_role NOT NULL,
      PRIMARY KEY (user_id, role)
    );
  ELSE
    -- Ensure there's a uniqueness constraint/index for (user_id, role)
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE tablename = 'user_roles' AND indexname = 'user_roles_user_role_idx'
    ) THEN
      CREATE UNIQUE INDEX user_roles_user_role_idx ON public.user_roles (user_id, role);
    END IF;
  END IF;
END$$;

-- 3) Create or replace helper function public.has_role(_user_id, _role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = _role);
$$;

-- 4) Update / recreate RLS policies to call public.has_role(auth.uid()::uuid, 'admin'::public.app_role)
-- Profiles: select policy
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

DROP POLICY IF EXISTS profiles_manage_admins ON public.profiles;
CREATE POLICY profiles_manage_admins
  ON public.profiles
  FOR ALL
  USING (public.has_role(auth.uid()::uuid, 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

-- Settings: allow public select, admin manage
DROP POLICY IF EXISTS settings_select_public ON public.settings;
CREATE POLICY settings_select_public
  ON public.settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS settings_manage_admins ON public.settings;
CREATE POLICY settings_manage_admins
  ON public.settings
  FOR ALL
  USING (public.has_role(auth.uid()::uuid, 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

-- Bangles: public read, admins manage
DROP POLICY IF EXISTS bangles_select_public ON public.bangles;
CREATE POLICY bangles_select_public
  ON public.bangles
  FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

DROP POLICY IF EXISTS bangles_manage_admins ON public.bangles;
CREATE POLICY bangles_manage_admins
  ON public.bangles
  FOR ALL
  USING (public.has_role(auth.uid()::uuid, 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

-- Hero slides admin policy
DROP POLICY IF EXISTS "Admins can manage hero slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero slides"
  ON public.hero_slides
  FOR ALL
  USING (public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

-- Storage policies for bangle images (if storage extension present)
-- Use quoted policy names as in previous migrations
DROP POLICY IF EXISTS "Admins can upload bangle images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update bangle images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete bangle images" ON storage.objects;

-- Re-create storage policies if the storage schema exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'storage') THEN
    CREATE POLICY "Admins can upload bangle images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'bangle-images' AND public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

    CREATE POLICY "Admins can update bangle images"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'bangle-images' AND public.has_role(auth.uid()::uuid, 'admin'::public.app_role));

    CREATE POLICY "Bangle images are publicly accessible"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'bangle-images');

    CREATE POLICY "Admins can delete bangle images"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'bangle-images' AND public.has_role(auth.uid()::uuid, 'admin'::public.app_role));
  END IF;
END$$;

-- Done
COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS 'Helper: returns true if user has the given role in public.user_roles';
