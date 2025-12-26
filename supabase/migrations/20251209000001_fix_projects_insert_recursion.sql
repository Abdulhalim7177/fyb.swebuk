-- Fix infinite recursion in projects INSERT policies
-- The problem: INSERT policy references projects.cluster_id which causes recursion
-- Solution: Use a SECURITY DEFINER function to check cluster membership

-- Drop problematic INSERT policies
drop policy if exists "Authenticated users can create personal projects" on projects;
drop policy if exists "Cluster leads, deputies, staff managers, and admins can create cluster projects" on projects;

-- Create SECURITY DEFINER function to check if user can create cluster project
-- This function uses the cluster_id parameter directly instead of querying projects
create or replace function can_create_cluster_project(user_id_param uuid, cluster_id_param uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  select exists (
    select 1 from profiles
    where id = user_id_param and role in ('admin', 'staff')
  ) or exists (
    select 1 from clusters
    where id = cluster_id_param and
    (
      lead_id = user_id_param or
      deputy_id = user_id_param or
      staff_manager_id = user_id_param
    )
  );
$$;

-- Recreate INSERT policy for personal projects (no recursion issue here)
create policy "Authenticated users can create personal projects" on projects
  for insert with check (
    auth.role() = 'authenticated' and
    owner_id = auth.uid() and
    type = 'personal'
  );

-- Recreate INSERT policy for cluster projects using the function
create policy "Cluster leads, deputies, staff managers, and admins can create cluster projects" on projects
  for insert with check (
    auth.role() = 'authenticated' and
    type = 'cluster' and
    cluster_id is not null and
    can_create_cluster_project(auth.uid(), cluster_id)
  );

-- Grant execute on function
grant execute on function can_create_cluster_project to authenticated;
