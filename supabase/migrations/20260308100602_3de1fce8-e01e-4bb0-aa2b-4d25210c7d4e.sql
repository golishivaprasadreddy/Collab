
-- ============================================
-- FIX: Convert all RESTRICTIVE policies to PERMISSIVE
-- Drop and recreate every policy as PERMISSIVE (default)
-- ============================================

-- PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Remove push columns from profiles (data already migrated to device_tokens)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS push_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS push_enabled;

-- SKILLS
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
DROP POLICY IF EXISTS "Users can delete own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can insert own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can update own skills" ON public.skills;

CREATE POLICY "Skills are viewable by everyone" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Users can delete own skills" ON public.skills FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON public.skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON public.skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER_AVAILABILITY
DROP POLICY IF EXISTS "Availability is viewable by everyone" ON public.user_availability;
DROP POLICY IF EXISTS "Users can insert own availability" ON public.user_availability;
DROP POLICY IF EXISTS "Users can update own availability" ON public.user_availability;

CREATE POLICY "Availability is viewable by everyone" ON public.user_availability FOR SELECT USING (true);
CREATE POLICY "Users can insert own availability" ON public.user_availability FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own availability" ON public.user_availability FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PORTFOLIO_PROJECTS
DROP POLICY IF EXISTS "Portfolio projects are viewable by everyone" ON public.portfolio_projects;
DROP POLICY IF EXISTS "Users can delete own portfolio projects" ON public.portfolio_projects;
DROP POLICY IF EXISTS "Users can insert own portfolio projects" ON public.portfolio_projects;
DROP POLICY IF EXISTS "Users can update own portfolio projects" ON public.portfolio_projects;

CREATE POLICY "Portfolio projects are viewable by everyone" ON public.portfolio_projects FOR SELECT USING (true);
CREATE POLICY "Users can delete own portfolio projects" ON public.portfolio_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolio projects" ON public.portfolio_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolio projects" ON public.portfolio_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- USER_REPUTATION - split earnings into private table
CREATE TABLE IF NOT EXISTS public.user_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_earnings integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own earnings" ON public.user_earnings FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Migrate earnings data
INSERT INTO public.user_earnings (user_id, total_earnings)
SELECT user_id, total_earnings FROM public.user_reputation
WHERE total_earnings > 0
ON CONFLICT (user_id) DO NOTHING;

DROP POLICY IF EXISTS "Reputation is viewable by everyone" ON public.user_reputation;
CREATE POLICY "Reputation is viewable by everyone" ON public.user_reputation FOR SELECT USING (true);

-- COLLABORATION_REQUESTS (re-drop and recreate as PERMISSIVE)
DROP POLICY IF EXISTS "Users can view own collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can create collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can update own collaboration requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Users can delete own pending requests" ON public.collaboration_requests;
DROP POLICY IF EXISTS "Admins can view all collaborations" ON public.collaboration_requests;

CREATE POLICY "Users can view own collaboration requests" ON public.collaboration_requests FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = requestee_id);
CREATE POLICY "Users can create collaboration requests" ON public.collaboration_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND auth.uid() <> requestee_id);
CREATE POLICY "Users can update own collaboration requests" ON public.collaboration_requests FOR UPDATE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = requestee_id);
CREATE POLICY "Users can delete own pending requests" ON public.collaboration_requests FOR DELETE TO authenticated USING (auth.uid() = requester_id AND status = 'pending');
CREATE POLICY "Admins can view all collaborations" ON public.collaboration_requests FOR SELECT TO authenticated USING (is_admin());

-- MESSAGES
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Participants can view messages" ON public.messages FOR SELECT TO authenticated USING (is_collaboration_participant(collaboration_request_id) AND is_collaboration_accepted(collaboration_request_id));
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND is_collaboration_participant(collaboration_request_id) AND is_collaboration_accepted(collaboration_request_id));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ACTIVITY_FEED
DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_feed;
CREATE POLICY "Users can view their own activity" ON public.activity_feed FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- DISPUTES
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Participants can view their disputes" ON public.disputes;
DROP POLICY IF EXISTS "Participants can create disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update all disputes" ON public.disputes;

CREATE POLICY "Admins can view all disputes" ON public.disputes FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Participants can view their disputes" ON public.disputes FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR auth.uid() = reported_id);
CREATE POLICY "Participants can create disputes" ON public.disputes FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND is_collaboration_participant(collaboration_request_id));
CREATE POLICY "Admins can update all disputes" ON public.disputes FOR UPDATE TO authenticated USING (is_admin());

-- USER_VIOLATIONS
DROP POLICY IF EXISTS "Admins can view all violations" ON public.user_violations;
DROP POLICY IF EXISTS "Users can view their own violations" ON public.user_violations;
DROP POLICY IF EXISTS "Users can acknowledge violations" ON public.user_violations;

CREATE POLICY "Admins can view all violations" ON public.user_violations FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Users can view their own violations" ON public.user_violations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can acknowledge violations" ON public.user_violations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- USER_PENALTIES
DROP POLICY IF EXISTS "Admins can view all penalties" ON public.user_penalties;
DROP POLICY IF EXISTS "Users can view their own penalties" ON public.user_penalties;

CREATE POLICY "Admins can view all penalties" ON public.user_penalties FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Users can view their own penalties" ON public.user_penalties FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- SKILL_BADGES
DROP POLICY IF EXISTS "Anyone can view skill badges" ON public.skill_badges;
CREATE POLICY "Anyone can view skill badges" ON public.skill_badges FOR SELECT USING (true);

-- BLOCKED_USERS
DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can unblock others" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can view their blocked users" ON public.blocked_users;

CREATE POLICY "Users can view their blocked users" ON public.blocked_users FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id AND auth.uid() <> blocked_id);
CREATE POLICY "Users can unblock others" ON public.blocked_users FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- PRIVACY_SETTINGS
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;

CREATE POLICY "Users can view their own privacy settings" ON public.privacy_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own privacy settings" ON public.privacy_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- SAFETY_ACKNOWLEDGMENTS
DROP POLICY IF EXISTS "Users can insert own acknowledgments" ON public.safety_acknowledgments;
DROP POLICY IF EXISTS "Users can view own acknowledgments" ON public.safety_acknowledgments;
DROP POLICY IF EXISTS "Users can update own acknowledgments" ON public.safety_acknowledgments;

CREATE POLICY "Users can view own acknowledgments" ON public.safety_acknowledgments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own acknowledgments" ON public.safety_acknowledgments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own acknowledgments" ON public.safety_acknowledgments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RATINGS
DROP POLICY IF EXISTS "Participants can view ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can rate after completion" ON public.ratings;

CREATE POLICY "Participants can view ratings" ON public.ratings FOR SELECT TO authenticated USING (is_collaboration_participant(collaboration_request_id));
CREATE POLICY "Users can rate after completion" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = rated_by_user_id AND is_collaboration_participant(collaboration_request_id) AND is_collaboration_completed(collaboration_request_id) AND auth.uid() <> rated_user_id);

-- CALENDAR_EVENTS
DROP POLICY IF EXISTS "Creator can delete calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Participants can create calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Participants can update calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Participants can view calendar events" ON public.calendar_events;

CREATE POLICY "Participants can view calendar events" ON public.calendar_events FOR SELECT TO authenticated USING (is_collaboration_participant(collaboration_request_id));
CREATE POLICY "Participants can create calendar events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (is_collaboration_participant(collaboration_request_id) AND auth.uid() = created_by);
CREATE POLICY "Participants can update calendar events" ON public.calendar_events FOR UPDATE TO authenticated USING (is_collaboration_participant(collaboration_request_id));
CREATE POLICY "Creator can delete calendar events" ON public.calendar_events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- WORKSPACES
DROP POLICY IF EXISTS "Participants can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Participants can update workspaces" ON public.workspaces;

CREATE POLICY "Participants can view workspaces" ON public.workspaces FOR SELECT TO authenticated USING (is_collaboration_participant(collaboration_request_id));
CREATE POLICY "Participants can update workspaces" ON public.workspaces FOR UPDATE TO authenticated USING (is_collaboration_participant(collaboration_request_id));

-- WORKSPACE_FILES
DROP POLICY IF EXISTS "Participants can view workspace files" ON public.workspace_files;
DROP POLICY IF EXISTS "Participants can upload workspace files" ON public.workspace_files;
DROP POLICY IF EXISTS "Uploaders can delete their files" ON public.workspace_files;

CREATE POLICY "Participants can view workspace files" ON public.workspace_files FOR SELECT TO authenticated USING (can_access_workspace(workspace_id));
CREATE POLICY "Participants can upload workspace files" ON public.workspace_files FOR INSERT TO authenticated WITH CHECK (can_access_workspace(workspace_id) AND uploaded_by = auth.uid());
CREATE POLICY "Uploaders can delete their files" ON public.workspace_files FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- WORKSPACE_MILESTONES
DROP POLICY IF EXISTS "Participants can view milestones" ON public.workspace_milestones;
DROP POLICY IF EXISTS "Participants can create milestones" ON public.workspace_milestones;
DROP POLICY IF EXISTS "Participants can update milestones" ON public.workspace_milestones;
DROP POLICY IF EXISTS "Participants can delete milestones" ON public.workspace_milestones;

CREATE POLICY "Participants can view milestones" ON public.workspace_milestones FOR SELECT TO authenticated USING (can_access_workspace(workspace_id));
CREATE POLICY "Participants can create milestones" ON public.workspace_milestones FOR INSERT TO authenticated WITH CHECK (can_access_workspace(workspace_id));
CREATE POLICY "Participants can update milestones" ON public.workspace_milestones FOR UPDATE TO authenticated USING (can_access_workspace(workspace_id));
CREATE POLICY "Participants can delete milestones" ON public.workspace_milestones FOR DELETE TO authenticated USING (can_access_workspace(workspace_id));

-- WORKSPACE_TASKS
DROP POLICY IF EXISTS "Participants can view tasks" ON public.workspace_tasks;
DROP POLICY IF EXISTS "Participants can create tasks" ON public.workspace_tasks;
DROP POLICY IF EXISTS "Participants can update tasks" ON public.workspace_tasks;
DROP POLICY IF EXISTS "Participants can delete tasks" ON public.workspace_tasks;

CREATE POLICY "Participants can view tasks" ON public.workspace_tasks FOR SELECT TO authenticated USING (can_access_workspace(workspace_id));
CREATE POLICY "Participants can create tasks" ON public.workspace_tasks FOR INSERT TO authenticated WITH CHECK (can_access_workspace(workspace_id));
CREATE POLICY "Participants can update tasks" ON public.workspace_tasks FOR UPDATE TO authenticated USING (can_access_workspace(workspace_id));
CREATE POLICY "Participants can delete tasks" ON public.workspace_tasks FOR DELETE TO authenticated USING (can_access_workspace(workspace_id));

-- TYPING_INDICATORS
DROP POLICY IF EXISTS "Participants can view typing indicators" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing indicator" ON public.typing_indicators;

CREATE POLICY "Participants can view typing indicators" ON public.typing_indicators FOR SELECT TO authenticated USING (is_collaboration_participant(collaboration_request_id));
CREATE POLICY "Users can update their own typing indicator" ON public.typing_indicators FOR ALL TO authenticated USING (auth.uid() = user_id);

-- DEVICE_TOKENS
DROP POLICY IF EXISTS "Users can view own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can insert own device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Users can update own device tokens" ON public.device_tokens;

CREATE POLICY "Users can view own device tokens" ON public.device_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own device tokens" ON public.device_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own device tokens" ON public.device_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
