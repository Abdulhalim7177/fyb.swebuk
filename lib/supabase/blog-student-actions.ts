"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { DetailedBlog, BlogCategory, BlogStatus } from "@/lib/constants/blog";
import { generateSlug, calculateReadTime } from "@/lib/constants/blog";

// ============================================
// IMAGE URL HELPER (for fetching blogs)
// ============================================

async function getSignedImageUrl(filePath: string | null): Promise<string | null> {
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
    const signedUrl = await getSignedImageUrl(blog.featured_image_url);
    return { ...blog, featured_image_url: signedUrl };
  }
  return blog;
}

// Transform multiple blogs to include signed image URLs
async function transformBlogsWithSignedUrls(blogs: DetailedBlog[]): Promise<DetailedBlog[]> {
  return Promise.all(blogs.map(transformBlogWithSignedUrl));
}

// ============================================
// USER'S OWN BLOG ACTIONS
// ============================================

export async function getMyBlogs(status?: BlogStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) return [];

  try {
    let query = supabase
      .from("detailed_blogs")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching user blogs:", error);
      return [];
    }

    // Transform blogs to include signed image URLs
    const blogs = (data as DetailedBlog[]) || [];
    return transformBlogsWithSignedUrls(blogs);
  } catch (error) {
    console.error("Unexpected error fetching user blogs:", error);
    return [];
  }
}

export async function getMyBlogById(blogId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from("detailed_blogs")
      .select("*")
      .eq("id", blogId)
      .eq("author_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching blog:", error);
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
// CREATE BLOG
// ============================================

export interface CreateBlogData {
  title: string;
  content: string;
  excerpt?: string;
  category: BlogCategory;
  clusterId?: string;
  tags?: string[];
  featuredImageUrl?: string;
  saveAsDraft?: boolean;
}

export async function createBlog(data: CreateBlogData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "User profile not found" };
    }

    // Determine initial status based on role and draft preference
    let status: BlogStatus;
    if (data.saveAsDraft) {
      status = "draft";
    } else if (profile.role === "staff" || profile.role === "admin") {
      // Staff and admin posts are auto-published
      status = "published";
    } else {
      // Students need approval
      status = "pending_approval";
    }

    // Generate unique slug
    let slug = generateSlug(data.title);
    const timestamp = Date.now();

    // Check if slug exists and make it unique
    const { data: existingBlog } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingBlog) {
      slug = `${slug}-${timestamp}`;
    }

    // Calculate read time from content
    const readTime = calculateReadTime(data.content);

    // Create blog post
    const blogData: any = {
      author_id: user.id,
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 200).replace(/<[^>]*>/g, ""),
      category: data.category,
      status,
      read_time_minutes: readTime,
      cluster_id: data.clusterId || null,
      featured_image_url: data.featuredImageUrl || null,
    };

    // Set published_at if auto-published
    if (status === "published") {
      blogData.published_at = new Date().toISOString();
    }

    const { data: newBlog, error: blogError } = await supabase
      .from("blogs")
      .insert(blogData)
      .select()
      .single();

    if (blogError) throw blogError;

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      const tagRecords = data.tags.map((tag) => ({
        blog_id: newBlog.id,
        tag: tag.toLowerCase().trim(),
      }));

      const { error: tagsError } = await supabase.from("blog_tags").insert(tagRecords);

      if (tagsError) {
        console.error("Error adding tags:", tagsError);
        // Don't fail the whole operation for tags
      }
    }

    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");

    return { success: true, data: newBlog };
  } catch (error: any) {
    console.error("Error creating blog:", error);
    return { success: false, error: error.message || "Failed to create blog" };
  }
}

// ============================================
// UPDATE BLOG
// ============================================

export interface UpdateBlogData {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: BlogCategory;
  clusterId?: string | null;
  tags?: string[];
  featuredImageUrl?: string | null;
}

export async function updateBlog(blogId: string, data: UpdateBlogData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify ownership and status
    const { data: existingBlog } = await supabase
      .from("blogs")
      .select("author_id, status, slug")
      .eq("id", blogId)
      .single();

    if (!existingBlog) {
      return { success: false, error: "Blog not found" };
    }

    if (existingBlog.author_id !== user.id) {
      return { success: false, error: "Not authorized to edit this blog" };
    }

    if (!["draft", "rejected", "pending_approval"].includes(existingBlog.status)) {
      return { success: false, error: "Cannot edit a published blog" };
    }

    const updateData: any = {};

    if (data.title) {
      updateData.title = data.title;
      // Update slug if title changes
      const newSlug = generateSlug(data.title);
      if (newSlug !== existingBlog.slug.split("-").slice(0, -1).join("-")) {
        const { data: slugExists } = await supabase
          .from("blogs")
          .select("id")
          .eq("slug", newSlug)
          .neq("id", blogId)
          .single();

        updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
      }
    }

    if (data.content) {
      updateData.content = data.content;
      updateData.read_time_minutes = calculateReadTime(data.content);
    }

    if (data.excerpt !== undefined) {
      updateData.excerpt = data.excerpt;
    }

    if (data.category) {
      updateData.category = data.category;
    }

    if (data.clusterId !== undefined) {
      updateData.cluster_id = data.clusterId;
    }

    if (data.featuredImageUrl !== undefined) {
      updateData.featured_image_url = data.featuredImageUrl;
    }

    // Update blog
    const { error: updateError } = await supabase
      .from("blogs")
      .update(updateData)
      .eq("id", blogId);

    if (updateError) throw updateError;

    // Update tags if provided
    if (data.tags !== undefined) {
      // Delete existing tags
      await supabase.from("blog_tags").delete().eq("blog_id", blogId);

      // Add new tags
      if (data.tags.length > 0) {
        const tagRecords = data.tags.map((tag) => ({
          blog_id: blogId,
          tag: tag.toLowerCase().trim(),
        }));

        await supabase.from("blog_tags").insert(tagRecords);
      }
    }

    revalidatePath("/dashboard/blog");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating blog:", error);
    return { success: false, error: error.message || "Failed to update blog" };
  }
}

// ============================================
// DELETE BLOG
// ============================================

export async function deleteBlog(blogId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify ownership and draft status
    const { data: blog } = await supabase
      .from("blogs")
      .select("author_id, status, featured_image_url")
      .eq("id", blogId)
      .single();

    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    if (blog.author_id !== user.id) {
      return { success: false, error: "Not authorized to delete this blog" };
    }

    // Can only delete blogs that haven't been approved/published
    if (blog.status === "published") {
      return { success: false, error: "Cannot delete published blogs" };
    }

    // Delete featured image from storage if exists
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
        // Continue with blog deletion even if image deletion fails
      }
    }

    // Delete blog (cascade will delete tags, comments, likes)
    const { error } = await supabase.from("blogs").delete().eq("id", blogId);

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return { success: false, error: error.message || "Failed to delete blog" };
  }
}

// ============================================
// SUBMIT FOR APPROVAL
// ============================================

export async function submitForApproval(blogId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify ownership and draft status
    const { data: blog } = await supabase
      .from("blogs")
      .select("author_id, status")
      .eq("id", blogId)
      .single();

    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    if (blog.author_id !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    if (blog.status !== "draft" && blog.status !== "rejected") {
      return { success: false, error: "Blog is not in draft or rejected status" };
    }

    // Update status to pending approval
    const { error } = await supabase
      .from("blogs")
      .update({
        status: "pending_approval",
        rejected_reason: null, // Clear previous rejection reason
      })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error submitting for approval:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// SAVE AS DRAFT
// ============================================

export async function saveAsDraft(blogId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { data: blog } = await supabase
      .from("blogs")
      .select("author_id, status")
      .eq("id", blogId)
      .single();

    if (!blog) {
      return { success: false, error: "Blog not found" };
    }

    if (blog.author_id !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    // Can only revert to draft if pending or rejected
    if (blog.status !== "pending_approval" && blog.status !== "rejected") {
      return { success: false, error: "Cannot save as draft" };
    }

    const { error } = await supabase
      .from("blogs")
      .update({ status: "draft" })
      .eq("id", blogId);

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving as draft:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// IMAGE UPLOAD
// ============================================

export async function uploadBlogImage(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/blog_${timestamp}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Return the file path (not the full URL) - we'll generate signed URLs when displaying
    return { success: true, url: filePath };
  } catch (error: any) {
    console.error("Error uploading image:", error);
    return { success: false, error: error.message };
  }
}

// Get signed URL for a blog image
export async function getBlogImageSignedUrl(filePath: string): Promise<string | null> {
  if (!filePath) return null;

  // If it's already a full URL (legacy data), extract the path
  if (filePath.startsWith('http')) {
    const urlParts = filePath.split('/blog-images/');
    if (urlParts.length > 1) {
      filePath = urlParts[1];
    } else {
      return filePath; // Return as-is if we can't parse it
    }
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.storage
      .from("blog-images")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL for blog image:", error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error("Error getting blog image signed URL:", error);
    return null;
  }
}

export async function deleteBlogImage(imageUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const urlParts = imageUrl.split("/");
    const bucketIndex = urlParts.findIndex((part) => part === "blog-images");

    if (bucketIndex === -1) {
      return { success: false, error: "Invalid image URL" };
    }

    const filePath = urlParts.slice(bucketIndex + 1).join("/");

    // Verify the user owns this file (path should start with user.id)
    if (!filePath.startsWith(user.id)) {
      return { success: false, error: "Not authorized to delete this image" };
    }

    const { error } = await supabase.storage.from("blog-images").remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting image:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// BLOG TAGS
// ============================================

export async function getBlogTags(blogId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("blog_tags")
      .select("tag")
      .eq("blog_id", blogId);

    if (error) throw error;

    return data?.map((t) => t.tag) || [];
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export async function addBlogTag(blogId: string, tag: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Verify ownership
    const { data: blog } = await supabase
      .from("blogs")
      .select("author_id")
      .eq("id", blogId)
      .single();

    if (!blog || blog.author_id !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    const { error } = await supabase.from("blog_tags").insert({
      blog_id: blogId,
      tag: tag.toLowerCase().trim(),
    });

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding tag:", error);
    return { success: false, error: error.message };
  }
}

export async function removeBlogTag(blogId: string, tag: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const { error } = await supabase
      .from("blog_tags")
      .delete()
      .eq("blog_id", blogId)
      .eq("tag", tag.toLowerCase().trim());

    if (error) throw error;

    revalidatePath("/dashboard/blog");
    return { success: true };
  } catch (error: any) {
    console.error("Error removing tag:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// STATISTICS
// ============================================

export async function getMyBlogStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) return null;

  try {
    const { data: blogs } = await supabase
      .from("blogs")
      .select("status, view_count")
      .eq("author_id", user.id);

    if (!blogs) return null;

    const stats = {
      total: blogs.length,
      draft: blogs.filter((b) => b.status === "draft").length,
      pending: blogs.filter((b) => b.status === "pending_approval").length,
      published: blogs.filter((b) => b.status === "published").length,
      rejected: blogs.filter((b) => b.status === "rejected").length,
      totalViews: blogs.reduce((sum, b) => sum + (b.view_count || 0), 0),
    };

    return stats;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}
