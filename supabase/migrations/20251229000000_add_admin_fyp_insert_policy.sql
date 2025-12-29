-- Add INSERT policy for Admins to create FYPs for students
-- This fixes the RLS policy violation when admins assign students to FYPs

CREATE POLICY "Admins can create FYPs for students" ON final_year_projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
