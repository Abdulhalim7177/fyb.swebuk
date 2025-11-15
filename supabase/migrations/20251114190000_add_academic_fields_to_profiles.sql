-- Add academic level and additional fields to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS academic_level TEXT DEFAULT 'student';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Software Engineering';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS faculty TEXT DEFAULT 'Faculty of Computing';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS institution TEXT DEFAULT 'Bayero University';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Create academic_sessions table
CREATE TABLE IF NOT EXISTS academic_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_name TEXT NOT NULL UNIQUE, -- e.g., "2024/2025", "2025/2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  semester TEXT DEFAULT 'Semester I',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for academic_sessions table
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for academic_sessions
CREATE POLICY "Admins can manage academic sessions." ON academic_sessions
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for academic_sessions
CREATE TRIGGER update_academic_sessions_updated_at 
    BEFORE UPDATE ON academic_sessions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default active session if none exists
INSERT INTO academic_sessions (session_name, start_date, end_date, is_active)
SELECT '2024/2025', '2024-09-01', '2025-07-01', true
WHERE NOT EXISTS (SELECT 1 FROM academic_sessions);