-- =============================================
-- EVENT MANAGEMENT SYSTEM - STORAGE BUCKETS
-- =============================================

-- Create bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- EVENT IMAGES BUCKET POLICIES
-- =============================================

-- Staff and Admins can upload event images
CREATE POLICY "Staff and Admins can upload event images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Authenticated users can view event images
CREATE POLICY "Authenticated can view event images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-images');

-- Anonymous users can view event images
CREATE POLICY "Anon can view event images"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'event-images');

-- Staff and Admins can update event images
CREATE POLICY "Staff and Admins can update event images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Staff and Admins can delete event images
CREATE POLICY "Staff and Admins can delete event images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- =============================================
-- CERTIFICATES BUCKET POLICIES
-- =============================================

-- Staff and Admins can upload certificates
CREATE POLICY "Staff and Admins can upload certificates"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Staff and Admins can view all certificates
CREATE POLICY "Staff and Admins can view all certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);

-- Staff and Admins can delete certificates
CREATE POLICY "Staff and Admins can delete certificates"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin')
  )
);
