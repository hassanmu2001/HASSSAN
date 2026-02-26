
-- 1. Service availability calendar (blocked/booked dates + weekend pricing)
CREATE TABLE public.service_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  price_override numeric DEFAULT NULL,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(service_id, date)
);

ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability" ON public.service_availability FOR SELECT USING (true);
CREATE POLICY "Providers can manage own service availability" ON public.service_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid())
);
CREATE POLICY "Admins can manage all availability" ON public.service_availability FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Weekend pricing config per service
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS weekend_price_increase numeric DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 20);

-- 3. Service options/variants (e.g., buffet types, package sizes)
CREATE TABLE public.service_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view service options" ON public.service_options FOR SELECT USING (true);
CREATE POLICY "Providers can manage own service options" ON public.service_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid())
);
CREATE POLICY "Admins can manage all options" ON public.service_options FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Price tiers per option (quantity-based pricing)
CREATE TABLE public.service_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.service_options(id) ON DELETE CASCADE,
  min_quantity int NOT NULL DEFAULT 1,
  max_quantity int DEFAULT NULL,
  price_per_unit numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price tiers" ON public.service_price_tiers FOR SELECT USING (true);
CREATE POLICY "Providers can manage own price tiers" ON public.service_price_tiers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.service_options o
    JOIN public.services s ON s.id = o.service_id
    WHERE o.id = option_id AND s.provider_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all tiers" ON public.service_price_tiers FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.services(id),
  provider_id uuid NOT NULL,
  booking_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  selected_options jsonb DEFAULT '[]',
  guest_count int DEFAULT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Providers can view bookings for their services" ON public.bookings FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Clients can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Providers can update booking status" ON public.bookings FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Clients can cancel own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = client_id);
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamps
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-block date when booking confirmed
CREATE OR REPLACE FUNCTION public.block_date_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    INSERT INTO public.service_availability (service_id, date, is_available, note)
    VALUES (NEW.service_id, NEW.booking_date, false, 'محجوز')
    ON CONFLICT (service_id, date) DO UPDATE SET is_available = false, note = 'محجوز';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_confirmed_block_date
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.block_date_on_booking();

-- Enable realtime for bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
