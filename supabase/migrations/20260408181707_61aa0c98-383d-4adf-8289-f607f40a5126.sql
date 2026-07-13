
-- Drop broken storage policies
DROP POLICY IF EXISTS "Users can upload workspace files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view workspace files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete workspace files" ON storage.objects;

-- Recreate with correct path check using storage object name, not workspace name
CREATE POLICY "Users can upload workspace files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-files'
  AND EXISTS (
    SELECT 1
    FROM public.workspaces w
    JOIN public.collaboration_requests cr ON cr.id = w.collaboration_request_id
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (cr.requester_id = auth.uid() OR cr.requestee_id = auth.uid())
  )
);

CREATE POLICY "Users can view workspace files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'workspace-files'
  AND EXISTS (
    SELECT 1
    FROM public.workspaces w
    JOIN public.collaboration_requests cr ON cr.id = w.collaboration_request_id
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (cr.requester_id = auth.uid() OR cr.requestee_id = auth.uid())
  )
);

CREATE POLICY "Users can delete workspace files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workspace-files'
  AND EXISTS (
    SELECT 1
    FROM public.workspaces w
    JOIN public.collaboration_requests cr ON cr.id = w.collaboration_request_id
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (cr.requester_id = auth.uid() OR cr.requestee_id = auth.uid())
  )
);
