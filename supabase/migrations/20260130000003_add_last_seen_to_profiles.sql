-- Add last_seen column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Create a policy to allow users to update their own last_seen (already covered by "Users can update own profile" but good to verify)
-- Existing policy: "Users can update own profile." should cover it.
