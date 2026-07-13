
DO $$ BEGIN
  CREATE TYPE public.event_scope AS ENUM ('college', 'national', 'global');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS scope public.event_scope NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS organizer_id UUID,
  ADD COLUMN IF NOT EXISTS min_team_size INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_team_size INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS event_subtype TEXT;

CREATE INDEX IF NOT EXISTS idx_events_scope_college ON public.events(scope, college);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);

DROP POLICY IF EXISTS "Admins can create events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;

CREATE POLICY "Admins or organizers can create events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (public.has_role(auth.uid(), 'organizer'::public.app_role) AND organizer_id = auth.uid())
  );

CREATE POLICY "Admins or owning organizers can update events"
  ON public.events FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (public.has_role(auth.uid(), 'organizer'::public.app_role) AND organizer_id = auth.uid())
  );

CREATE POLICY "Admins or owning organizers can delete events"
  ON public.events FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR (public.has_role(auth.uid(), 'organizer'::public.app_role) AND organizer_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  registration_id UUID,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID,
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own attendance" ON public.event_attendance
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Organizers view event attendance" ON public.event_attendance
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );
CREATE POLICY "Organizers mark attendance" ON public.event_attendance
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.event_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'participant',
  certificate_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by UUID
);
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own certificates" ON public.event_certificates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Organizers view event certificates" ON public.event_certificates
  FOR SELECT TO authenticated USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );
CREATE POLICY "Organizers issue certificates" ON public.event_certificates
  FOR INSERT TO authenticated WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  uploaded_by UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users view event media" ON public.event_media
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Organizers upload event media" ON public.event_media
  FOR INSERT TO authenticated WITH CHECK (
    uploaded_by = auth.uid() AND (
      public.is_admin()
      OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
    )
  );
CREATE POLICY "Organizers delete event media" ON public.event_media
  FOR DELETE TO authenticated USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
  );
