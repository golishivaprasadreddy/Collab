
-- Add github_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url text;

-- Create event category enum
CREATE TYPE public.event_category AS ENUM ('technical', 'non_technical');

-- Create event mode enum
CREATE TYPE public.event_mode AS ENUM ('online', 'offline', 'hybrid');

-- Create events table
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category event_category NOT NULL DEFAULT 'technical',
  event_type text NOT NULL DEFAULT 'hackathon',
  event_date timestamp with time zone NOT NULL,
  mode event_mode NOT NULL DEFAULT 'online',
  registration_deadline timestamp with time zone,
  registration_link text,
  image_url text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT TO public
USING (true);

-- Only admins can create events
CREATE POLICY "Admins can create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (is_admin());

-- Only admins can update events
CREATE POLICY "Admins can update events"
ON public.events FOR UPDATE TO authenticated
USING (is_admin());

-- Only admins can delete events
CREATE POLICY "Admins can delete events"
ON public.events FOR DELETE TO authenticated
USING (is_admin());

-- Create event registrations table
CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  team_name text,
  team_members jsonb DEFAULT '[]'::jsonb,
  registered_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view own registrations"
ON public.event_registrations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Users can register for events
CREATE POLICY "Users can register for events"
ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can cancel own registrations
CREATE POLICY "Users can cancel own registrations"
ON public.event_registrations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.event_registrations FOR SELECT TO authenticated
USING (is_admin());

-- Trigger for updated_at on events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
