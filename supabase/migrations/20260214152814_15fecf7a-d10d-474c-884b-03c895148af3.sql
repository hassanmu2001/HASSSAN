
-- Drop the overly permissive policy
DROP POLICY "Service role can insert notifications" ON public.notifications;

-- Create a more restrictive insert policy - only authenticated users can insert their own notifications
-- Edge functions use service_role which bypasses RLS anyway
CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);
