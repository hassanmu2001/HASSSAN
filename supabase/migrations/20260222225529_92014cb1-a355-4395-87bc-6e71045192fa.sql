
-- 1. Favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, service_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Portfolio items table
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio items" ON public.portfolio_items
  FOR SELECT USING (true);

CREATE POLICY "Providers can manage own portfolio" ON public.portfolio_items
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own portfolio" ON public.portfolio_items
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own portfolio" ON public.portfolio_items
  FOR DELETE USING (auth.uid() = provider_id);

-- Enable realtime for favorites
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;

-- Create portfolio-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-photos', 'portfolio-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view portfolio photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-photos');

CREATE POLICY "Providers can upload portfolio photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'portfolio-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can delete portfolio photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'portfolio-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
