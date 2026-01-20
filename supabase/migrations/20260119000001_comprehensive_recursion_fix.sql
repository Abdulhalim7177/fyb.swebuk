-- Fix infinite recursion by dropping ALL related policies and rebuilding with SECURITY DEFINER functions

-- 1. Helper Functions (SECURITY DEFINER to bypass RLS and break recursion cycles)

-- Check if a user is the owner of a project
CREATE OR REPLACE FUNCTION is_project_owner(check_project_id uuid, check_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = check_project_id
    AND owner_id = check_user_id
  );
$$;

-- Check if a user is an approved member of a project
CREATE OR REPLACE FUNCTION is_project_member(check_project_id uuid, check_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = check_project_id
    AND user_id = check_user_id
    AND status = 'approved'
  );
$$;

-- Check if a user has admin or staff role
CREATE OR REPLACE FUNCTION is_admin_or_staff(check_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = check_user_id
    AND role IN ('admin', 'staff')
  );
$$;


-- 2. Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Anyone can view public projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create personal projects" ON projects;
DROP POLICY IF EXISTS "Cluster leads, deputies, staff managers, and admins can create cluster projects" ON projects;
DROP POLICY IF EXISTS "Project owners and admins can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners and admins can delete projects" ON projects;

DROP POLICY IF EXISTS "Anyone can view approved project members" ON project_members;
DROP POLICY IF EXISTS "Users can request to join projects" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can manage members" ON project_members;
DROP POLICY IF EXISTS "View project members" ON project_members;
DROP POLICY IF EXISTS "Manage project members" ON project_members;

DROP POLICY IF EXISTS "Project members can view files" ON project_files;
DROP POLICY IF EXISTS "Project members can upload files" ON project_files;
DROP POLICY IF EXISTS "File uploaders and project owners can delete files" ON project_files;

DROP POLICY IF EXISTS "Project members can view progress" ON project_progress;
DROP POLICY IF EXISTS "Project members can create progress items" ON project_progress;
DROP POLICY IF EXISTS "Project members can update progress items" ON project_progress;
DROP POLICY IF EXISTS "Progress creators and project owners can delete progress" ON project_progress;
DROP POLICY IF EXISTS "Create project progress" ON project_progress;

DROP POLICY IF EXISTS "Project members can view chat" ON project_chat;
DROP POLICY IF EXISTS "Project members can send messages" ON project_chat;
DROP POLICY IF EXISTS "Message senders can delete their messages" ON project_chat;


-- 3. PROJECTS Policies

CREATE POLICY "select_projects" ON projects
  FOR SELECT USING (
    visibility = 'public' OR
    owner_id = auth.uid() OR
    is_project_member(id, auth.uid()) OR
    is_admin_or_staff(auth.uid())
  );

CREATE POLICY "insert_projects" ON projects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    owner_id = auth.uid() AND
    (
      type = 'personal' OR
      (type = 'cluster' AND (is_admin_or_staff(auth.uid()) OR EXISTS (
        SELECT 1 FROM clusters
        WHERE clusters.id = projects.cluster_id
        AND (clusters.lead_id = auth.uid() OR clusters.deputy_id = auth.uid() OR clusters.staff_manager_id = auth.uid())
      )))
    )
  );

CREATE POLICY "update_projects" ON projects
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (owner_id = auth.uid() OR is_admin_or_staff(auth.uid()))
  );

CREATE POLICY "delete_projects" ON projects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    (owner_id = auth.uid() OR is_admin_or_staff(auth.uid()))
  );


-- 4. PROJECT_MEMBERS Policies

CREATE POLICY "select_project_members" ON project_members
  FOR SELECT USING (
    status = 'approved' OR
    user_id = auth.uid() OR
    is_project_owner(project_id, auth.uid()) OR
    is_admin_or_staff(auth.uid())
  );

CREATE POLICY "insert_project_members" ON project_members
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    status = 'pending'
  );

CREATE POLICY "update_project_members" ON project_members
  FOR UPDATE USING (
    is_project_owner(project_id, auth.uid()) OR
    is_admin_or_staff(auth.uid())
  );

CREATE POLICY "delete_project_members" ON project_members
  FOR DELETE USING (
    user_id = auth.uid() OR -- Leave project
    is_project_owner(project_id, auth.uid()) OR
    is_admin_or_staff(auth.uid())
  );


-- 5. PROJECT_FILES Policies

CREATE POLICY "select_project_files" ON project_files
  FOR SELECT USING (
    is_project_owner(project_id, auth.uid()) OR
    is_project_member(project_id, auth.uid()) OR
    is_admin_or_staff(auth.uid()) OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_files.project_id AND visibility = 'public')
  );

CREATE POLICY "insert_project_files" ON project_files
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    uploaded_by = auth.uid() AND
    (
      is_project_owner(project_id, auth.uid()) OR
      is_project_member(project_id, auth.uid())
    )
  );

CREATE POLICY "delete_project_files" ON project_files
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    (
      uploaded_by = auth.uid() OR
      is_project_owner(project_id, auth.uid()) OR
      is_admin_or_staff(auth.uid())
    )
  );


-- 6. PROJECT_PROGRESS Policies

CREATE POLICY "select_project_progress" ON project_progress
  FOR SELECT USING (
    is_project_owner(project_id, auth.uid()) OR
    is_project_member(project_id, auth.uid()) OR
    is_admin_or_staff(auth.uid()) OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_progress.project_id AND visibility = 'public')
  );

CREATE POLICY "insert_project_progress" ON project_progress
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    created_by = auth.uid() AND
    (
      is_project_owner(project_id, auth.uid()) OR
      is_project_member(project_id, auth.uid()) OR
      is_admin_or_staff(auth.uid())
    )
  );

CREATE POLICY "update_project_progress" ON project_progress
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    (
      is_project_owner(project_id, auth.uid()) OR
      is_project_member(project_id, auth.uid()) OR
      is_admin_or_staff(auth.uid())
    )
  );

CREATE POLICY "delete_project_progress" ON project_progress
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    (
      created_by = auth.uid() OR
      is_project_owner(project_id, auth.uid()) OR
      is_admin_or_staff(auth.uid())
    )
  );


-- 7. PROJECT_CHAT Policies

CREATE POLICY "select_project_chat" ON project_chat
  FOR SELECT USING (
    is_project_owner(project_id, auth.uid()) OR
    is_project_member(project_id, auth.uid()) OR
    is_admin_or_staff(auth.uid())
  );

CREATE POLICY "insert_project_chat" ON project_chat
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    (
      is_project_owner(project_id, auth.uid()) OR
      is_project_member(project_id, auth.uid())
    )
  );

CREATE POLICY "delete_project_chat" ON project_chat
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    (
      user_id = auth.uid() OR
      is_project_owner(project_id, auth.uid()) OR
      is_admin_or_staff(auth.uid())
    )
  );
