-- Enhanced messaging: Add read receipts and typing indicators
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Typing indicators table for real-time typing status
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaboration_request_id UUID NOT NULL REFERENCES public.collaboration_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on typing indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS for typing indicators - participants can see each other's typing status
CREATE POLICY "Participants can view typing indicators"
  ON public.typing_indicators FOR SELECT
  USING (public.is_collaboration_participant(collaboration_request_id));

CREATE POLICY "Users can update their own typing indicator"
  ON public.typing_indicators FOR ALL
  USING (auth.uid() = user_id);

-- Skill badges table
CREATE TABLE public.skill_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  badge_level TEXT NOT NULL DEFAULT 'bronze' CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum')),
  collaborations_completed INTEGER DEFAULT 1,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Enable RLS on skill badges
ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY;

-- Everyone can view skill badges (public profiles)
CREATE POLICY "Anyone can view skill badges"
  ON public.skill_badges FOR SELECT
  USING (true);

-- System awards badges via trigger
CREATE POLICY "System can insert skill badges"
  ON public.skill_badges FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update skill badges"
  ON public.skill_badges FOR UPDATE
  USING (true);

-- Function to award/upgrade skill badges
CREATE OR REPLACE FUNCTION public.award_skill_badge()
RETURNS TRIGGER AS $$
DECLARE
  skill TEXT;
  collab_count INTEGER;
  new_level TEXT;
BEGIN
  -- Get the skill from the collaboration
  SELECT skill_needed INTO skill
  FROM public.collaboration_requests
  WHERE id = NEW.collaboration_request_id;
  
  -- Count completed collaborations for this skill
  SELECT COUNT(*) INTO collab_count
  FROM public.ratings r
  JOIN public.collaboration_requests cr ON cr.id = r.collaboration_request_id
  WHERE r.rated_user_id = NEW.rated_user_id
  AND cr.skill_needed = skill;
  
  -- Determine badge level
  new_level := CASE
    WHEN collab_count >= 20 THEN 'platinum'
    WHEN collab_count >= 10 THEN 'gold'
    WHEN collab_count >= 5 THEN 'silver'
    ELSE 'bronze'
  END;
  
  -- Insert or update badge
  INSERT INTO public.skill_badges (user_id, skill_name, badge_level, collaborations_completed)
  VALUES (NEW.rated_user_id, skill, new_level, collab_count)
  ON CONFLICT (user_id, skill_name) 
  DO UPDATE SET 
    badge_level = new_level,
    collaborations_completed = collab_count,
    awarded_at = CASE WHEN public.skill_badges.badge_level != new_level THEN now() ELSE public.skill_badges.awarded_at END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to award badges after rating
CREATE TRIGGER award_skill_badge_trigger
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.award_skill_badge();

-- Calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaboration_request_id UUID NOT NULL REFERENCES public.collaboration_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on calendar events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS for calendar events
CREATE POLICY "Participants can view calendar events"
  ON public.calendar_events FOR SELECT
  USING (public.is_collaboration_participant(collaboration_request_id));

CREATE POLICY "Participants can create calendar events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (public.is_collaboration_participant(collaboration_request_id) AND auth.uid() = created_by);

CREATE POLICY "Participants can update calendar events"
  ON public.calendar_events FOR UPDATE
  USING (public.is_collaboration_participant(collaboration_request_id));

CREATE POLICY "Creator can delete calendar events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = created_by);

-- Activity feed table for dashboard
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on activity feed
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Users can only view their own activity
CREATE POLICY "Users can view their own activity"
  ON public.activity_feed FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert activity
CREATE POLICY "System can insert activity"
  ON public.activity_feed FOR INSERT
  WITH CHECK (true);

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log for requester
  INSERT INTO public.activity_feed (user_id, activity_type, title, description, related_id)
  VALUES (
    NEW.requester_id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'collaboration_sent'
      WHEN NEW.status = 'accepted' THEN 'collaboration_accepted'
      WHEN NEW.status = 'completed' THEN 'collaboration_completed'
      ELSE 'collaboration_updated'
    END,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'Sent collaboration request'
      WHEN NEW.status = 'accepted' THEN 'Collaboration accepted'
      WHEN NEW.status = 'completed' THEN 'Collaboration completed'
      ELSE 'Collaboration updated'
    END,
    NEW.skill_needed,
    NEW.id
  );
  
  -- Log for requestee on status changes
  IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_feed (user_id, activity_type, title, description, related_id)
    VALUES (
      NEW.requestee_id,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'collaboration_received'
        WHEN NEW.status = 'accepted' THEN 'collaboration_started'
        WHEN NEW.status = 'completed' THEN 'collaboration_completed'
        ELSE 'collaboration_updated'
      END,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Received collaboration request'
        WHEN NEW.status = 'accepted' THEN 'Started collaboration'
        WHEN NEW.status = 'completed' THEN 'Collaboration completed'
        ELSE 'Collaboration updated'
      END,
      NEW.skill_needed,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for activity logging
CREATE TRIGGER log_collaboration_activity
  AFTER INSERT OR UPDATE ON public.collaboration_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;