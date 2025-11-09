-- Create cluster_members table
CREATE TABLE cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES user_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  UNIQUE(cluster_id, user_id)
);

-- Indexes for cluster_members
CREATE INDEX idx_cluster_members_cluster_id ON cluster_members(cluster_id);
CREATE INDEX idx_cluster_members_user_id ON cluster_members(user_id);
CREATE INDEX idx_cluster_members_status ON cluster_members(status);