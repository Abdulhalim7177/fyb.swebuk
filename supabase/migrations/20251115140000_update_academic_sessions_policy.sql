-- Update policy to allow both admin and staff to manage academic sessions
DROP POLICY IF EXISTS "Admins can manage academic sessions." ON academic_sessions;

CREATE POLICY "Admin and staff can manage academic sessions." ON academic_sessions
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );