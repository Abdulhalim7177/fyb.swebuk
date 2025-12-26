-- Fix events INSERT policy to allow cluster leads/deputies to create cluster events
-- Also fix event tags INSERT policy

-- Drop existing INSERT policies
drop policy if exists "Staff and Admins can create events" on events;
drop policy if exists "Staff and Admins can manage tags" on event_tags;

-- Create SECURITY DEFINER function to check if user can create event for a cluster
create or replace function can_create_event_for_cluster(user_id_param uuid, cluster_id_param uuid)
returns boolean
security definer
set search_path = public
language sql
as $$
  select exists (
    select 1 from profiles
    where id = user_id_param and role in ('admin', 'staff')
  ) or exists (
    select 1 from clusters
    where id = cluster_id_param and
    (
      lead_id = user_id_param or
      deputy_id = user_id_param or
      staff_manager_id = user_id_param
    )
  );
$$;

-- Create INSERT policy for events
-- Allows staff/admin to create any event, and cluster leaders to create events for their cluster
create policy "Staff, admins, and cluster leads can create events" on events
  for insert with check (
    auth.role() = 'authenticated' and
    (
      -- Staff and admins can create any event (standalone or for any cluster)
      exists (
        select 1 from profiles
        where id = auth.uid() and role in ('admin', 'staff')
      ) or
      -- Cluster leads, deputies, and staff managers can create events for their cluster
      (
        cluster_id is not null and
        can_create_event_for_cluster(auth.uid(), cluster_id)
      )
      or
      -- Anyone can create standalone events (no cluster)
      cluster_id is null
    )
  );

-- Grant execute on function
grant execute on function can_create_event_for_cluster to authenticated;

-- Fix event_tags INSERT policy
create policy "Event organizers and admins can manage tags" on event_tags
  for insert with check (
    auth.role() = 'authenticated' and
    (
      -- Staff and admins can add tags to any event
      exists (
        select 1 from profiles
        where id = auth.uid() and role in ('admin', 'staff')
      ) or
      -- Event organizers can add tags to their own events
      exists (
        select 1 from events
        where events.id = event_tags.event_id and events.organizer_id = auth.uid()
      )
    )
  );

-- Update event_tags DELETE policy
drop policy if exists "Staff and Admins can manage tags" on event_tags;

create policy "Event organizers and admins can delete tags" on event_tags
  for delete using (
    auth.role() = 'authenticated' and
    (
      exists (
        select 1 from profiles
        where id = auth.uid() and role in ('admin', 'staff')
      ) or
      exists (
        select 1 from events
        where events.id = event_tags.event_id and events.organizer_id = auth.uid()
      )
    )
  );
