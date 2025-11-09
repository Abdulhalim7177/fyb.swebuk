-- Create clusters table
CREATE TABLE clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lead_student_id UUID REFERENCES user_profiles(id),
  deputy_lead_id UUID REFERENCES user_profiles(id),
  manager_staff_id UUID REFERENCES user_profiles(id), -- Staff manager for this cluster
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for clusters
CREATE INDEX idx_clusters_is_active ON clusters(is_active);

-- Trigger for updated_at on clusters
CREATE TRIGGER update_clusters_updated_at
    BEFORE UPDATE ON clusters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();