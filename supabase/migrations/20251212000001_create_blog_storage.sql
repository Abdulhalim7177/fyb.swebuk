-- Create blog-images storage bucket (public for viewing)
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true);

-- Authenticated users can upload their own blog images
create policy "Authenticated users can upload blog images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'blog-images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view blog images (public bucket)
create policy "Anyone can view blog images"
on storage.objects for select
to public
using (
  bucket_id = 'blog-images'
);

-- Users can update their own blog images
create policy "Users can update their own blog images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'blog-images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own blog images
create policy "Users can delete their own blog images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'blog-images' and
  (storage.foldername(name))[1] = auth.uid()::text
);
