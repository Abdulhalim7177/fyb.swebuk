-- Fix infinite recursion in projects INSERT policies
-- The problem: INSERT policy references projects.cluster_id which causes recursion
-- Solution: Use NEW.cluster_id directly instead of querying projects table

-- Drop the problematic INSERT policies
drop policy if exists "Authenticated users can create personal projects" on projects;
drop policy if exists "Cluster leads, deputies, staff managers, and admins can create cluster projects" on projects;

-- Recreate INSERT policy for personal projects (no recursion issue here)
create policy "Authenticated users can create personal projects" on projects
  for insert with check (
    auth.role() = 'authenticated' and
    owner_id = auth.uid() and
    type = 'personal'
  );

-- Recreate INSERT policy for cluster projects
-- Use the NEW record values directly instead of subquery on projects
create policy "Cluster leads, deputies, staff managers, and admins can create cluster projects" on projects
  for insert with check (
    auth.role() = 'authenticated' and
    type = 'cluster' and
    cluster_id is not null and
    (
      -- Admin or staff can create cluster projects
      exists (
        select 1 from profiles
        where id = auth.uid() and role in ('admin', 'staff')
      ) or
      -- Cluster leads, deputies, and staff managers can create projects
      -- Use cluster_id from the NEW record being inserted
      exists (
        select 1 from clusters
        where clusters.id = cluster_id and
        (
          clusters.lead_id = auth.uid() or
          clusters.deputy_id = auth.uid() or
          clusters.staff_manager_id = auth.uid()
        )
      )
    )
  );
