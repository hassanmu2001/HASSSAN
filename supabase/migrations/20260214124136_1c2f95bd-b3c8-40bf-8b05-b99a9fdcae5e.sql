
-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_min NUMERIC DEFAULT 0,
  price_max NUMERIC DEFAULT 0,
  city TEXT DEFAULT '',
  photos TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved active services"
  ON public.services FOR SELECT
  USING (is_active = true AND is_approved = true);

CREATE POLICY "Providers can view own services"
  ON public.services FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own services"
  ON public.services FOR DELETE
  USING (auth.uid() = provider_id);

CREATE POLICY "Admins can manage all services"
  ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id);
