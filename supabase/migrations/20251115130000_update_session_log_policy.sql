-- Update policy to allow both admin and staff to view session processing logs
DROP POLICY IF EXISTS "Admins can view session processing logs." ON session_processing_log;
DROP POLICY IF EXISTS "Admin and staff can view session processing logs." ON session_processing_log;

CREATE POLICY "Admin and staff can view session processing logs." ON session_processing_log
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );