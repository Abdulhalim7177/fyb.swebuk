-- Add skills field to the profiles table as a JSON array
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- Update the RLS policy to allow users to update their own skills
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);