
-- Add verification status to profiles
ALTER TABLE public.profiles
ADD COLUMN is_verified boolean NOT NULL DEFAULT false,
ADD COLUMN verification_notes text;
