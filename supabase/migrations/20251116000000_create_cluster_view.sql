create or replace view public.detailed_clusters as
select
    c.id,
    c.name,
    c.description,
    c.created_at,
    c.lead_id,
    lead_profiles.full_name as lead_name,
    lead_auth.email as lead_email,
    c.deputy_id,
    deputy_profiles.full_name as deputy_name,
    deputy_auth.email as deputy_email,
    c.staff_manager_id,
    staff_profiles.full_name as staff_manager_name,
    staff_auth.email as staff_manager_email,
    (
        select
            count(*)
        from
            cluster_members cm
        where
            cm.cluster_id = c.id and cm.status = 'approved'
    ) as members_count
from
    clusters c
left join
    profiles lead_profiles on c.lead_id = lead_profiles.id
left join
    auth.users lead_auth on c.lead_id = lead_auth.id
left join
    profiles deputy_profiles on c.deputy_id = deputy_profiles.id
left join
    auth.users deputy_auth on c.deputy_id = deputy_auth.id
left join
    profiles staff_profiles on c.staff_manager_id = staff_profiles.id
left join
    auth.users staff_auth on c.staff_manager_id = staff_auth.id;

-- RLS for the view
alter view public.detailed_clusters owner to postgres;
grant select on public.detailed_clusters to authenticated;
