-- Create user_audit_log table
CREATE TABLE user_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id), -- User who performed the action
  target_user_id UUID REFERENCES user_profiles(id), -- User who was affected
  action TEXT NOT NULL, -- e.g., 'create', 'update_role', 'suspend', 'approve_membership'
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX idx_user_audit_log_user_id ON user_audit_log(user_id);
CREATE INDEX idx_user_audit_log_target_user_id ON user_audit_log(target_user_id);
CREATE INDEX idx_user_audit_log_created_at ON user_audit_log(created_at);

-- Function to log user management actions
CREATE OR REPLACE FUNCTION log_user_management_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO user_audit_log (user_id, target_user_id, action, old_values, new_values)
        VALUES (
            auth.uid(),
            NEW.id,
            'update_user_profile',
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO user_audit_log (user_id, target_user_id, action, new_values)
        VALUES (
            auth.uid(),
            NEW.id,
            'create_user_profile',
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER user_profile_audit_trigger
    AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION log_user_management_action();