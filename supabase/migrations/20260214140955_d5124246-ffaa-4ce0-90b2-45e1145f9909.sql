
-- Add admin rating (1-5) to services table for supervisor evaluations
ALTER TABLE public.services ADD COLUMN admin_rating numeric DEFAULT NULL;

-- Add constraint for valid rating range
ALTER TABLE public.services ADD CONSTRAINT admin_rating_range CHECK (admin_rating IS NULL OR (admin_rating >= 1 AND admin_rating <= 5));

-- Allow admins to update admin_rating (already covered by existing "Admins can manage all services" policy)
