"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DetailedBlog } from "@/lib/constants/blog";

// ============================================
// HELPER: CHECK ADMIN ROLE
// ============================================

async function checkAdminRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { authorized: false, error: "Not authenticated", user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { authorized: false, error: "Admin access required", user };
  }

  return { authorized: true, error: null, user };
}

// ============================================
// FEATURED BLOGS MANAGEMENT
// ============================================

export async function toggleFeatured(blogId: string) {
  const auth = await checkAdminRole();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    // Get current featured status
    const { data: blog } = await supabase
      .from("blogs")
      .select("is_featured")
      .eq("id", blogId)
      .single();

    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    const { error } = await supabase
      .from("blogs")
      .update({ is_featured: !blog.is_featured })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");

    return { success: true, featured: !blog.is_featured };
  } catch (error: any) {
    console.error("Error toggling featured:", error);
    return { success: false, error: error.message };
  }
}

export async function getFeaturedBlogsAdmin() {
  const auth = await checkAdminRole();
  if (!auth.authorized) return [];

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("is_featured", true)
      .order("published_at", { ascending: false });

    if (error) throw error;

    return (data as DetailedBlog[]) || [];
  } catch (error) {
    console.error("Error fetching featured blogs:", error);
    return [];
  }
}

// ============================================
// ARCHIVE MANAGEMENT
// ============================================

export async function archiveBlog(blogId: string) {
  const auth = await checkAdminRole();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("blogs")
      .update({ status: "archived" })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");

    return { success: true };
  } catch (error: any) {
    console.error("Error archiving blog:", error);
    return { success: false, error: error.message };
  }
}

export async function unarchiveBlog(blogId: string) {
  const auth = await checkAdminRole();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    // Restore to published state
    const { error } = await supabase
      .from("blogs")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");

    return { success: true };
  } catch (error: any) {
    console.error("Error unarchiving blog:", error);
    return { success: false, error: error.message };
  }
}

export async function getArchivedBlogs() {
  const auth = await checkAdminRole();
  if (!auth.authorized) return [];

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("status", "archived")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return (data as DetailedBlog[]) || [];
  } catch (error) {
    console.error("Error fetching archived blogs:", error);
    return [];
  }
}

// ============================================
// DELETE BLOG (Admin only)
// ============================================

export async function adminDeleteBlog(blogId: string) {
  const auth = await checkAdminRole();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    // Get blog details for image cleanup
    const { data: blog } = await supabase
      .from("blogs")
      .select("featured_image_url")
      .eq("id", blogId)
      .single();

    // Delete featured image from storage if exists
    if (blog?.featured_image_url) {
      try {
        const urlParts = blog.featured_image_url.split("/");
        const bucketIndex = urlParts.findIndex((part) => part === "blog-images");
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join("/");
          await supabase.storage.from("blog-images").remove([filePath]);
        }
      } catch (e) {
        console.error("Error deleting image:", e);
      }
    }

    // Delete blog (cascade will delete tags, comments, likes)
    const { error } = await supabase.from("blogs").delete().eq("id", blogId);

    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ANALYTICS
// ============================================

export async function getBlogAnalytics() {
  const auth = await checkAdminRole();
  if (!auth.authorized) return null;

  const supabase = await createClient();

  try {
    // Get all blogs with stats
    const { data: blogs } = await supabase.from("detailed_blogs").select("*");

    if (!blogs) return null;

    // Calculate analytics
    const publishedBlogs = blogs.filter((b) => b.status === "published");
    const totalViews = publishedBlogs.reduce((sum, b) => sum + (b.view_count || 0), 0);
    const totalComments = publishedBlogs.reduce((sum, b) => sum + (b.comments_count || 0), 0);
    const totalLikes = publishedBlogs.reduce((sum, b) => sum + (b.likes_count || 0), 0);

    // Category breakdown
    const categoryStats: Record<string, number> = {};
    publishedBlogs.forEach((blog) => {
      categoryStats[blog.category] = (categoryStats[blog.category] || 0) + 1;
    });

    // Status breakdown
    const statusStats = {
      draft: blogs.filter((b) => b.status === "draft").length,
      pending_approval: blogs.filter((b) => b.status === "pending_approval").length,
      published: publishedBlogs.length,
      rejected: blogs.filter((b) => b.status === "rejected").length,
      archived: blogs.filter((b) => b.status === "archived").length,
    };

    // Top authors
    const authorStats: Record<string, { name: string; count: number; views: number }> = {};
    publishedBlogs.forEach((blog) => {
      if (!authorStats[blog.author_id]) {
        authorStats[blog.author_id] = {
          name: blog.author_name || "Unknown",
          count: 0,
          views: 0,
        };
      }
      authorStats[blog.author_id].count++;
      authorStats[blog.author_id].views += blog.view_count || 0;
    });

    const topAuthors = Object.values(authorStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most viewed blogs
    const mostViewed = [...publishedBlogs]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        views: b.view_count || 0,
        author: b.author_name,
      }));

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBlogs = blogs.filter(
      (b) => new Date(b.created_at) > thirtyDaysAgo
    ).length;

    return {
      totals: {
        blogs: blogs.length,
        published: publishedBlogs.length,
        views: totalViews,
        comments: totalComments,
        likes: totalLikes,
      },
      statusStats,
      categoryStats,
      topAuthors,
      mostViewed,
      recentActivity: {
        newBlogs: recentBlogs,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return null;
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function bulkApproveBlog(blogIds: string[]) {
  const auth = await checkAdminRole();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("blogs")
      .update({
        status: "published",
        approved_by: auth.user!.id,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        rejected_reason: null,
      })
      .in("id", blogIds)
      .eq("status", "pending_approval");

    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");

    return { success: true, count: blogIds.length };
  } catch (error: any) {
    console.error("Error bulk approving:", error);
    return { success: false, error: error.message };
  }
}

export async function bulkArchiveBlogs(blogIds: string[]) {
  const auth = await checkAdminRole();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("blogs")
      .update({ status: "archived" })
      .in("id", blogIds);

    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");

    return { success: true, count: blogIds.length };
  } catch (error: any) {
    console.error("Error bulk archiving:", error);
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteBlogs(blogIds: string[]) {
  const auth = await checkAdminRole();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    // Get all blogs for image cleanup
    const { data: blogs } = await supabase
      .from("blogs")
      .select("featured_image_url")
      .in("id", blogIds);

    // Delete images
    if (blogs) {
      for (const blog of blogs) {
        if (blog.featured_image_url) {
          try {
            const urlParts = blog.featured_image_url.split("/");
            const bucketIndex = urlParts.findIndex((part) => part === "blog-images");
            if (bucketIndex !== -1) {
              const filePath = urlParts.slice(bucketIndex + 1).join("/");
              await supabase.storage.from("blog-images").remove([filePath]);
            }
          } catch (e) {
            console.error("Error deleting image:", e);
          }
        }
      }
    }

    // Delete blogs
    const { error } = await supabase.from("blogs").delete().in("id", blogIds);

    if (error) throw error;

    revalidatePath("/blog");
    revalidatePath("/dashboard/admin/blog");

    return { success: true, count: blogIds.length };
  } catch (error: any) {
    console.error("Error bulk deleting:", error);
    return { success: false, error: error.message };
  }
}
