-- Create shared functions and triggers for all tables

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to safely validate UUID references (avoiding circular dependencies)
CREATE OR REPLACE FUNCTION is_valid_user_profile(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(SELECT 1 FROM user_profiles WHERE id = user_uuid);
END;
$$ language 'plpgsql';