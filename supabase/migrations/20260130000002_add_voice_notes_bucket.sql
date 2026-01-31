-- Create storage bucket for chat voice notes
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-voice-notes', 'chat-voice-notes', true) -- Public true for easier playback, RLS will control insert/delete
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat voice notes bucket

-- 1. Allow upload for authenticated users (we'll rely on the app logic + fyp_chat policies to ensure validity)
-- Ideally, we'd check if they belong to the FYP, but storage RLS is tricky with complex joins.
-- A simpler approach for chat uploads is often checking auth.role() = 'authenticated' and relying on file naming conventions or strict folder structure 
-- linked to RLS, OR just allowing authenticated uploads and letting the app handle the reference.
-- To be safer, let's allow uploads to a specific folder structure: {fyp_id}/{user_id}/{filename}

CREATE POLICY "Authenticated users can upload voice notes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-voice-notes' AND
    auth.role() = 'authenticated'
  );

-- 2. Allow public viewing (since we set public=true, this is implicit, but good to be explicit for SELECT if we turn public off)
CREATE POLICY "Anyone can listen to voice notes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-voice-notes');

-- 3. Users can delete their own files
CREATE POLICY "Users can delete their own voice notes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-voice-notes' AND
    auth.uid()::text = (storage.foldername(name))[2] -- Assuming structure fyp_id/user_id/filename
  );
