
-- Fix: Restrict user_reputation to authenticated users only
DROP POLICY IF EXISTS "Reputation is viewable by everyone" ON public.user_reputation;
CREATE POLICY "Reputation is viewable by authenticated users" ON public.user_reputation FOR SELECT TO authenticated USING (true);
