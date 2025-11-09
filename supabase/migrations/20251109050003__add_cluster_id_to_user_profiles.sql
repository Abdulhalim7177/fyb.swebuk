-- Add cluster_id column to user_profiles after clusters table is created
ALTER TABLE user_profiles ADD COLUMN cluster_id UUID REFERENCES clusters(id);

-- Create index for the new column
CREATE INDEX idx_user_profiles_cluster_id ON user_profiles(cluster_id);