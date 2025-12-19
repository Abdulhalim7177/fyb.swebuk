-- Create blogs table
create table blogs (
  id uuid default gen_random_uuid() not null primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  featured_image_url text,
  category text not null check (category in (
    'frontend', 'backend', 'ai_ml', 'devops', 'mobile',
    'security', 'career', 'tutorials', 'research',
    'projects', 'events', 'announcements', 'tips'
  )),
  status text default 'draft' check (status in (
    'draft', 'pending_approval', 'published', 'rejected', 'archived'
  )),
  is_featured boolean default false,
  cluster_id uuid references public.clusters(id) on delete set null,
  view_count integer default 0,
  read_time_minutes integer,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  rejected_reason text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create blog_tags table for custom tags
create table blog_tags (
  id uuid default gen_random_uuid() not null primary key,
  blog_id uuid references public.blogs(id) on delete cascade not null,
  tag text not null,
  created_at timestamptz default now() not null,
  unique(blog_id, tag)
);

-- Create blog_comments table with nested reply support
create table blog_comments (
  id uuid default gen_random_uuid() not null primary key,
  blog_id uuid references public.blogs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.blog_comments(id) on delete cascade,
  content text not null,
  is_edited boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create blog_likes table
create table blog_likes (
  id uuid default gen_random_uuid() not null primary key,
  blog_id uuid references public.blogs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(blog_id, user_id)
);

-- Enable RLS on all tables
alter table blogs enable row level security;
alter table blog_tags enable row level security;
alter table blog_comments enable row level security;
alter table blog_likes enable row level security;

-- =====================
-- BLOGS RLS POLICIES
-- =====================

-- 1. Anyone can view published blogs
create policy "Anyone can view published blogs" on blogs
  for select using (status = 'published');

-- 2. Authors can view their own blogs (any status)
create policy "Authors can view own blogs" on blogs
  for select using (auth.uid() = author_id);

-- 3. Staff and Admins can view all blogs (for moderation)
create policy "Staff and Admins can view all blogs" on blogs
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- 4. Cluster leads/deputies can view pending blogs in their cluster
create policy "Cluster leaders can view pending cluster blogs" on blogs
  for select using (
    status = 'pending_approval' and
    cluster_id is not null and
    exists (
      select 1 from clusters
      where id = blogs.cluster_id and
      (lead_id = auth.uid() or deputy_id = auth.uid())
    )
  );

-- 5. Authenticated users can create blogs
create policy "Authenticated users can create blogs" on blogs
  for insert with check (
    auth.role() = 'authenticated' and
    auth.uid() = author_id
  );

-- 6. Authors can update their own unpublished blogs
create policy "Authors can update own unpublished blogs" on blogs
  for update using (
    auth.uid() = author_id and
    status in ('draft', 'rejected', 'pending_approval')
  );

-- 7. Staff and Admins can update any blog (for approval/moderation)
create policy "Staff and Admins can update any blog" on blogs
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- 8. Cluster leads/deputies can update pending blogs in their cluster (for approval)
create policy "Cluster leaders can update pending cluster blogs" on blogs
  for update using (
    status = 'pending_approval' and
    cluster_id is not null and
    exists (
      select 1 from clusters
      where id = blogs.cluster_id and
      (lead_id = auth.uid() or deputy_id = auth.uid())
    )
  );

-- 9. Authors can delete their own drafts
create policy "Authors can delete own drafts" on blogs
  for delete using (
    auth.uid() = author_id and status = 'draft'
  );

-- 10. Admins can delete any blog
create policy "Admins can delete any blog" on blogs
  for delete using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================
-- BLOG_TAGS RLS POLICIES
-- =====================

-- Anyone can view tags of published blogs
create policy "Anyone can view tags of published blogs" on blog_tags
  for select using (
    exists (
      select 1 from blogs
      where blogs.id = blog_tags.blog_id and blogs.status = 'published'
    )
  );

-- Authors can view tags of their own blogs
create policy "Authors can view own blog tags" on blog_tags
  for select using (
    exists (
      select 1 from blogs
      where blogs.id = blog_tags.blog_id and blogs.author_id = auth.uid()
    )
  );

-- Staff/Admin can view all tags
create policy "Staff and Admins can view all tags" on blog_tags
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('staff', 'admin')
    )
  );

-- Authors can add tags to their own blogs
create policy "Authors can add tags to own blogs" on blog_tags
  for insert with check (
    auth.role() = 'authenticated' and
    exists (
      select 1 from blogs
      where blogs.id = blog_tags.blog_id and blogs.author_id = auth.uid()
    )
  );

-- Authors can delete tags from their own blogs
create policy "Authors can delete own blog tags" on blog_tags
  for delete using (
    exists (
      select 1 from blogs
      where blogs.id = blog_tags.blog_id and blogs.author_id = auth.uid()
    )
  );

-- =====================
-- BLOG_COMMENTS RLS POLICIES
-- =====================

-- Anyone can view comments on published blogs
create policy "Anyone can view comments on published blogs" on blog_comments
  for select using (
    exists (
      select 1 from blogs
      where blogs.id = blog_comments.blog_id and blogs.status = 'published'
    )
  );

-- Authenticated users can add comments to published blogs
create policy "Authenticated users can comment on published blogs" on blog_comments
  for insert with check (
    auth.role() = 'authenticated' and
    auth.uid() = user_id and
    exists (
      select 1 from blogs
      where blogs.id = blog_comments.blog_id and blogs.status = 'published'
    )
  );

-- Users can update their own comments
create policy "Users can update own comments" on blog_comments
  for update using (
    auth.uid() = user_id
  );

-- Users can delete their own comments
create policy "Users can delete own comments" on blog_comments
  for delete using (
    auth.uid() = user_id
  );

-- Admins can delete any comment
create policy "Admins can delete any comment" on blog_comments
  for delete using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================
-- BLOG_LIKES RLS POLICIES
-- =====================

-- Anyone can view likes on published blogs
create policy "Anyone can view likes on published blogs" on blog_likes
  for select using (
    exists (
      select 1 from blogs
      where blogs.id = blog_likes.blog_id and blogs.status = 'published'
    )
  );

-- Authenticated users can like published blogs
create policy "Authenticated users can like published blogs" on blog_likes
  for insert with check (
    auth.role() = 'authenticated' and
    auth.uid() = user_id and
    exists (
      select 1 from blogs
      where blogs.id = blog_likes.blog_id and blogs.status = 'published'
    )
  );

-- Users can unlike (delete their own likes)
create policy "Users can unlike blogs" on blog_likes
  for delete using (
    auth.uid() = user_id
  );

-- =====================
-- INDEXES
-- =====================

create index blogs_author_id_idx on blogs(author_id);
create index blogs_cluster_id_idx on blogs(cluster_id);
create index blogs_category_idx on blogs(category);
create index blogs_status_idx on blogs(status);
create index blogs_published_at_idx on blogs(published_at desc);
create index blogs_slug_idx on blogs(slug);
create index blogs_is_featured_idx on blogs(is_featured) where is_featured = true;

create index blog_tags_blog_id_idx on blog_tags(blog_id);
create index blog_tags_tag_idx on blog_tags(tag);

create index blog_comments_blog_id_idx on blog_comments(blog_id);
create index blog_comments_user_id_idx on blog_comments(user_id);
create index blog_comments_parent_id_idx on blog_comments(parent_id);

create index blog_likes_blog_id_idx on blog_likes(blog_id);
create index blog_likes_user_id_idx on blog_likes(user_id);

-- =====================
-- TRIGGERS
-- =====================

create trigger update_blogs_updated_at
  before update on blogs
  for each row execute procedure update_updated_at_column();

create trigger update_blog_comments_updated_at
  before update on blog_comments
  for each row execute procedure update_updated_at_column();

-- =====================
-- VIEWS
-- =====================

-- Create view for detailed blogs with author, cluster info, and counts
create or replace view detailed_blogs as
select
  b.id,
  b.title,
  b.slug,
  b.excerpt,
  b.content,
  b.featured_image_url,
  b.category,
  b.status,
  b.is_featured,
  b.view_count,
  b.read_time_minutes,
  b.published_at,
  b.created_at,
  b.updated_at,
  b.rejected_reason,
  b.author_id,
  author.full_name as author_name,
  author.avatar_url as author_avatar,
  author.role as author_role,
  b.cluster_id,
  c.name as cluster_name,
  b.approved_by,
  b.approved_at,
  approver.full_name as approved_by_name,
  (
    select count(*)
    from blog_comments bc
    where bc.blog_id = b.id
  ) as comments_count,
  (
    select count(*)
    from blog_likes bl
    where bl.blog_id = b.id
  ) as likes_count,
  (
    select array_agg(bt.tag)
    from blog_tags bt
    where bt.blog_id = b.id
  ) as tags
from blogs b
left join profiles author on b.author_id = author.id
left join clusters c on b.cluster_id = c.id
left join profiles approver on b.approved_by = approver.id;

-- Create view for blog comments with user info
create or replace view detailed_blog_comments as
select
  bc.id,
  bc.blog_id,
  bc.user_id,
  bc.parent_id,
  bc.content,
  bc.is_edited,
  bc.created_at,
  bc.updated_at,
  u.full_name as user_name,
  u.avatar_url as user_avatar,
  u.role as user_role
from blog_comments bc
join profiles u on bc.user_id = u.id;

-- Grant select permissions on views
grant select on detailed_blogs to authenticated;
grant select on detailed_blogs to anon;
grant select on detailed_blog_comments to authenticated;
grant select on detailed_blog_comments to anon;
