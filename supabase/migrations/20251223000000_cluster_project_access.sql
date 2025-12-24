-- Add cluster-based access control to projects
-- This allows users who are members of a cluster to access all cluster projects

-- Create function to check if a user is a member of a cluster
create or replace function is_cluster_member(user_id_param uuid, cluster_id_param uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  select exists(
    select 1 from cluster_members
    where cluster_members.cluster_id = cluster_id_param
    and cluster_members.user_id = user_id_param
    and cluster_members.status = 'approved'
  );
$$;

-- Create function to get cluster IDs for a user
create or replace function get_user_cluster_ids(user_id_param uuid)
returns table(cluster_id uuid)
security definer
set search_path = public
language sql
as $$
  select distinct cluster_id from cluster_members
  where user_id = user_id_param
  and status = 'approved'
$$;

-- Create function to get project IDs for a user based on cluster membership
create or replace function get_user_cluster_project_ids(user_id_param uuid)
returns table(project_id uuid)
security definer
set search_path = public
language sql
stable
as $$
  select distinct p.id as project_id
  from projects p
  join cluster_members cm on p.cluster_id = cm.cluster_id
  where cm.user_id = user_id_param
  and cm.status = 'approved'
  and p.type = 'cluster'
$$;

-- Create view for cluster projects accessible to a user
create or replace view user_accessible_cluster_projects as
select
  p.*,
  cm.role as cluster_role
from projects p
join cluster_members cm on p.cluster_id = cm.cluster_id
where p.type = 'cluster'
  and cm.status = 'approved';

-- Update the "Anyone can view public projects" policy to also allow cluster members to view cluster projects
drop policy if exists "Anyone can view public projects" on projects;

create policy "Anyone can view public projects; cluster members can view cluster projects" on projects
  for select using (
    visibility = 'public' or
    owner_id = auth.uid() or
    exists (
      select 1 from project_members
      where project_members.project_id = projects.id
      and project_members.user_id = auth.uid()
      and project_members.status = 'approved'
    ) or
    -- Cluster members can view all projects in their cluster
    (
      projects.type = 'cluster' and
      exists (
        select 1 from cluster_members
        where cluster_members.cluster_id = projects.cluster_id
        and cluster_members.user_id = auth.uid()
        and cluster_members.status = 'approved'
      )
    ) or
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'staff')
    )
  );

-- Create RPC to get projects accessible to a user (owned, member of, or cluster member)
create or replace function get_accessible_projects(
  user_id_param uuid default null, -- Changed default from auth.uid() to null to handle unauthenticated users
  filter_type text default null,
  filter_status text default null,
  filter_cluster_id text default null,
  filter_visibility text default null,
  search_term text default null,
  limit_count int default 100,
  offset_count int default 0
)
returns table(
  id uuid,
  name text,
  description text,
  type text,
  visibility text,
  status text,
  owner_id uuid,
  owner_name text,
  owner_email text,
  owner_avatar text,
  owner_academic_level text,
  cluster_id uuid,
  cluster_name text,
  members_count bigint,
  tags text[],
  repository_url text,
  demo_url text,
  created_at timestamptz,
  updated_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_user_role text;
begin
  -- Get user role if user_id_param is provided
  if user_id_param is not null then
    select role into v_user_role from profiles where id = user_id_param;
  end if;

  return query
  with accessible_projects as (
    select p.* from detailed_projects p
    where
      -- If user_id_param is provided, include projects they own, are members of, or are in clusters they belong to
      (
        user_id_param is not null
        and (
          -- User owns the project
          p.owner_id = user_id_param
          or
          -- User is a project member
          exists (
            select 1 from project_members pm
            where pm.project_id = p.id
            and pm.user_id = user_id_param
            and pm.status = 'approved'
          )
          or
          -- User is a cluster member and project is a cluster project
          (
            p.type = 'cluster'
            and exists (
              select 1 from cluster_members cm
              where cm.cluster_id = p.cluster_id
              and cm.user_id = user_id_param
              and cm.status = 'approved'
            )
          )
          or
          -- User is admin or staff
          v_user_role in ('admin', 'staff')
        )
      )
      or
      -- Always include public projects regardless of user authentication
      p.visibility = 'public'
  )
  select
    ap.id,
    ap.name,
    ap.description,
    ap.type,
    ap.visibility,
    ap.status,
    ap.owner_id,
    ap.owner_name,
    ap.owner_email,
    ap.owner_avatar,
    ap.owner_academic_level,
    ap.cluster_id,
    ap.cluster_name,
    ap.members_count,
    ap.tags,
    ap.repository_url,
    ap.demo_url,
    ap.created_at,
    ap.updated_at,
    ap.started_at,
    ap.completed_at
  from accessible_projects ap
  where
    (filter_type is null or ap.type = filter_type)
    and (filter_status is null or ap.status = filter_status)
    and (filter_cluster_id is null or ap.cluster_id = filter_cluster_id::uuid)
    and (
      filter_visibility is null
      or ap.visibility = filter_visibility
      or (filter_visibility = 'all')
    )
    and (
      search_term is null
      or ap.name ilike '%' || search_term || '%'
      or ap.description ilike '%' || search_term || '%'
      or ap.owner_name ilike '%' || search_term || '%'
      or ap.owner_email ilike '%' || search_term || '%'
      or ap.owner_academic_level ilike '%' || search_term || '%'
    )
  order by ap.created_at desc
  limit limit_count
  offset offset_count;
end;
$$;

-- Grant access to the function
grant execute on function get_accessible_projects to authenticated;
grant execute on function is_cluster_member to authenticated;
grant execute on function get_user_cluster_ids to authenticated;
grant execute on function get_user_cluster_project_ids to authenticated;

-- Create index for better performance
create index if not exists projects_cluster_access_idx
  on projects(type, cluster_id, visibility, status);
