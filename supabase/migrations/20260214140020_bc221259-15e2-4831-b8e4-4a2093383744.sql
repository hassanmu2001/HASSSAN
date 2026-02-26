-- Allow admins to manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all conversations
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
