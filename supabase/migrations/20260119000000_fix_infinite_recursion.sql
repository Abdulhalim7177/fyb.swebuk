-- Fix infinite recursion in project_members policies
-- The issue comes from circular dependencies between projects and project_members policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view approved project members" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON project_members;
DROP POLICY IF EXISTS "Project members can create progress items" ON project_progress;

-- Create simplified non-recursive policies for project_members

-- Policy for viewing members: Allow if user is part of the project OR is admin/staff
CREATE POLICY "View project members" ON project_members
  FOR SELECT USING (
    status = 'approved' OR
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Policy for managing members: Allow if user owns the project OR is admin
CREATE POLICY "Manage project members" ON project_members
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create simplified non-recursive policies for project_progress

-- Policy for inserting progress items: Allow if user is approved member, owner, or admin/staff
CREATE POLICY "Create project progress" ON project_progress
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    (
      -- Is Project Owner
      project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()) OR
      -- Is Admin/Staff
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff')) OR
      -- Is Approved Member (Direct lookup to avoid recursion)
      EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = project_progress.project_id 
        AND user_id = auth.uid() 
        AND status = 'approved'
      )
    )
  );

-- Helper function to check project membership without recursion if needed elsewhere
CREATE OR REPLACE FUNCTION is_project_member(check_project_id uuid, check_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = check_project_id
    AND user_id = check_user_id
    AND status = 'approved'
  );
$$;
