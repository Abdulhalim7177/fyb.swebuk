-- Create clusters table
create table clusters (
  id uuid default gen_random_uuid() not null primary key,
  name text not null,
  description text,
  lead_id uuid references public.profiles(id) on delete set null,
  deputy_id uuid references public.profiles(id) on delete set null,
  staff_manager_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references public.profiles(id) not null
);

-- Create cluster_members table
create table cluster_members (
  id uuid default gen_random_uuid() not null primary key,
  cluster_id uuid references public.clusters(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('member', 'lead', 'deputy', 'staff_manager')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  joined_at timestamptz default now() not null,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  unique(cluster_id, user_id)
);

-- Enable RLS
alter table clusters enable row level security;
alter table cluster_members enable row level security;

-- Clusters policies
create policy "Anyone can view clusters" on clusters
  for select using (true);

create policy "Staff and admins can create clusters" on clusters
  for insert with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

create policy "Cluster leads, staff managers, and admins can update clusters" on clusters
  for update using (
    auth.role() = 'authenticated' and (
      exists (select 1 from profiles where id = auth.uid() and role = 'admin') or
      lead_id = auth.uid() or
      deputy_id = auth.uid() or
      staff_manager_id = auth.uid()
    )
  );

create policy "Admins can delete clusters" on clusters
  for delete using (
    auth.role() = 'authenticated' and
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Cluster members policies
create policy "Anyone can view cluster members" on cluster_members
  for select using (true);

create policy "Users can request to join clusters" on cluster_members
  for insert with check (
    auth.role() = 'authenticated' and
    user_id = auth.uid() and
    status = 'pending'
  );

create policy "Cluster leads, staff managers, and admins can manage members" on cluster_members
  for all using (
    auth.role() = 'authenticated' and (
      exists (select 1 from profiles where id = auth.uid() and role = 'admin') or
      exists (
        select 1 from clusters
        where clusters.id = cluster_members.cluster_id and
        (clusters.lead_id = auth.uid() or
         clusters.deputy_id = auth.uid() or
         clusters.staff_manager_id = auth.uid())
      )
    )
  );

-- Create indexes
create index clusters_lead_id_idx on clusters(lead_id);
create index clusters_deputy_id_idx on clusters(deputy_id);
create index clusters_staff_manager_id_idx on clusters(staff_manager_id);
create index cluster_members_cluster_id_idx on cluster_members(cluster_id);
create index cluster_members_user_id_idx on cluster_members(user_id);
create index cluster_members_status_idx on cluster_members(status);

-- Trigger to update updated_at (function should already exist from previous migrations)
create trigger update_clusters_updated_at
  before update on clusters
  for each row execute procedure update_updated_at_column();