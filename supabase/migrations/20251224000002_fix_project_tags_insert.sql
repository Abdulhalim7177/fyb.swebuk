-- Fix project_tags INSERT policy to allow project creators to add tags
-- Use SECURITY DEFINER function to check if user can add tags to project

-- Drop existing policies
drop policy if exists "Project owners and members can add tags" on project_tags;
drop policy if exists "Project owners can delete tags" on project_tags;

-- Create SECURITY DEFINER function to check if user can add tags to project
create or replace function can_add_project_tags(user_id_param uuid, project_id_param uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  -- User can add tags if they own the project
  select exists (
    select 1 from projects
    where id = project_id_param and owner_id = user_id_param
  ) or exists (
    -- Or if user is an approved project member
    select 1 from project_members
    where project_id = project_id_param
    and user_id = user_id_param
    and status = 'approved'
  ) or exists (
    -- Or if user is admin/staff
    select 1 from profiles
    where id = user_id_param and role in ('admin', 'staff')
  );
$$;

-- Create INSERT policy using function
create policy "Project owners and members can add tags" on project_tags
  for insert with check (
    auth.role() = 'authenticated' and
    can_add_project_tags(auth.uid(), project_id)
  );

-- Update DELETE policy to use function
create policy "Project owners can delete tags" on project_tags
  for delete using (
    auth.role() = 'authenticated' and
    can_add_project_tags(auth.uid(), project_id)
  );

-- Grant execute on function
grant execute on function can_add_project_tags to authenticated;
