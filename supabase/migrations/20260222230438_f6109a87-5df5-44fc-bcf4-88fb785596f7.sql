
-- 1. Wedding planning list (قائمة عرسي)
CREATE TABLE public.wedding_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'قائمة عرسي',
  wedding_date DATE,
  partner_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wedding lists" ON public.wedding_lists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Wedding list items
CREATE TABLE public.wedding_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.wedding_lists(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'searching', -- searching, shortlisted, booked
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wedding list items" ON public.wedding_list_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.wedding_lists wl WHERE wl.id = list_id AND wl.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.wedding_lists wl WHERE wl.id = list_id AND wl.user_id = auth.uid())
  );

-- 2. Q&A system (الأسئلة والأجوبة)
CREATE TABLE public.service_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  asker_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON public.service_questions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can ask questions" ON public.service_questions
  FOR INSERT WITH CHECK (auth.uid() = asker_id);

CREATE POLICY "Service providers can answer" ON public.service_questions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.provider_id = auth.uid())
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_questions;
