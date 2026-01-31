-- Add read_by column to fyp_chat table to track message views
ALTER TABLE fyp_chat
ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]'::jsonb;

-- Create a policy to allow users to update the read_by column
-- This is needed so users can mark messages as read
CREATE POLICY "Users can update read_by on fyp_chat" ON fyp_chat
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM final_year_projects
        WHERE final_year_projects.id = fyp_chat.fyp_id
        AND (
          final_year_projects.student_id = auth.uid() OR
          final_year_projects.supervisor_id = auth.uid()
        )
      ) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM final_year_projects
        WHERE final_year_projects.id = fyp_chat.fyp_id
        AND (
          final_year_projects.student_id = auth.uid() OR
          final_year_projects.supervisor_id = auth.uid()
        )
      ) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );
