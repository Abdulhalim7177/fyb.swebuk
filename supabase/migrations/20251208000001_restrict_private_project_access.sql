-- Update RLS policy to restrict private projects to owner and admin only
drop policy if exists "Anyone can view public projects" on projects;

create policy "Anyone can view public projects, private only for owner and admin" on projects
  for select using (
    visibility = 'public' or
    owner_id = auth.uid() or
    (
      visibility = 'private' and
      exists (
        select 1 from profiles
        where id = auth.uid() and role = 'admin'
      )
    ) or
    (
      visibility = 'public' and
      exists (
        select 1 from project_members
        where project_members.project_id = projects.id
        and project_members.user_id = auth.uid()
        and project_members.status = 'approved'
      )
    )
  );
