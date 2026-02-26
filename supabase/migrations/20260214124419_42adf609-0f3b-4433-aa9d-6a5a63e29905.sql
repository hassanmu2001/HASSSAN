
-- Create storage bucket for service photos
INSERT INTO storage.buckets (id, name, public) VALUES ('service-photos', 'service-photos', true);

-- Allow anyone to view service photos
CREATE POLICY "Service photos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'service-photos');

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "Providers can upload service photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow providers to update their own photos
CREATE POLICY "Providers can update own photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow providers to delete their own photos
CREATE POLICY "Providers can delete own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'service-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
