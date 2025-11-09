-- Fix RLS policies to resolve circular dependency for admin access
-- Drop the problematic policy that creates circular reference
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- Create new admin policies using auth.jwt() instead of querying user_profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('administrator', 'manager_staff')
  );

CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    auth.jwt()->>'role' IN ('administrator', 'manager_staff')
  );

-- Also fix the cluster management policies
DROP POLICY IF EXISTS "Admins and staff can manage clusters" ON clusters;
DROP POLICY IF EXISTS "Staff can view student profiles in their clusters" ON user_profiles;

CREATE POLICY "Admins and staff can manage clusters" ON clusters
  FOR ALL USING (
    auth.jwt()->>'role' IN ('administrator', 'manager_staff', 'staff')
  );

CREATE POLICY "Staff can view student profiles in their clusters" ON user_profiles
  FOR SELECT USING (
    auth.jwt()->>'role' = 'staff'
    AND cluster_id IS NOT NULL
  );

-- Fix audit log policies
DROP POLICY IF EXISTS "Admins can view all audit logs" ON user_audit_log;

CREATE POLICY "Admins can view all audit logs" ON user_audit_log
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('administrator', 'manager_staff')
  );