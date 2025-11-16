-- Create session_processing_log table for tracking academic session end processes
CREATE TABLE IF NOT EXISTS session_processing_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  academic_level_changes JSONB, -- Stores details of which level changes were processed
  created_by UUID REFERENCES auth.users DEFAULT auth.uid(), -- Who processed the session
  notes TEXT
);

-- Enable RLS for session_processing_log table
ALTER TABLE session_processing_log ENABLE ROW LEVEL SECURITY;

-- Create policies for session_processing_log
CREATE POLICY "Admin and staff can view session processing logs." ON session_processing_log
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Create function to update updated_at timestamp if needed (for future use)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';