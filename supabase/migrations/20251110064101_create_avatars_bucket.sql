-- Create a bucket for avatars
insert into storage.buckets (id, name)
values ('avatars', 'avatars');

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/storage/security/access-control#policies
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid() = owner) with check (bucket_id = 'avatars');
