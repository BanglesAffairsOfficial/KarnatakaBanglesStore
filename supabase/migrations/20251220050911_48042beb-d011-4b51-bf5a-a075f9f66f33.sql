-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shop_name text,
ADD COLUMN IF NOT EXISTS gst_no text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS transport_name text,
ADD COLUMN IF NOT EXISTS profile_pic_url text;

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pics', 'profile-pics', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile pictures
CREATE POLICY "Users can upload their own profile pic"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'profile-pics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pic"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'profile-pics' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile pics are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pics');

CREATE POLICY "Users can delete their own profile pic"
ON storage.objects
FOR DELETE
USING (bucket_id = 'profile-pics' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage bucket for bangle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('bangle-images', 'bangle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for bangle images (admin only)
CREATE POLICY "Admins can upload bangle images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'bangle-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update bangle images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'bangle-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Bangle images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'bangle-images');

CREATE POLICY "Admins can delete bangle images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'bangle-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
