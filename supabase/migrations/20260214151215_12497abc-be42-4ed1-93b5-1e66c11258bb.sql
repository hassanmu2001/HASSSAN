-- Add deposit_percent column to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deposit_percent numeric DEFAULT 0;
