
-- =============================================
-- 1. COUPONS SYSTEM
-- =============================================
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  season_label TEXT DEFAULT NULL, -- e.g. 'رمضان', 'الصيف'
  provider_id UUID DEFAULT NULL, -- null = global coupon
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Providers can manage own coupons" ON public.coupons FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Admins can manage all coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.coupon_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupon usages" ON public.coupon_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can use coupons" ON public.coupon_usages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. REFERRAL SYSTEM  
-- =============================================
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC NOT NULL DEFAULT 10,
  referral_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referral code" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own referral code" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view referral codes by code" ON public.referral_codes FOR SELECT USING (true);

CREATE TABLE public.referral_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL,
  referrer_user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referral usages" ON public.referral_usages FOR SELECT USING (auth.uid() = referred_user_id OR auth.uid() = referrer_user_id);
CREATE POLICY "Users can create referral usages" ON public.referral_usages FOR INSERT WITH CHECK (auth.uid() = referred_user_id);

-- =============================================
-- 3. REVIEW MEDIA (photos/videos with reviews)
-- =============================================
CREATE TABLE public.review_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view review media" ON public.review_media FOR SELECT USING (true);
CREATE POLICY "Users can add own review media" ON public.review_media FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.reviewer_id = auth.uid())
);
CREATE POLICY "Users can delete own review media" ON public.review_media FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.reviews r WHERE r.id = review_id AND r.reviewer_id = auth.uid())
);

-- Storage bucket for review media
INSERT INTO storage.buckets (id, name, public) VALUES ('review-media', 'review-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view review media files" ON storage.objects FOR SELECT USING (bucket_id = 'review-media');
CREATE POLICY "Auth users can upload review media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own review media" ON storage.objects FOR DELETE USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- 4. SERVICE VIEWS (for analytics)
-- =============================================
CREATE TABLE public.service_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  viewer_id UUID DEFAULT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert views" ON public.service_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Providers can view own service views" ON public.service_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid())
);
CREATE POLICY "Admins can view all" ON public.service_views FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 5. QUICK REPLIES
-- =============================================
CREATE TABLE public.quick_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  label TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers can manage own quick replies" ON public.quick_replies FOR ALL USING (auth.uid() = provider_id);

-- =============================================
-- 6. PROVIDER STORIES (24h)
-- =============================================
CREATE TABLE public.provider_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  view_count INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.provider_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active stories" ON public.provider_stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Providers can manage own stories" ON public.provider_stories FOR ALL USING (auth.uid() = provider_id);

-- Storage bucket for stories
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-stories', 'provider-stories', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view story files" ON storage.objects FOR SELECT USING (bucket_id = 'provider-stories');
CREATE POLICY "Auth users can upload story files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'provider-stories' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete own story files" ON storage.objects FOR DELETE USING (bucket_id = 'provider-stories' AND auth.uid()::text = (storage.foldername(name))[1]);
