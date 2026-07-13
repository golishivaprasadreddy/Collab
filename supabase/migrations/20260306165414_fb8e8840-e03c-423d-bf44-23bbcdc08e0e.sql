
-- Create storage bucket for portfolio project images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-images', 'portfolio-images', true);

-- Allow authenticated users to upload their own portfolio images
CREATE POLICY "Users can upload portfolio images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view portfolio images (public bucket)
CREATE POLICY "Portfolio images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

-- Allow users to delete their own portfolio images
CREATE POLICY "Users can delete own portfolio images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'portfolio-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to update their own portfolio images
CREATE POLICY "Users can update own portfolio images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio-images' AND (storage.foldername(name))[1] = auth.uid()::text);
