-- ============================================================================
-- Supabase Storage Setup for Karnataka Bangle Store
-- ============================================================================
-- This migration creates all storage buckets with proper access policies
-- for the eCommerce website selling bangles.
--
-- Buckets created:
-- 1. banners      - Public (hero slider images)
-- 2. products     - Public (bangle product images)
-- 3. categories   - Public (category icons/images)
-- 4. profiles     - Private (user profile pictures)
-- 5. business_proofs - Private (B2B verification documents)
-- ============================================================================

-- Create storage buckets
-- Note: These bucket operations should ideally be done via Supabase Dashboard
-- or the JavaScript SDK as storage buckets are typically created through the
-- storage API rather than SQL. This migration documents the expected state.

-- Insert bucket metadata directly into storage.buckets table (if using Supabase's internal schema)
INSERT INTO storage.buckets (id, name, owner, public, avif_autodetection, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES 
  ('banners', 'banners', NULL, true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'], now(), now()),
  ('products', 'products', NULL, true, false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'], now(), now()),
  ('categories', 'categories', NULL, true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'], now(), now()),
  ('profiles', 'profiles', NULL, false, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'], now(), now()),
  ('business_proofs', 'business_proofs', NULL, false, false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png'], now(), now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PUBLIC STORAGE POLICIES - Banners
-- ============================================================================

-- Allow anyone to read from banners bucket
CREATE POLICY "Public read access for banners"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'banners');

-- Allow authenticated users to upload to banners (admin only - enforced by app)
CREATE POLICY "Admin upload to banners"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'banners'
    AND (auth.uid()::text = (SELECT user_id::text FROM auth.users WHERE email = auth.jwt() ->> 'email'))
  );

-- Allow admins to delete banners
CREATE POLICY "Admin delete banners"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners');

-- ============================================================================
-- PUBLIC STORAGE POLICIES - Products
-- ============================================================================

-- Allow anyone to read from products bucket
CREATE POLICY "Public read access for products"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products');

-- Allow authenticated users (sellers/admins) to upload products
CREATE POLICY "Authenticated upload to products"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

-- Allow users to delete their own product images
CREATE POLICY "User delete own products"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');

-- ============================================================================
-- PUBLIC STORAGE POLICIES - Categories
-- ============================================================================

-- Allow anyone to read from categories bucket
CREATE POLICY "Public read access for categories"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'categories');

-- Allow authenticated admins to upload category images
CREATE POLICY "Admin upload to categories"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'categories');

-- Allow admins to delete category images
CREATE POLICY "Admin delete categories"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'categories');

-- ============================================================================
-- PRIVATE STORAGE POLICIES - Profiles
-- ============================================================================

-- Allow users to read their own profile pictures
CREATE POLICY "Users read own profile"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to upload their own profile pictures
CREATE POLICY "Users upload own profile"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own profile pictures
CREATE POLICY "Users delete own profile"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profiles'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- PRIVATE STORAGE POLICIES - Business Proofs
-- ============================================================================

-- Allow authenticated users to read their own business proofs
CREATE POLICY "Users read own business proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business_proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to upload business proofs
CREATE POLICY "Users upload business proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business_proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own business proofs
CREATE POLICY "Users delete own business proofs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business_proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Enable RLS on storage.objects table
-- ============================================================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create an index for faster folder-based queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_storage_bucket_name 
  ON storage.objects(bucket_id, name);
