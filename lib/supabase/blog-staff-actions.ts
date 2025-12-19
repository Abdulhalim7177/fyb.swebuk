"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DetailedBlog, BlogStatus } from "@/lib/constants/blog";

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
// HELPER: CHECK USER ROLE
// ============================================

async function checkUserRole(allowedRoles: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { authorized: false, error: "Not authenticated", user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { authorized: false, error: "Unauthorized", user, profile };
  }

  return { authorized: true, error: null, user, profile };
}

// ============================================
// PENDING BLOGS (For Moderation)
// ============================================

export async function getPendingBlogs(clusterId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) return [];

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) return [];

    let query = supabase
      .from("detailed_blogs")
      .select("*")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: true });

    // Staff and admin can see all pending blogs
    // Lead and deputy can only see blogs in their cluster
    if (profile.role === "lead_student" || profile.role === "deputy_student") {
      // Get clusters where user is lead or deputy
      const { data: clusters } = await supabase
        .from("clusters")
        .select("id")
        .or(`lead_id.eq.${user.id},deputy_id.eq.${user.id}`);

      const clusterIds = clusters?.map((c) => c.id) || [];

      if (clusterIds.length === 0) {
        return []; // No clusters to moderate
      }

      query = query.in("cluster_id", clusterIds);
    }

    if (clusterId) {
      query = query.eq("cluster_id", clusterId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching pending blogs:", error);
      return [];
    }

    // Transform blogs to include signed image URLs
    const blogs = (data as DetailedBlog[]) || [];
    return transformBlogsWithSignedUrls(blogs);
  } catch (error) {
    console.error("Unexpected error fetching pending blogs:", error);
    return [];
  }
}

export async function getAllBlogsForModeration(status?: BlogStatus) {
  const auth = await checkUserRole(["staff", "admin"]);
  if (!auth.authorized) return [];

  const supabase = await createClient();

  try {
    let query = supabase
      .from("detailed_blogs")
      .select("*")
      .neq("status", "draft") // Don't show drafts in moderation
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching blogs for moderation:", error);
      return [];
    }

    // Transform blogs to include signed image URLs
    const blogs = (data as DetailedBlog[]) || [];
    return transformBlogsWithSignedUrls(blogs);
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

// ============================================
// APPROVAL ACTIONS
// ============================================

export async function approveBlog(blogId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Get the blog to check cluster
    const { data: blog } = await supabase
      .from("blogs")
      .select("cluster_id, status")
      .eq("id", blogId)
      .single();

    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    if (blog.status !== "pending_approval") {
      return { success: false, error: "Blog is not pending approval" };
    }

    // Check authorization
    const canApprove = await checkCanApprove(user.id, profile.role, blog.cluster_id);
    if (!canApprove) {
      return { success: false, error: "Not authorized to approve this blog" };
    }

    // Approve the blog
    const { error } = await supabase
      .from("blogs")
      .update({
        status: "published",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        rejected_reason: null,
      })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    revalidatePath("/dashboard/staff/blog");
    revalidatePath("/dashboard/admin/blog");
    revalidatePath("/dashboard/lead/blog");
    revalidatePath("/dashboard/deputy/blog");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: any) {
    console.error("Error approving blog:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectBlog(blogId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!reason || reason.trim().length === 0) {
    return { success: false, error: "Rejection reason is required" };
  }

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Get the blog to check cluster
    const { data: blog } = await supabase
      .from("blogs")
      .select("cluster_id, status")
      .eq("id", blogId)
      .single();

    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    if (blog.status !== "pending_approval") {
      return { success: false, error: "Blog is not pending approval" };
    }

    // Check authorization
    const canApprove = await checkCanApprove(user.id, profile.role, blog.cluster_id);
    if (!canApprove) {
      return { success: false, error: "Not authorized to reject this blog" };
    }

    // Reject the blog
    const { error } = await supabase
      .from("blogs")
      .update({
        status: "rejected",
        rejected_reason: reason.trim(),
        approved_by: null,
        approved_at: null,
      })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    revalidatePath("/dashboard/staff/blog");
    revalidatePath("/dashboard/admin/blog");
    revalidatePath("/dashboard/lead/blog");
    revalidatePath("/dashboard/deputy/blog");

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting blog:", error);
    return { success: false, error: error.message };
  }
}

// Helper to check if user can approve a blog
async function checkCanApprove(
  userId: string,
  userRole: string,
  clusterId: string | null
): Promise<boolean> {
  // Staff and admin can approve any blog
  if (userRole === "staff" || userRole === "admin") {
    return true;
  }

  // Lead and deputy can only approve blogs in their cluster
  if (userRole === "lead_student" || userRole === "deputy_student") {
    if (!clusterId) {
      return false; // Cannot approve non-cluster blogs
    }

    const supabase = await createClient();
    const { data: cluster } = await supabase
      .from("clusters")
      .select("lead_id, deputy_id")
      .eq("id", clusterId)
      .single();

    if (!cluster) return false;

    return cluster.lead_id === userId || cluster.deputy_id === userId;
  }

  return false;
}

// ============================================
// STATISTICS FOR STAFF
// ============================================

export async function getBlogModerationStats() {
  const auth = await checkUserRole(["staff", "admin", "lead_student", "deputy_student"]);
  if (!auth.authorized) return null;

  const supabase = await createClient();

  try {
    let query = supabase.from("blogs").select("status");

    // Lead/Deputy only see stats for their clusters
    if (auth.profile?.role === "lead_student" || auth.profile?.role === "deputy_student") {
      const { data: clusters } = await supabase
        .from("clusters")
        .select("id")
        .or(`lead_id.eq.${auth.user!.id},deputy_id.eq.${auth.user!.id}`);

      const clusterIds = clusters?.map((c) => c.id) || [];
      if (clusterIds.length > 0) {
        query = query.in("cluster_id", clusterIds);
      } else {
        return { pending: 0, published: 0, rejected: 0, total: 0 };
      }
    }

    const { data: blogs } = await query;

    if (!blogs) return null;

    return {
      pending: blogs.filter((b) => b.status === "pending_approval").length,
      published: blogs.filter((b) => b.status === "published").length,
      rejected: blogs.filter((b) => b.status === "rejected").length,
      total: blogs.length,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

// ============================================
// UNPUBLISH (Staff/Admin only)
// ============================================

export async function unpublishBlog(blogId: string, reason?: string) {
  const auth = await checkUserRole(["staff", "admin"]);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("blogs")
      .update({
        status: "draft",
        published_at: null,
        rejected_reason: reason || "Unpublished by moderator",
      })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: any) {
    console.error("Error unpublishing blog:", error);
    return { success: false, error: error.message };
  }
}
