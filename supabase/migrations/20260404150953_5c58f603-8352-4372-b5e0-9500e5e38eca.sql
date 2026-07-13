
-- Allow public (anonymous) access to user_reputation for the leaderboard
CREATE POLICY "Public can view reputation for leaderboard"
ON public.user_reputation
FOR SELECT
TO public
USING (true);
