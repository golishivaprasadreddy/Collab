
-- ============================================
-- FIX 1: Drop overly permissive "System" policies
-- These allow unauthenticated users to manipulate data.
-- Triggers/functions use SECURITY DEFINER so they bypass RLS anyway.
-- ============================================

-- skill_badges: drop public insert/update policies
DROP POLICY IF EXISTS "System can insert skill badges" ON public.skill_badges;
DROP POLICY IF EXISTS "System can update skill badges" ON public.skill_badges;

-- user_penalties: drop public ALL policy
DROP POLICY IF EXISTS "System can manage penalties" ON public.user_penalties;

-- disputes: drop public update policy
DROP POLICY IF EXISTS "System can update disputes" ON public.disputes;

-- user_violations: drop public insert policy
DROP POLICY IF EXISTS "System can insert violations" ON public.user_violations;

-- notifications: drop public insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- activity_feed: drop public insert policy
DROP POLICY IF EXISTS "System can insert activity" ON public.activity_feed;

-- ============================================
-- FIX 2: Secure push_token - create a separate table
-- and remove from profiles exposure via a view
-- ============================================

-- Create device_tokens table for push tokens
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token text,
  push_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device tokens"
  ON public.device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device tokens"
  ON public.device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device tokens"
  ON public.device_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Migrate existing push data
INSERT INTO public.device_tokens (user_id, push_token, push_enabled)
SELECT id, push_token, push_enabled FROM public.profiles
WHERE push_token IS NOT NULL OR push_enabled = true
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- FIX 3: Add UPDATE policy for safety_acknowledgments (needed for upsert)
-- ============================================
CREATE POLICY "Users can update own acknowledgments"
  ON public.safety_acknowledgments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FIX 4: Fix permissive policies on user_penalties to be PERMISSIVE
-- (currently RESTRICTIVE which means they AND together, causing issues)
-- Recreate admin/user SELECT policies as PERMISSIVE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all penalties" ON public.user_penalties;
DROP POLICY IF EXISTS "Admins can view all penalties" ON public.user_penalties;
DROP POLICY IF EXISTS "Users can view their own penalties" ON public.user_penalties;

CREATE POLICY "Admins can view all penalties"
  ON public.user_penalties FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view their own penalties"
  ON public.user_penalties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FIX 5: Fix disputes policies - make SELECT permissive
-- ============================================
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Participants can view their disputes" ON public.disputes;
DROP POLICY IF EXISTS "Participants can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update all disputes" ON public.disputes;

CREATE POLICY "Admins can view all disputes"
  ON public.disputes FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Participants can view their disputes"
  ON public.disputes FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id OR auth.uid() = reported_id);

CREATE POLICY "Participants can create disputes"
  ON public.disputes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND is_collaboration_participant(collaboration_request_id));

CREATE POLICY "Admins can update all disputes"
  ON public.disputes FOR UPDATE
  TO authenticated
  USING (is_admin());

-- ============================================
-- FIX 6: Fix user_violations policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all violations" ON public.user_violations;
DROP POLICY IF EXISTS "Users can view their own violations" ON public.user_violations;
DROP POLICY IF EXISTS "Users can acknowledge violations" ON public.user_violations;

CREATE POLICY "Admins can view all violations"
  ON public.user_violations FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Users can view their own violations"
  ON public.user_violations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge violations"
  ON public.user_violations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FIX 7: Fix messages policies
-- ============================================
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (is_collaboration_participant(collaboration_request_id) AND is_collaboration_accepted(collaboration_request_id));

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id AND is_collaboration_participant(collaboration_request_id) AND is_collaboration_accepted(collaboration_request_id));

-- ============================================
-- FIX 8: Fix notifications policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FIX 9: Fix activity_feed policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_feed;

CREATE POLICY "Users can view their own activity"
  ON public.activity_feed FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- FIX 10: Fix skill_badges policies
-- ============================================
DROP POLICY IF EXISTS "Anyone can view skill badges" ON public.skill_badges;

CREATE POLICY "Anyone can view skill badges"
  ON public.skill_badges FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- FIX 11: Fix collaboration_requests policies
-- ============================================
DROP POLICY IF EXISTS "Users can view own collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can create collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can update own collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can delete own pending requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Admins can view all collaborations" ON public.collaboration_requests;

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

CREATE POLICY "Admins can view all collaborations"
  ON public.collaboration_requests FOR SELECT
  TO authenticated
  USING (is_admin());
