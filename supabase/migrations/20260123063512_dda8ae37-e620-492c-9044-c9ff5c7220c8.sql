-- =====================================================
-- COLLABIO DATABASE SCHEMA
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.skill_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.collaboration_status AS ENUM ('pending', 'accepted', 'rejected', 'ongoing', 'completed', 'cancelled');
CREATE TYPE public.collaboration_type AS ENUM ('learning', 'project', 'paid');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'completed');

-- =====================================================
-- BASE TABLES
-- =====================================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  college TEXT,
  degree TEXT,
  year TEXT,
  bio TEXT,
  is_paid_available BOOLEAN DEFAULT false,
  min_earning_range INTEGER DEFAULT 500,
  max_earning_range INTEGER DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  level skill_level NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User availability
CREATE TABLE public.user_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  learning BOOLEAN DEFAULT true,
  project BOOLEAN DEFAULT true,
  paid_collaboration BOOLEAN DEFAULT false,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Collaboration requests
CREATE TABLE public.collaboration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requestee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_needed TEXT NOT NULL,
  purpose TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT,
  collaboration_type collaboration_type NOT NULL DEFAULT 'learning',
  agreed_amount INTEGER DEFAULT 0,
  status collaboration_status NOT NULL DEFAULT 'pending',
  requester_confirmed_completion BOOLEAN DEFAULT false,
  requestee_confirmed_completion BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'not_applicable',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT no_self_request CHECK (requester_id <> requestee_id)
);

-- Messages (unlocked only after request acceptance)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workspaces for active collaborations
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workspace tasks
CREATE TABLE public.workspace_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Workspace milestones
CREATE TABLE public.workspace_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ratings
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaboration_request_id UUID REFERENCES public.collaboration_requests(id) ON DELETE CASCADE NOT NULL,
  rated_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  feedback TEXT,
  payment_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(collaboration_request_id, rated_by_user_id)
);

-- User reputation (points and trust score)
CREATE TABLE public.user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  points INTEGER DEFAULT 0,
  trust_score NUMERIC(3,2) DEFAULT 0.00,
  total_collaborations INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Check if user is participant in a collaboration
CREATE OR REPLACE FUNCTION public.is_collaboration_participant(request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaboration_requests
    WHERE id = request_id
    AND (requester_id = auth.uid() OR requestee_id = auth.uid())
  );
$$;

-- Check if collaboration is accepted (for messages)
CREATE OR REPLACE FUNCTION public.is_collaboration_accepted(request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaboration_requests
    WHERE id = request_id
    AND status IN ('accepted', 'ongoing', 'completed')
  );
$$;

-- Check if user can access workspace
CREATE OR REPLACE FUNCTION public.can_access_workspace(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.collaboration_requests cr ON cr.id = w.collaboration_request_id
    WHERE w.id = ws_id
    AND (cr.requester_id = auth.uid() OR cr.requestee_id = auth.uid())
  );
$$;

-- Check if collaboration is completed
CREATE OR REPLACE FUNCTION public.is_collaboration_completed(request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaboration_requests
    WHERE id = request_id
    AND status = 'completed'
  );
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_availability (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_reputation (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create workspace when collaboration is accepted
CREATE OR REPLACE FUNCTION public.handle_collaboration_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.workspaces (collaboration_request_id, name, description)
    VALUES (
      NEW.id,
      'Collaboration: ' || NEW.skill_needed,
      NEW.description
    );
    
    -- Update status to ongoing
    NEW.status := 'ongoing';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_collaboration_accepted
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_collaboration_accepted();

-- Update reputation when rating is added
CREATE OR REPLACE FUNCTION public.handle_new_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_score NUMERIC;
  collab_type collaboration_type;
  collab_amount INTEGER;
BEGIN
  -- Calculate new average trust score
  SELECT AVG(score)::NUMERIC(3,2) INTO avg_score
  FROM public.ratings
  WHERE rated_user_id = NEW.rated_user_id;
  
  -- Get collaboration details
  SELECT collaboration_type, agreed_amount INTO collab_type, collab_amount
  FROM public.collaboration_requests
  WHERE id = NEW.collaboration_request_id;
  
  -- Update reputation
  UPDATE public.user_reputation
  SET 
    trust_score = COALESCE(avg_score, 0),
    points = points + 10,
    total_collaborations = total_collaborations + 1,
    total_earnings = CASE 
      WHEN collab_type = 'paid' AND NEW.payment_confirmed 
      THEN total_earnings + COALESCE(collab_amount, 0)
      ELSE total_earnings
    END,
    updated_at = now()
  WHERE user_id = NEW.rated_user_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_rating_created
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_rating();

-- Update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_collaboration_requests_updated_at
  BEFORE UPDATE ON public.collaboration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_availability_updated_at
  BEFORE UPDATE ON public.user_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_workspace_tasks_updated_at
  BEFORE UPDATE ON public.workspace_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_reputation_updated_at
  BEFORE UPDATE ON public.user_reputation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SKILLS policies
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own skills"
  ON public.skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON public.skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON public.skills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- USER_AVAILABILITY policies
CREATE POLICY "Availability is viewable by everyone"
  ON public.user_availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own availability"
  ON public.user_availability FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availability"
  ON public.user_availability FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- COLLABORATION_REQUESTS policies
CREATE POLICY "Users can view own collaboration requests"
  ON public.collaboration_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = requestee_id);

CREATE POLICY "Users can create collaboration requests"
  ON public.collaboration_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id AND auth.uid() <> requestee_id);

CREATE POLICY "Users can update own collaboration requests"
  ON public.collaboration_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = requestee_id);

CREATE POLICY "Users can delete own pending requests"
  ON public.collaboration_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id AND status = 'pending');

-- MESSAGES policies
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    public.is_collaboration_participant(collaboration_request_id)
    AND public.is_collaboration_accepted(collaboration_request_id)
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_collaboration_participant(collaboration_request_id)
    AND public.is_collaboration_accepted(collaboration_request_id)
  );

-- WORKSPACES policies
CREATE POLICY "Participants can view workspaces"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (public.is_collaboration_participant(collaboration_request_id));

CREATE POLICY "Participants can update workspaces"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (public.is_collaboration_participant(collaboration_request_id));

-- WORKSPACE_TASKS policies
CREATE POLICY "Participants can view tasks"
  ON public.workspace_tasks FOR SELECT
  TO authenticated
  USING (public.can_access_workspace(workspace_id));

CREATE POLICY "Participants can create tasks"
  ON public.workspace_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_workspace(workspace_id));

CREATE POLICY "Participants can update tasks"
  ON public.workspace_tasks FOR UPDATE
  TO authenticated
  USING (public.can_access_workspace(workspace_id));

CREATE POLICY "Participants can delete tasks"
  ON public.workspace_tasks FOR DELETE
  TO authenticated
  USING (public.can_access_workspace(workspace_id));

-- WORKSPACE_MILESTONES policies
CREATE POLICY "Participants can view milestones"
  ON public.workspace_milestones FOR SELECT
  TO authenticated
  USING (public.can_access_workspace(workspace_id));

CREATE POLICY "Participants can create milestones"
  ON public.workspace_milestones FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_workspace(workspace_id));

CREATE POLICY "Participants can update milestones"
  ON public.workspace_milestones FOR UPDATE
  TO authenticated
  USING (public.can_access_workspace(workspace_id));

CREATE POLICY "Participants can delete milestones"
  ON public.workspace_milestones FOR DELETE
  TO authenticated
  USING (public.can_access_workspace(workspace_id));

-- RATINGS policies
CREATE POLICY "Participants can view ratings"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (public.is_collaboration_participant(collaboration_request_id));

CREATE POLICY "Users can rate after completion"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = rated_by_user_id
    AND public.is_collaboration_participant(collaboration_request_id)
    AND public.is_collaboration_completed(collaboration_request_id)
    AND auth.uid() <> rated_user_id
  );

-- USER_REPUTATION policies
CREATE POLICY "Reputation is viewable by everyone"
  ON public.user_reputation FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_skills_user_id ON public.skills(user_id);
CREATE INDEX idx_skills_skill_name ON public.skills(skill_name);
CREATE INDEX idx_collaboration_requests_requester ON public.collaboration_requests(requester_id);
CREATE INDEX idx_collaboration_requests_requestee ON public.collaboration_requests(requestee_id);
CREATE INDEX idx_collaboration_requests_status ON public.collaboration_requests(status);
CREATE INDEX idx_messages_collaboration ON public.messages(collaboration_request_id);
CREATE INDEX idx_workspace_tasks_workspace ON public.workspace_tasks(workspace_id);
CREATE INDEX idx_workspace_milestones_workspace ON public.workspace_milestones(workspace_id);
CREATE INDEX idx_ratings_collaboration ON public.ratings(collaboration_request_id);

-- =====================================================
-- ENABLE REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_milestones;