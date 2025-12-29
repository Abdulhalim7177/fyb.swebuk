-- Add additional fields to the profiles table for staff profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office_location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS office_hours TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_interests JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_role TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_profile JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS qualifications TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Update the RLS policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);