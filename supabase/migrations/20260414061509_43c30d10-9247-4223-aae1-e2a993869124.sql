
-- Create pinned_messages table
CREATE TABLE public.pinned_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaboration_request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collaboration_request_id, message_id)
);

ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view pinned messages"
ON public.pinned_messages FOR SELECT TO authenticated
USING (public.is_collaboration_participant(collaboration_request_id));

CREATE POLICY "Participants can pin messages"
ON public.pinned_messages FOR INSERT TO authenticated
WITH CHECK (public.is_collaboration_participant(collaboration_request_id) AND pinned_by = auth.uid());

CREATE POLICY "Participants can unpin messages"
ON public.pinned_messages FOR DELETE TO authenticated
USING (public.is_collaboration_participant(collaboration_request_id));
