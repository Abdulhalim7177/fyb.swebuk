-- Allow users to delete their own pending cluster membership requests
create policy "Users can delete their own pending requests" on cluster_members
  for delete using (
    auth.role() = 'authenticated' and
    user_id = auth.uid() and
    status = 'pending'
  );
