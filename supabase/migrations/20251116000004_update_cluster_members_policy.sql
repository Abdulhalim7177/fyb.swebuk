drop policy "Cluster leads, staff managers, and admins can manage members" on public.cluster_members;

create policy "Cluster leads, staff, and admins can manage members" on public.cluster_members
  for all using (
    auth.role() = 'authenticated' and (
      exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'staff')) or
      exists (
        select 1 from clusters
        where clusters.id = cluster_members.cluster_id and
        (clusters.lead_id = auth.uid() or
         clusters.deputy_id = auth.uid())
      )
    )
  );
