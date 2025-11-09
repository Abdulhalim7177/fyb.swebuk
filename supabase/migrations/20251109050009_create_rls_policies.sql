-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff')
    )
  );

CREATE POLICY "Staff can view student profiles in their clusters" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles staff_profiles
      WHERE staff_profiles.id = auth.uid()
      AND staff_profiles.role = 'staff'
      AND user_profiles.cluster_id = ANY(staff_profiles.managed_cluster_ids)
    )
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff')
    )
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Cluster RLS Policies
CREATE POLICY "Anyone can view active clusters" ON clusters
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins and staff can manage clusters" ON clusters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff', 'staff')
    )
  );

-- Cluster Members RLS Policies
CREATE POLICY "Users can view cluster memberships" ON cluster_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff', 'lead_student', 'deputy_lead')
    )
    OR user_id = auth.uid()
  );

-- Audit Log RLS Policies
CREATE POLICY "Admins can view all audit logs" ON user_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('administrator', 'manager_staff')
    )
  );

CREATE POLICY "Users can view their own audit actions" ON user_audit_log
  FOR SELECT USING (user_id = auth.uid());