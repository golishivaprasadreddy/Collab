
-- Certificates storage bucket (public for shareable URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for certificates
CREATE POLICY "Certificates are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "Organizers and admins can upload certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates'
  AND (
    public.is_admin()
    OR public.has_role(auth.uid(), 'organizer')
  )
);

CREATE POLICY "Organizers and admins can delete certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates'
  AND (
    public.is_admin()
    OR public.has_role(auth.uid(), 'organizer')
  )
);

-- Prevent duplicate attendance entries
CREATE UNIQUE INDEX IF NOT EXISTS event_attendance_unique_user_event
ON public.event_attendance (event_id, user_id);
