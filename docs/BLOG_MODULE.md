# Blog and Content Management System

## Overview

The Blog module provides a complete content management system for the Swebuk platform, enabling all users to create, publish, and engage with blog content. The system includes an approval workflow for student posts, rich text editing, image uploads, commenting, and cluster-based content organization.

## Features

### Core Features
- **Rich Text Editor**: Tiptap WYSIWYG editor with formatting toolbar
- **Image Uploads**: Featured image support via Supabase Storage
- **Categories**: 13 content categories for organization
- **Cluster Tagging**: Associate posts with specific clusters
- **Comments**: Nested comment system with replies
- **Likes**: Post engagement tracking
- **View Counts**: Automatic view tracking

### Approval Workflow
- **Students**: Posts require approval from Leads, Staff, or Admins
- **Staff/Admins**: Posts are auto-published (bypass approval)
- **Cluster-Based Approval**: Leads/Deputies can approve posts tagged to their clusters

### Content Statuses
| Status | Description |
|--------|-------------|
| `draft` | Unpublished work in progress |
| `pending_approval` | Submitted for review |
| `published` | Live and visible to all users |
| `rejected` | Declined with feedback |
| `archived` | Hidden from public view |

## Database Schema

### Tables

#### `blogs`
Main blog posts table with the following key fields:
- `id` (UUID) - Primary key
- `author_id` (UUID) - References profiles
- `title` (TEXT) - Post title
- `slug` (TEXT) - URL-friendly identifier
- `excerpt` (TEXT) - Short summary
- `content` (TEXT) - HTML content from editor
- `featured_image_url` (TEXT) - Optional cover image
- `category` (TEXT) - Content category
- `status` (TEXT) - Publication status
- `is_featured` (BOOLEAN) - Featured post flag
- `cluster_id` (UUID) - Optional cluster association
- `view_count` (INTEGER) - View tracking
- `read_time_minutes` (INTEGER) - Estimated read time
- `approved_by` (UUID) - Approver reference
- `approved_at` (TIMESTAMPTZ) - Approval timestamp
- `published_at` (TIMESTAMPTZ) - Publication timestamp
- `rejected_reason` (TEXT) - Rejection feedback

#### `blog_tags`
Custom tags for posts:
- `id` (UUID) - Primary key
- `blog_id` (UUID) - References blogs
- `tag` (TEXT) - Tag name

#### `blog_comments`
Nested comment system:
- `id` (UUID) - Primary key
- `blog_id` (UUID) - References blogs
- `user_id` (UUID) - Comment author
- `parent_id` (UUID) - For nested replies
- `content` (TEXT) - Comment text

#### `blog_likes`
User engagement tracking:
- `id` (UUID) - Primary key
- `blog_id` (UUID) - References blogs
- `user_id` (UUID) - User who liked

### Views

#### `detailed_blogs`
Joins blog data with author info, cluster name, and engagement counts:
- All blog fields
- `author_name`, `author_avatar_url`
- `cluster_name`
- `like_count`, `comment_count`
- `tags` (aggregated array)

#### `detailed_blog_comments`
Joins comments with author information:
- All comment fields
- `author_name`, `author_avatar_url`, `author_role`

## File Structure

```
/lib
  /constants
    blog.ts              # Categories, statuses, types, helpers
  /supabase
    blog-actions.ts      # Core read operations
    blog-student-actions.ts  # Student CRUD operations
    blog-staff-actions.ts    # Staff moderation actions
    blog-admin-actions.ts    # Admin management actions

/components/blog
  blog-card.tsx          # Post card component
  blog-grid.tsx          # Grid display with loading states
  blog-editor.tsx        # Tiptap rich text editor
  blog-form.tsx          # Create/edit form
  blog-filters.tsx       # Search and filter controls
  blog-comments.tsx      # Comment section component
  blog-detail.tsx        # Full post view
  blog-sidebar.tsx       # Author info and related posts
  blog-moderation.tsx    # Shared moderation component
  category-badge.tsx     # Category display badge
  status-badge.tsx       # Status indicator

/app
  /blog
    page.tsx             # Public blog listing
    [slug]/page.tsx      # Individual post view
  /dashboard
    /blog
      page.tsx           # User's blog management
      create/page.tsx    # Full-page editor
      [id]/edit/page.tsx # Edit existing post
    /staff/blog/page.tsx     # Staff moderation
    /admin/blog/page.tsx     # Admin management
    /lead/blog/page.tsx      # Lead approvals
    /deputy/blog/page.tsx    # Deputy approvals

/supabase/migrations
  20251212000000_create_blog_tables.sql
  20251212000001_create_blog_storage.sql
```

## Server Actions

### Core Actions (`blog-actions.ts`)

```typescript
// Fetch published blogs with filters
getPublishedBlogs(options?: {
  category?: string;
  clusterId?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}): Promise<DetailedBlog[]>

// Get single blog by slug
getBlogBySlug(slug: string): Promise<DetailedBlog | null>

// Get comments for a blog
getBlogComments(blogId: string): Promise<DetailedBlogComment[]>

// Post a comment
postBlogComment(blogId: string, content: string, parentId?: string): Promise<BlogComment>

// Toggle like status
toggleBlogLike(blogId: string): Promise<{ liked: boolean }>

// Track views
incrementViewCount(blogId: string): Promise<void>

// Search blogs
searchBlogs(query: string): Promise<DetailedBlog[]>

// Get related posts
getRelatedBlogs(blogId: string, category: string, limit?: number): Promise<DetailedBlog[]>
```

### Student Actions (`blog-student-actions.ts`)

```typescript
// Get user's own blogs
getMyBlogs(status?: string): Promise<DetailedBlog[]>

// Create new blog (auto-publishes for staff/admin)
createBlog(formData: BlogFormData): Promise<Blog>

// Update existing blog
updateBlog(blogId: string, formData: BlogFormData): Promise<Blog>

// Delete draft blog
deleteBlog(blogId: string): Promise<void>

// Submit for approval
submitForApproval(blogId: string): Promise<Blog>

// Save as draft
saveAsDraft(blogId: string): Promise<Blog>

// Image management
uploadBlogImage(file: File): Promise<string>
deleteBlogImage(url: string): Promise<void>
```

### Staff Actions (`blog-staff-actions.ts`)

```typescript
// Get pending blogs for moderation
getPendingBlogs(clusterId?: string): Promise<DetailedBlog[]>

// Get all blogs for moderation view
getAllBlogsForModeration(): Promise<DetailedBlog[]>

// Approve a blog post
approveBlog(blogId: string): Promise<Blog>

// Reject with reason (required)
rejectBlog(blogId: string, reason: string): Promise<Blog>
```

### Admin Actions (`blog-admin-actions.ts`)

```typescript
// Toggle featured status
toggleFeatured(blogId: string): Promise<Blog>

// Archive/unarchive
archiveBlog(blogId: string): Promise<Blog>
unarchiveBlog(blogId: string): Promise<Blog>

// Get analytics
getBlogAnalytics(): Promise<BlogAnalytics>

// Bulk operations
bulkApproveBlog(blogIds: string[]): Promise<void>
bulkArchiveBlogs(blogIds: string[]): Promise<void>
bulkDeleteBlogs(blogIds: string[]): Promise<void>
```

## Categories

| Value | Label |
|-------|-------|
| `frontend` | Frontend |
| `backend` | Backend |
| `ai_ml` | AI/ML |
| `devops` | DevOps |
| `mobile` | Mobile |
| `security` | Security |
| `career` | Career |
| `tutorials` | Tutorials |
| `research` | Research |
| `projects` | Projects |
| `events` | Events |
| `announcements` | Announcements |
| `tips` | Tips |

## Components

### BlogCard
Display component for blog posts in grid layouts.

**Props:**
- `blog: DetailedBlog` - Blog data
- `variant?: 'default' | 'compact' | 'featured'` - Display style

### BlogEditor
Tiptap-based rich text editor with toolbar.

**Props:**
- `content?: string` - Initial HTML content
- `onChange: (html: string) => void` - Content change handler
- `placeholder?: string` - Editor placeholder

**Features:**
- Bold, Italic, Strikethrough
- Headings (H1, H2, H3)
- Lists (Bullet, Ordered)
- Links
- Code blocks
- Blockquotes
- Image insertion

### BlogForm
Complete create/edit form with all fields.

**Props:**
- `blog?: DetailedBlog` - Existing blog for editing
- `onSuccess?: () => void` - Success callback
- `clusters: Cluster[]` - Available clusters for tagging

### BlogModeration
Shared component for approval workflow.

**Props:**
- `blogs: DetailedBlog[]` - Blogs to moderate
- `title: string` - Page title
- `description: string` - Page description
- `onRefresh: () => void` - Refresh callback

## Routes

### Public Routes

| Route | Description |
|-------|-------------|
| `/blog` | Public blog listing with filters |
| `/blog/[slug]` | Individual blog post view |

### Dashboard Routes

| Route | Role | Description |
|-------|------|-------------|
| `/dashboard/blog` | All | User's blog management |
| `/dashboard/blog/create` | All | Create new post |
| `/dashboard/blog/[id]/edit` | All | Edit own post |
| `/dashboard/staff/blog` | Staff | Blog moderation |
| `/dashboard/admin/blog` | Admin | Blog management |
| `/dashboard/lead/blog` | Lead | Cluster blog approvals |
| `/dashboard/deputy/blog` | Deputy | Cluster blog approvals |

## RLS Policies

### Read Policies
- Anyone can read published blogs
- Authors can read their own blogs (any status)
- Staff/Admin can read all blogs
- Cluster leads/deputies can read blogs tagged to their clusters

### Write Policies
- Authenticated users can create blogs
- Authors can update their own drafts/rejected posts
- Staff/Admin can update any blog

### Delete Policies
- Authors can delete their own drafts
- Admins can delete any blog

## Storage

### Bucket: `blog-images`
- **Access**: Public read, authenticated write
- **Path Structure**: `{user_id}/{timestamp}_{filename}`
- **Allowed Types**: Images (jpg, png, gif, webp)
- **Max Size**: 5MB

## Usage Examples

### Creating a Blog Post

```typescript
import { createBlog } from '@/lib/supabase/blog-student-actions';

const formData = {
  title: 'My First Blog Post',
  excerpt: 'A brief introduction to my post',
  content: '<p>Full content here...</p>',
  category: 'tutorials',
  clusterId: 'optional-cluster-id',
  featuredImageUrl: 'https://...',
  tags: ['react', 'nextjs'],
};

const blog = await createBlog(formData);
```

### Fetching Published Blogs

```typescript
import { getPublishedBlogs } from '@/lib/supabase/blog-actions';

// All published blogs
const blogs = await getPublishedBlogs();

// With filters
const filteredBlogs = await getPublishedBlogs({
  category: 'frontend',
  clusterId: 'cluster-id',
  searchQuery: 'react',
  limit: 10,
  offset: 0,
});
```

### Approving a Blog

```typescript
import { approveBlog } from '@/lib/supabase/blog-staff-actions';

await approveBlog(blogId);
```

### Rejecting a Blog

```typescript
import { rejectBlog } from '@/lib/supabase/blog-staff-actions';

await rejectBlog(blogId, 'Please add more detail to the introduction');
```

## Integration Points

### Navigation
Blog links are added to `dashboard-nav.tsx` for all roles:
- Students: "My Blog Posts", "Community Blog"
- Staff: "Blog Moderation"
- Admin: "Blog Management"
- Lead/Deputy: "Blog Approvals"

### Landing Page
Public blog link added to `navigation.tsx`

### Notifications (Future)
Integration points for:
- New comment notifications
- Approval/rejection notifications
- Featured post notifications

## Testing

### Sample Data
The seed route (`/api/seed`) includes:
- 12 sample blog posts across all statuses
- 8 comments on various posts
- Likes distributed across posts
- Various categories and cluster associations

### Test Accounts
- `staff1@swebuk.com` - Staff user (auto-publish)
- `admin@swebuk.com` - Admin user
- `student@swebuk.com` - Student user (requires approval)
