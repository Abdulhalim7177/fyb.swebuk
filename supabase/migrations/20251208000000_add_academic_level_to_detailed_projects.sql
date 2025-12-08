-- Update view for detailed projects to include owner's academic level
drop view if exists detailed_projects;

create view detailed_projects as
select
  p.id,
  p.name,
  p.description,
  p.type,
  p.visibility,
  p.status,
  p.owner_id,
  p.cluster_id,
  p.repository_url,
  p.demo_url,
  p.created_at,
  p.updated_at,
  p.started_at,
  p.completed_at,
  owner.full_name as owner_name,
  owner_auth.email as owner_email,
  owner.avatar_url as owner_avatar,
  owner.academic_level as owner_academic_level,
  c.name as cluster_name,
  (
    select count(*)
    from project_members pm
    where pm.project_id = p.id and pm.status = 'approved'
  ) as members_count,
  (
    select array_agg(pt.tag)
    from project_tags pt
    where pt.project_id = p.id
  ) as tags
from projects p
left join profiles owner on p.owner_id = owner.id
left join auth.users owner_auth on p.owner_id = owner_auth.id
left join clusters c on p.cluster_id = c.id;
