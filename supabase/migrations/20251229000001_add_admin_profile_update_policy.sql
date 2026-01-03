-- Add admin/staff update policy for profiles
-- This allows admins and staff members to update user profiles

-- First, check if the policy already exists to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Admins and staff can update any profile'
  ) THEN
    CREATE POLICY "Admins and staff can update any profile" ON profiles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'staff')
        )
      );
  END IF;
END $$;
