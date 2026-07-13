-- Create enum for violation types
CREATE TYPE public.violation_type AS ENUM (
  'phone_number',
  'email_address',
  'social_media',
  'external_link',
  'prohibited_keyword'
);

-- Create enum for penalty types
CREATE TYPE public.penalty_type AS ENUM (
  'warning',
  'cooldown',
  'temporary_restriction',
  'account_review',
  'permanent_ban'
);

-- Create enum for dispute status
CREATE TYPE public.dispute_status AS ENUM (
  'open',
  'under_review',
  'resolved_favor_reporter',
  'resolved_favor_reported',
  'resolved_mutual',
  'dismissed'
);

-- Table to track user violations
CREATE TABLE public.user_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  violation_type violation_type NOT NULL,
  blocked_content TEXT,
  collaboration_request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false
);

-- Table to track active penalties
CREATE TABLE public.user_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  penalty_type penalty_type NOT NULL,
  reason TEXT,
  violation_count INTEGER DEFAULT 1,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for disputes
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_request_id UUID NOT NULL REFERENCES public.collaboration_requests(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status dispute_status DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolution_deadline TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '48 hours'),
  CONSTRAINT different_users CHECK (reporter_id != reported_id)
);

-- Table to track safety acknowledgments (onboarding)
CREATE TABLE public.safety_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  version INTEGER DEFAULT 1
);

-- Enable RLS on all tables
ALTER TABLE public.user_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_acknowledgments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_violations
CREATE POLICY "Users can view their own violations"
ON public.user_violations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert violations"
ON public.user_violations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can acknowledge violations"
ON public.user_violations FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_penalties
CREATE POLICY "Users can view their own penalties"
ON public.user_penalties FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage penalties"
ON public.user_penalties FOR ALL
WITH CHECK (true);

-- RLS Policies for disputes
CREATE POLICY "Participants can view their disputes"
ON public.disputes FOR SELECT
USING (auth.uid() = reporter_id OR auth.uid() = reported_id);

CREATE POLICY "Participants can create disputes"
ON public.disputes FOR INSERT
WITH CHECK (auth.uid() = reporter_id AND is_collaboration_participant(collaboration_request_id));

CREATE POLICY "System can update disputes"
ON public.disputes FOR UPDATE
WITH CHECK (true);

-- RLS Policies for safety_acknowledgments
CREATE POLICY "Users can view own acknowledgments"
ON public.safety_acknowledgments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acknowledgments"
ON public.safety_acknowledgments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to get user's violation count
CREATE OR REPLACE FUNCTION public.get_user_violation_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_violations
  WHERE user_id = target_user_id
  AND created_at > now() - interval '30 days';
$$;

-- Function to check if user has active penalty
CREATE OR REPLACE FUNCTION public.has_active_penalty(target_user_id UUID, check_penalty_type penalty_type DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_penalties
    WHERE user_id = target_user_id
    AND is_active = true
    AND (ends_at IS NULL OR ends_at > now())
    AND (check_penalty_type IS NULL OR penalty_type = check_penalty_type)
  );
$$;

-- Function to apply penalty based on violation count
CREATE OR REPLACE FUNCTION public.apply_violation_penalty()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  violation_count INTEGER;
  new_penalty penalty_type;
  penalty_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current violation count for user
  SELECT COUNT(*) INTO violation_count
  FROM public.user_violations
  WHERE user_id = NEW.user_id
  AND created_at > now() - interval '30 days';
  
  -- Determine penalty based on count
  CASE violation_count
    WHEN 1 THEN
      new_penalty := 'warning';
      penalty_end := NULL; -- Warning doesn't expire
    WHEN 2 THEN
      new_penalty := 'cooldown';
      penalty_end := now() + interval '1 hour';
    WHEN 3 THEN
      new_penalty := 'temporary_restriction';
      penalty_end := now() + interval '24 hours';
    ELSE
      new_penalty := 'account_review';
      penalty_end := NULL; -- Requires manual review
  END CASE;
  
  -- Deactivate previous penalties
  UPDATE public.user_penalties
  SET is_active = false
  WHERE user_id = NEW.user_id AND is_active = true;
  
  -- Insert new penalty
  INSERT INTO public.user_penalties (user_id, penalty_type, violation_count, ends_at, reason)
  VALUES (NEW.user_id, new_penalty, violation_count, penalty_end, 
    'Automatic penalty for ' || NEW.violation_type::text);
  
  RETURN NEW;
END;
$$;

-- Trigger to apply penalty on violation
CREATE TRIGGER on_violation_apply_penalty
AFTER INSERT ON public.user_violations
FOR EACH ROW
EXECUTE FUNCTION public.apply_violation_penalty();

-- Function to check if user has open dispute
CREATE OR REPLACE FUNCTION public.has_open_dispute(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.disputes
    WHERE (reporter_id = target_user_id OR reported_id = target_user_id)
    AND status IN ('open', 'under_review')
  );
$$;