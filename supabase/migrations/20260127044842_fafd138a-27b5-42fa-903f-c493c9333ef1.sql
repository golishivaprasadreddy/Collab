-- Create workspace_files storage bucket for file sharing
INSERT INTO storage.buckets (id, name, public) VALUES ('workspace-files', 'workspace-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for workspace files
CREATE POLICY "Users can view workspace files" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'workspace-files' 
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.collaboration_requests cr ON cr.id = w.collaboration_request_id
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (cr.requester_id = auth.uid() OR cr.requestee_id = auth.uid())
  )
);

CREATE POLICY "Users can upload workspace files" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'workspace-files' 
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.collaboration_requests cr ON cr.id = w.collaboration_request_id
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (cr.requester_id = auth.uid() OR cr.requestee_id = auth.uid())
  )
);

CREATE POLICY "Users can delete workspace files" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'workspace-files' 
  AND EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.collaboration_requests cr ON cr.id = w.collaboration_request_id
    WHERE w.id::text = (storage.foldername(name))[1]
    AND (cr.requester_id = auth.uid() OR cr.requestee_id = auth.uid())
  )
);

-- Create workspace_files table for file metadata
CREATE TABLE public.workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on workspace_files
ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for workspace_files
CREATE POLICY "Participants can view workspace files"
ON public.workspace_files FOR SELECT
USING (public.can_access_workspace(workspace_id));

CREATE POLICY "Participants can upload workspace files"
ON public.workspace_files FOR INSERT
WITH CHECK (public.can_access_workspace(workspace_id) AND uploaded_by = auth.uid());

CREATE POLICY "Uploaders can delete their files"
ON public.workspace_files FOR DELETE
USING (uploaded_by = auth.uid());

-- Enable realtime for workspace_files
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_files;

-- Add push token support for FCM
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT false;