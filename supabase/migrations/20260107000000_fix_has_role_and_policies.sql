-- Align has_role signature and admin policies across the schema.

-- Drop any existing has_role overloads to avoid ambiguity.
DROP FUNCTION IF EXISTS public.has_role(public.app_role, uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Canonical role check helper: has_role(user_id, role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Recreate admin policies that referenced the old signature (role, user).
-- Profiles: authenticated can read; admins can manage all.
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated' OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS profiles_manage_admins ON public.profiles;
CREATE POLICY profiles_manage_admins
  ON public.profiles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Settings: admins manage; select policy remains unchanged elsewhere.
DROP POLICY IF EXISTS settings_manage_admins ON public.settings;
CREATE POLICY settings_manage_admins
  ON public.settings
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bangles: public read active items; admins full access.
DROP POLICY IF EXISTS bangles_select_public ON public.bangles;
CREATE POLICY bangles_select_public
  ON public.bangles
  FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS bangles_manage_admins ON public.bangles;
CREATE POLICY bangles_manage_admins
  ON public.bangles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

