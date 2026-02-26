
-- Add commercial_register_url column to profiles
ALTER TABLE public.profiles ADD COLUMN commercial_register_url text NULL;

-- Create storage bucket for commercial register photos
INSERT INTO storage.buckets (id, name, public) VALUES ('commercial-registers', 'commercial-registers', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for commercial-registers bucket
CREATE POLICY "Users can upload own commercial register"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'commercial-registers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own commercial register"
ON storage.objects FOR SELECT
USING (bucket_id = 'commercial-registers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own commercial register"
ON storage.objects FOR UPDATE
USING (bucket_id = 'commercial-registers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all commercial registers"
ON storage.objects FOR SELECT
USING (bucket_id = 'commercial-registers' AND public.has_role(auth.uid(), 'admin'));
