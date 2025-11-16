create or replace view public.public_profiles_with_email as
select
  p.id,
  p.full_name,
  p.avatar_url,
  p.role,
  p.academic_level,
  p.department,
  p.faculty,
  p.institution,
  p.linkedin_url,
  p.github_url,
  au.email
from
  public.profiles p
left join
  auth.users au on p.id = au.id;

-- RLS for the view
alter view public.public_profiles_with_email owner to postgres;
grant select on public.public_profiles_with_email to authenticated;