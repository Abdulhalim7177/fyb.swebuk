-- Create an RPC function to get user's member project IDs safely
-- This avoids RLS recursion issues when querying project_members

create or replace function get_user_member_project_ids(user_id_param uuid)
returns table (project_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select pm.project_id
  from project_members pm
  where pm.user_id = user_id_param
    and pm.status = 'approved';
end;
$$;
