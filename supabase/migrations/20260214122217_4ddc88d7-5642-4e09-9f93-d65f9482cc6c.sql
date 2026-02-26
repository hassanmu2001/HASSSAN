
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'provider');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  city TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  user_type TEXT NOT NULL DEFAULT 'client' CHECK (user_type IN ('client', 'provider')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN COALESCE(NEW.raw_user_meta_data->>'user_type', 'client') = 'provider' 
      THEN 'provider'::app_role 
      ELSE 'client'::app_role 
    END
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.categories (name, slug, description, icon) VALUES
  ('صالات الأفراح والمناسبات', 'halls', 'قاعات وصالات الزفاف والحفلات', 'Building2'),
  ('خدمات الضيافة', 'catering', 'تقديم الطعام والمشروبات والبوفيهات', 'UtensilsCrossed'),
  ('الورود والتزيين', 'flowers', 'محلات الورود وتنسيق الديكور', 'Flower2'),
  ('الصوتيات والدي جي', 'sound', 'أنظمة الصوت والإضاءة والموسيقى', 'Music'),
  ('خدمات الزفة', 'zaffa', 'فرق الزفة والعروض', 'PartyPopper'),
  ('التصوير والفيديو', 'photography', 'مصورين ومصوري فيديو', 'Camera'),
  ('خدمات النقل', 'transport', 'سيارات الزفاف والنقل', 'Car');
