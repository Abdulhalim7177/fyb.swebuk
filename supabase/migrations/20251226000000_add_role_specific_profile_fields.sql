-- Add registration_number and staff_number fields to profiles table
-- registration_number: for students (e.g., matric number)
-- staff_number: for staff and admin users

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS registration_number TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_number TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.registration_number IS 'Student registration/matriculation number (for student role only)';

COMMENT ON COLUMN profiles.staff_number IS 'Staff identification number (for staff and admin roles only)';

COMMENT ON COLUMN profiles.bio IS 'User biography or description';
