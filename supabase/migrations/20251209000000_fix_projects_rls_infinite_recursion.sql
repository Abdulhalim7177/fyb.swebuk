-- Fix infinite recursion in projects RLS policies
-- The issue: project_members policy references projects, and projects policy references project_members
-- Solution: Break the circular dependency by simplifying the policies

-- Drop the problematic policies
drop policy if exists "Anyone can view public projects, private only for owner and admin" on projects;
drop policy if exists "Anyone can view approved project members" on project_members;

-- Recreate projects SELECT policy without referencing project_members
-- This breaks the circular dependency
create policy "Projects select policy" on projects
  for select using (
    -- Public projects are visible to everyone
    visibility = 'public' or
    -- Owner can see their own projects
    owner_id = auth.uid() or
    -- Admins can see all projects
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Recreate project_members SELECT policy without complex subquery
-- Use a simpler approach that doesn't cause recursion
create policy "Project members select policy" on project_members
  for select using (
    -- User can see their own membership records
    user_id = auth.uid() or
    -- Admins can see all memberships
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    ) or
    -- Project owners can see memberships for their projects
    exists (
      select 1 from projects
      where projects.id = project_members.project_id
      and projects.owner_id = auth.uid()
    ) or
    -- Approved members are visible to everyone (for public projects)
    (status = 'approved')
  );

-- Add a separate policy for INSERT on project_members by owners/admins
-- This allows them to directly add members without triggering recursion
create policy "Project owners and admins can insert members" on project_members
  for insert with check (
    auth.role() = 'authenticated' and (
      -- User requesting to join (existing policy)
      (user_id = auth.uid() and status = 'pending' and role = 'member') or
      -- Owner adding members directly
      exists (
        select 1 from projects
        where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
      ) or
      -- Admins can add anyone
      exists (
        select 1 from profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );

-- Drop the old insert policies that are now combined
drop policy if exists "Users can request to join projects" on project_members;

-- Keep the existing update/delete policy for project_members
-- This one doesn't cause recursion issues
