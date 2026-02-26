
-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, provider_id, service_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = provider_id);

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.client_id = auth.uid() OR c.provider_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in own conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.client_id = auth.uid() OR c.provider_id = auth.uid())
    )
  );

-- Users can mark messages as read in their conversations
CREATE POLICY "Users can update messages in own conversations"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.client_id = auth.uid() OR c.provider_id = auth.uid())
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
