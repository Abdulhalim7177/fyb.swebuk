export const BLOG_CATEGORIES = [
  { value: "frontend", label: "Frontend", color: "blue" },
  { value: "backend", label: "Backend", color: "green" },
  { value: "ai_ml", label: "AI/ML", color: "purple" },
  { value: "devops", label: "DevOps", color: "orange" },
  { value: "mobile", label: "Mobile", color: "pink" },
  { value: "security", label: "Security", color: "red" },
  { value: "career", label: "Career", color: "teal" },
  { value: "tutorials", label: "Tutorials", color: "indigo" },
  { value: "research", label: "Research", color: "cyan" },
  { value: "projects", label: "Projects", color: "amber" },
  { value: "events", label: "Events", color: "emerald" },
  { value: "announcements", label: "Announcements", color: "rose" },
  { value: "tips", label: "Tips", color: "violet" },
] as const;

export const BLOG_STATUSES = [
  { value: "draft", label: "Draft", color: "gray" },
  { value: "pending_approval", label: "Pending Approval", color: "yellow" },
  { value: "published", label: "Published", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
  { value: "archived", label: "Archived", color: "gray" },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]["value"];
export type BlogStatus = (typeof BLOG_STATUSES)[number]["value"];

export interface Blog {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  category: BlogCategory;
  status: BlogStatus;
  is_featured: boolean;
  cluster_id: string | null;
  view_count: number;
  read_time_minutes: number | null;
  approved_by: string | null;
  approved_at: string | null;
  published_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DetailedBlog extends Blog {
  author_name: string | null;
  author_avatar: string | null;
  author_role: string | null;
  cluster_name: string | null;
  approved_by_name: string | null;
  comments_count: number;
  likes_count: number;
  tags: string[] | null;
}

export interface BlogComment {
  id: string;
  blog_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface DetailedBlogComment extends BlogComment {
  user_name: string | null;
  user_avatar: string | null;
  user_role: string | null;
  replies?: DetailedBlogComment[];
}

export interface BlogTag {
  id: string;
  blog_id: string;
  tag: string;
  created_at: string;
}

export interface BlogLike {
  id: string;
  blog_id: string;
  user_id: string;
  created_at: string;
}

// Helper function to get category color class
export function getCategoryColorClass(category: BlogCategory): string {
  const colorMap: Record<BlogCategory, string> = {
    frontend: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    backend: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    ai_ml: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    devops: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    mobile: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    security: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    career: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    tutorials: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    research: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    projects: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    events: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    announcements: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
    tips: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
  };
  return colorMap[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
}

// Helper function to get status color class
export function getStatusColorClass(status: BlogStatus): string {
  const colorMap: Record<BlogStatus, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
}

// Helper function to get category label
export function getCategoryLabel(category: BlogCategory): string {
  const found = BLOG_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
}

// Helper function to get status label
export function getStatusLabel(status: BlogStatus): string {
  const found = BLOG_STATUSES.find((s) => s.value === status);
  return found?.label || status;
}

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 100);
}

// Helper function to calculate read time (approx 200 words per minute)
export function calculateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
