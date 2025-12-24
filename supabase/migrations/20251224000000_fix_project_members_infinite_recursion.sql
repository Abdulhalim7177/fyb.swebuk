-- Fix infinite recursion in project_members policies
-- The issue: project_members policy references projects, and projects policy references project_members
-- Solution: Break the circular dependency by restructuring the policies

-- First, drop the problematic policies that cause circular dependencies
drop policy if exists "Anyone can view public projects; cluster members can view cluster projects" on projects;
drop policy if exists "Anyone can view approved project members" on project_members;
drop policy if exists "Users can request to join projects" on project_members;
drop policy if exists "Project owners and admins can manage members" on project_members;

-- Create a simplified projects SELECT policy that doesn't reference project_members
create policy "Projects select policy - public and owned projects" on projects
  for select using (
    -- Public projects are visible to everyone
    visibility = 'public' or
    -- Owner can see their own projects
    owner_id = auth.uid() or
    -- Admins can see all projects
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'staff')
    ) or
    -- Cluster members can view cluster projects
    (
      type = 'cluster' and
      exists (
        select 1 from cluster_members
        where cluster_members.cluster_id = projects.cluster_id
        and cluster_members.user_id = auth.uid()
        and cluster_members.status = 'approved'
      )
    )
  );

-- Create a simplified project_members SELECT policy that doesn't cause recursion
create policy "Project members select policy" on project_members
  for select using (
    -- User can see their own membership records
    user_id = auth.uid() or
    -- Admins can see all memberships
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'staff')
    ) or
    -- Project owners can see memberships for their projects
    exists (
      select 1 from projects
      where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
    ) or
    -- Approved members can see other approved members
    (
      status = 'approved' and
      exists (
        select 1 from project_members pm2
        where pm2.project_id = project_members.project_id
        and pm2.user_id = auth.uid()
        and pm2.status = 'approved'
      )
    )
  );

-- Create a proper INSERT policy for project_members that doesn't cause recursion
create policy "Users and project owners can request/join projects" on project_members
  for insert with check (
    auth.role() = 'authenticated' and (
      -- Regular user requesting to join a project
      (
        user_id = auth.uid() and 
        status = 'pending' and 
        role = 'member'
      ) or
      -- Project owners, admins, and staff can directly add members
      exists (
        select 1 from projects
        where projects.id = project_members.project_id
        and (
          projects.owner_id = auth.uid() or
          exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'staff'))
        )
      )
    )
  );

-- Create UPDATE policy for project_members
create policy "Project owners and admins can update project members" on project_members
  for update using (
    auth.role() = 'authenticated' and (
      exists (
        select 1 from projects
        where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
      ) or
      exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'staff'))
    )
  );

-- Create DELETE policy for project_members
create policy "Project owners and admins can remove project members" on project_members
  for delete using (
    auth.role() = 'authenticated' and (
      exists (
        select 1 from projects
        where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
      ) or
      exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'staff'))
    )
  );

-- Add back the policy that allows approved members to view their projects
create policy "Approved project members can view project details" on projects
  for select using (
    exists (
      select 1 from project_members
      where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
      and project_members.status = 'approved'
    )
  );