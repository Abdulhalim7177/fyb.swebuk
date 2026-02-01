create table cluster_chat (
  id uuid default gen_random_uuid() not null primary key,
  cluster_id uuid references public.clusters(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  message_type text default 'text' check (message_type in ('text', 'audio', 'file', 'system')),
  metadata jsonb default '{}'::jsonb,
  read_by uuid[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index cluster_chat_cluster_id_idx on cluster_chat(cluster_id);
create index cluster_chat_user_id_idx on cluster_chat(user_id);
create index cluster_chat_created_at_idx on cluster_chat(created_at);

-- Enable RLS
alter table cluster_chat enable row level security;

-- Policies

-- 1. View: Members of the cluster can view messages.
create policy "Cluster members can view chat" on cluster_chat
  for select using (
    exists (
      select 1 from cluster_members
      where cluster_members.cluster_id = cluster_chat.cluster_id
      and cluster_members.user_id = auth.uid()
      and cluster_members.status = 'approved'
    )
    or exists (
       select 1 from clusters
       where clusters.id = cluster_chat.cluster_id
       and (clusters.lead_id = auth.uid() or clusters.deputy_id = auth.uid() or clusters.staff_manager_id = auth.uid())
    )
    or exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- 2. Insert: Members can insert messages.
create policy "Cluster members can send messages" on cluster_chat
  for insert with check (
    user_id = auth.uid() and (
      exists (
        select 1 from cluster_members
        where cluster_members.cluster_id = cluster_chat.cluster_id
        and cluster_members.user_id = auth.uid()
        and cluster_members.status = 'approved'
      )
      or exists (
         select 1 from clusters
         where clusters.id = cluster_chat.cluster_id
         and (clusters.lead_id = auth.uid() or clusters.deputy_id = auth.uid() or clusters.staff_manager_id = auth.uid())
      )
       or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      )
    )
  );

-- 3. Update: Users can update messages (e.g. read_by) if they have access
create policy "Cluster members can update chat" on cluster_chat
  for update using (
      exists (
        select 1 from cluster_members
        where cluster_members.cluster_id = cluster_chat.cluster_id
        and cluster_members.user_id = auth.uid()
        and cluster_members.status = 'approved'
      )
      or exists (
         select 1 from clusters
         where clusters.id = cluster_chat.cluster_id
         and (clusters.lead_id = auth.uid() or clusters.deputy_id = auth.uid() or clusters.staff_manager_id = auth.uid())
      )
      or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      )
  );

-- Enable Realtime
alter publication supabase_realtime add table cluster_chat;
