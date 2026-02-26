
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type, phone, city, date_of_birth, national_id, id_photo_url, business_name, business_address, commercial_register_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date 
      ELSE NULL END,
    NEW.raw_user_meta_data->>'national_id',
    NEW.raw_user_meta_data->>'id_photo_url',
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'business_address',
    NEW.raw_user_meta_data->>'commercial_register_url'
  );
  
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
$function$;
