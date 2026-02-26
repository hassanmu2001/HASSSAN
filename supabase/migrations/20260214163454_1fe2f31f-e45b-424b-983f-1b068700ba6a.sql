
-- Countries table
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  currency_code text NOT NULL,
  currency_symbol text NOT NULL,
  flag_emoji text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view countries" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Admins can manage countries" ON public.countries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cities table linked to countries
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add country to profiles and services
ALTER TABLE public.profiles ADD COLUMN country_code text DEFAULT 'SA';
ALTER TABLE public.services ADD COLUMN country_code text DEFAULT 'SA';

-- Index for faster filtering
CREATE INDEX idx_services_country ON public.services(country_code);
CREATE INDEX idx_cities_country ON public.cities(country_id);
