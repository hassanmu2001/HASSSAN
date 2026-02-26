
-- Add new verification fields to profiles
ALTER TABLE public.profiles
ADD COLUMN date_of_birth date,
ADD COLUMN national_id text,
ADD COLUMN id_photo_url text,
ADD COLUMN business_name text,
ADD COLUMN business_address text;

-- Create storage bucket for ID photos
INSERT INTO storage.buckets (id, name, public) VALUES ('id-photos', 'id-photos', false);

-- Only authenticated users can upload their own ID photo
CREATE POLICY "Users can upload own ID photo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only the user and admins can view ID photos
CREATE POLICY "Users can view own ID photo"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-photos' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- Users can update their own ID photo
CREATE POLICY "Users can update own ID photo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'id-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own ID photo
CREATE POLICY "Users can delete own ID photo"
ON storage.objects FOR DELETE
USING (bucket_id = 'id-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
