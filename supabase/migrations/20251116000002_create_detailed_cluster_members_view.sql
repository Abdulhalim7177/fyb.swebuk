create or replace view public.detailed_cluster_members as
select
  cm.*,
  u.full_name,
  u.email,
  u.avatar_url,
  u.role as user_role
from
  public.cluster_members cm
left join
  public.public_profiles_with_email u on cm.user_id = u.id;

-- RLS for the view
alter view public.detailed_cluster_members owner to postgres;
grant select on public.detailed_cluster_members to authenticated;
