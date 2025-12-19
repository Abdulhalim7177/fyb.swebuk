"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { DetailedBlog, DetailedBlogComment, BlogCategory } from "@/lib/constants/blog";

// ============================================
// IMAGE URL HELPER
// ============================================

async function getBlogImageSignedUrl(filePath: string | null): Promise<string | null> {
  if (!filePath) return null;

  const supabase = await createClient();

  // If it's already a full URL, extract the path
  let path = filePath;
  if (filePath.startsWith('http')) {
    const urlParts = filePath.split('/blog-images/');
    if (urlParts.length > 1) {
      path = urlParts[1];
    } else {
      return filePath; // Return as-is if we can't parse it
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from("blog-images")
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL for blog image:", error);
      return null;
    }

    // Normalize hostname for local development
    const signedUrl = data?.signedUrl?.replace('localhost', '127.0.0.1') || null;
    return signedUrl;
  } catch (error) {
    console.error("Error getting blog image signed URL:", error);
    return null;
  }
}

// Transform a blog to include signed image URL
async function transformBlogWithSignedUrl(blog: DetailedBlog): Promise<DetailedBlog> {
  if (blog.featured_image_url) {
    const signedUrl = await getBlogImageSignedUrl(blog.featured_image_url);
    return { ...blog, featured_image_url: signedUrl };
  }
  return blog;
}

// Transform multiple blogs to include signed image URLs
async function transformBlogsWithSignedUrls(blogs: DetailedBlog[]): Promise<DetailedBlog[]> {
  return Promise.all(blogs.map(transformBlogWithSignedUrl));
}

// ============================================
// PUBLIC BLOG ACTIONS (Read operations)
// ============================================

export interface GetPublishedBlogsOptions {
  category?: BlogCategory;
  clusterId?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export async function getPublishedBlogs(options: GetPublishedBlogsOptions = {}) {
  const supabase = await createClient();
  const { category, clusterId, search, featured, limit = 12, offset = 0 } = options;

  try {
    let query = supabase
      .from("detailed_blogs")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    if (clusterId) {
      query = query.eq("cluster_id", clusterId);
    }

    if (featured !== undefined) {
      query = query.eq("is_featured", featured);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching published blogs:", error);
      return [];
    }

    // Transform blogs to include signed image URLs
    const blogs = (data as DetailedBlog[]) || [];
    return transformBlogsWithSignedUrls(blogs);
  } catch (error) {
    console.error("Unexpected error fetching blogs:", error);
    return [];
  }
}

export async function getFeaturedBlogs(limit = 3) {
  return getPublishedBlogs({ featured: true, limit });
}

export async function getBlogBySlug(slug: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("Error fetching blog by slug:", error.message || error.code || JSON.stringify(error));
      return null;
    }

    // Transform to include signed image URL
    return transformBlogWithSignedUrl(data as DetailedBlog);
  } catch (error: any) {
    console.error("Unexpected error fetching blog:", error?.message || error);
    return null;
  }
}

export async function getBlogById(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching blog by id:", error);
      return null;
    }

    // Transform to include signed image URL
    return transformBlogWithSignedUrl(data as DetailedBlog);
  } catch (error) {
    console.error("Unexpected error fetching blog:", error);
    return null;
  }
}

// ============================================
// COMMENTS ACTIONS
// ============================================

export async function getBlogComments(blogId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blog_comments")
      .select("*")
      .eq("blog_id", blogId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    // Organize comments into tree structure (parent and replies)
    const comments = data as DetailedBlogComment[];
    const topLevelComments: DetailedBlogComment[] = [];
    const repliesMap: Record<string, DetailedBlogComment[]> = {};

    comments.forEach((comment) => {
      if (comment.parent_id) {
        if (!repliesMap[comment.parent_id]) {
          repliesMap[comment.parent_id] = [];
        }
        repliesMap[comment.parent_id].push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });

    // Attach replies to parent comments
    topLevelComments.forEach((comment) => {
      comment.replies = repliesMap[comment.id] || [];
    });

    return topLevelComments;
  } catch (error) {
    console.error("Unexpected error fetching comments:", error);
    return [];
  }
}

export async function postBlogComment(blogId: string, content: string, parentId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase.from("blog_comments").insert({
      blog_id: blogId,
      user_id: user.id,
      content,
      parent_id: parentId || null,
    });

    if (error) throw error;

    revalidatePath("/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error posting comment:", error);
    return { success: false, error: error.message };
  }
}

export async function updateBlogComment(commentId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("blog_comments")
      .update({ content, is_edited: true })
      .eq("id", commentId)
      .eq("user_id", user.id); // Ensure user owns the comment

    if (error) throw error;

    revalidatePath("/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteBlogComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase.from("blog_comments").delete().eq("id", commentId);

    if (error) throw error;

    revalidatePath("/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// LIKES ACTIONS
// ============================================

export async function toggleBlogLike(blogId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated", liked: false };
  }

  try {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from("blog_likes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase.from("blog_likes").delete().eq("id", existingLike.id);

      if (error) throw error;

      revalidatePath("/blog");
      return { success: true, liked: false };
    } else {
      // Like
      const { error } = await supabase.from("blog_likes").insert({
        blog_id: blogId,
        user_id: user.id,
      });

      if (error) throw error;

      revalidatePath("/blog");
      return { success: true, liked: true };
    }
  } catch (error: any) {
    console.error("Error toggling like:", error);
    return { success: false, error: error.message, liked: false };
  }
}

export async function checkBlogLiked(blogId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return false;
  }

  try {
    const { data } = await supabase
      .from("blog_likes")
      .select("id")
      .eq("blog_id", blogId)
      .eq("user_id", user.id)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// ============================================
// VIEW COUNT
// ============================================

export async function incrementViewCount(blogId: string) {
  // Use service role client for view count to bypass RLS (allows anonymous views)
  const supabase = await createServiceClient();

  try {
    // Use RPC or direct update to increment view count
    const { error } = await supabase.rpc("increment_blog_view_count", { blog_id: blogId });

    // If RPC doesn't exist, try direct update
    if (error && error.code === "PGRST202") {
      // Fallback to direct update
      const { data: blog } = await supabase
        .from("blogs")
        .select("view_count")
        .eq("id", blogId)
        .single();

      if (blog) {
        await supabase
          .from("blogs")
          .update({ view_count: (blog.view_count || 0) + 1 })
          .eq("id", blogId);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error incrementing view count:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// BLOG LIKES - WHO LIKED
// ============================================

export interface BlogLikeUser {
  id: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  user_role: string | null;
  created_at: string;
}

export async function getBlogLikes(blogId: string): Promise<BlogLikeUser[]> {
  const supabase = await createClient();

  try {
    // First try to use a view if it exists
    const { data, error } = await supabase
      .from("blog_likes")
      .select(`
        id,
        user_id,
        created_at,
        profiles:user_id (
          full_name,
          avatar_url,
          role
        )
      `)
      .eq("blog_id", blogId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blog likes:", error);
      return [];
    }

    // Transform the data
    return (data || []).map((like: any) => ({
      id: like.id,
      user_id: like.user_id,
      user_name: like.profiles?.full_name || "Anonymous",
      user_avatar: like.profiles?.avatar_url || null,
      user_role: like.profiles?.role || null,
      created_at: like.created_at,
    }));
  } catch (error) {
    console.error("Unexpected error fetching blog likes:", error);
    return [];
  }
}

// ============================================
// CATEGORY & CLUSTER HELPERS
// ============================================

export async function getBlogCategories() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("category")
      .eq("status", "published");

    if (error) throw error;

    // Get unique categories with counts
    const categoryCounts: Record<string, number> = {};
    data?.forEach((blog) => {
      categoryCounts[blog.category] = (categoryCounts[blog.category] || 0) + 1;
    });

    return categoryCounts;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {};
  }
}

export async function getClustersWithBlogs() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("blogs")
      .select(
        `
        cluster_id,
        clusters!cluster_id (
          id,
          name
        )
      `
      )
      .eq("status", "published")
      .not("cluster_id", "is", null);

    if (error) throw error;

    // Get unique clusters
    const clustersMap = new Map();
    data?.forEach((blog: any) => {
      if (blog.clusters) {
        clustersMap.set(blog.clusters.id, blog.clusters);
      }
    });

    return Array.from(clustersMap.values());
  } catch (error) {
    console.error("Error fetching clusters:", error);
    return [];
  }
}

// ============================================
// SEARCH
// ============================================

export async function searchBlogs(query: string, limit = 10) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("id, title, slug, excerpt, author_name, published_at, category")
      .eq("status", "published")
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error searching blogs:", error);
    return [];
  }
}

// ============================================
// GET CURRENT USER
// ============================================

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  return user;
}

// ============================================
// RELATED BLOGS
// ============================================

export async function getRelatedBlogs(blogId: string, category: string, limit = 3) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("status", "published")
      .eq("category", category)
      .neq("id", blogId)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Transform blogs to include signed image URLs
    const blogs = (data as DetailedBlog[]) || [];
    return transformBlogsWithSignedUrls(blogs);
  } catch (error) {
    console.error("Error fetching related blogs:", error);
    return [];
  }
}
