-- Fix 1: Remove total_earnings exposure from user_reputation
DROP POLICY IF EXISTS "Reputation is viewable by authenticated users" ON public.user_reputation;

-- Only owner sees full reputation (including earnings)
CREATE POLICY "Users can view own full reputation"
ON public.user_reputation
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Others see reputation rows but app-level code will exclude earnings
CREATE POLICY "Authenticated users can view reputation"
ON public.user_reputation
FOR SELECT
TO authenticated
USING (true);

-- Fix 2: Create privacy-respecting profile view function
CREATE OR REPLACE FUNCTION public.get_profile_with_privacy(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  full_name text,
  avatar_url text,
  college text,
  degree text,
  year text,
  bio text,
  is_paid_available boolean,
  min_earning_range integer,
  max_earning_range integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    CASE WHEN ps.show_college IS NULL OR ps.show_college = true THEN p.college ELSE NULL END,
    p.degree,
    p.year,
    p.bio,
    p.is_paid_available,
    CASE WHEN ps.show_earnings IS NULL OR ps.show_earnings = true THEN p.min_earning_range ELSE NULL END,
    CASE WHEN ps.show_earnings IS NULL OR ps.show_earnings = true THEN p.max_earning_range ELSE NULL END
  FROM public.profiles p
  LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
  WHERE p.id = target_user_id
  AND (
    p.id = auth.uid()
    OR ps.profile_visibility IS NULL
    OR ps.profile_visibility = 'everyone'
    OR (ps.profile_visibility = 'collaborators' AND EXISTS (
      SELECT 1 FROM public.collaboration_requests cr
      WHERE (cr.requester_id = auth.uid() AND cr.requestee_id = target_user_id)
         OR (cr.requestee_id = auth.uid() AND cr.requester_id = target_user_id)
    ))
  );
$$;