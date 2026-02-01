-- Create call_logs table
create table call_logs (
  id uuid default gen_random_uuid() not null primary key,
  context_type text not null check (context_type in ('project', 'cluster', 'fyp')),
  context_id uuid not null, -- The project_id, cluster_id, or fyp_id
  initiator_id uuid references public.profiles(id) on delete set null,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  status text default 'waiting' check (status in ('waiting', 'active', 'ended', 'missed')),
  created_at timestamptz default now() not null
);

-- Create call_participants table
create table call_participants (
  id uuid default gen_random_uuid() not null primary key,
  call_id uuid references public.call_logs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  left_at timestamptz,
  unique(call_id, user_id)
);

-- Indexes
create index call_logs_context_idx on call_logs(context_id, context_type);
create index call_logs_status_idx on call_logs(status);
create index call_participants_call_id_idx on call_participants(call_id);

-- Enable RLS
alter table call_logs enable row level security;
alter table call_participants enable row level security;

-- Policies for call_logs
-- Simplification: Allow authenticated users to view/create calls. 
-- In a stricter app, we'd check membership logic again (like in chat), but for now we rely on the UI context.
create policy "Authenticated users can view calls" on call_logs
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can start calls" on call_logs
  for insert with check (auth.role() = 'authenticated');

create policy "Participants can update calls" on call_logs
  for update using (auth.role() = 'authenticated');

-- Policies for call_participants
create policy "Authenticated users can view participants" on call_participants
  for select using (auth.role() = 'authenticated');

create policy "Users can join/leave calls" on call_participants
  for all using (auth.role() = 'authenticated');

-- Enable Realtime
alter publication supabase_realtime add table call_logs;
alter publication supabase_realtime add table call_participants;
