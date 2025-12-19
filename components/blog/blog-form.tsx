"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlogEditor } from "./blog-editor";
import { createBlog, updateBlog, uploadBlogImage } from "@/lib/supabase/blog-student-actions";
import { BLOG_CATEGORIES, type BlogCategory, type DetailedBlog } from "@/lib/constants/blog";
import { createClient } from "@/lib/supabase/client";
import { X, Upload, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

interface BlogFormProps {
  blog?: DetailedBlog;
  userRole?: string;
  onSuccess?: () => void;
}

export function BlogForm({ blog, userRole, onSuccess }: BlogFormProps) {
  const router = useRouter();
  const isEditing = !!blog;

  const [title, setTitle] = useState(blog?.title || "");
  const [excerpt, setExcerpt] = useState(blog?.excerpt || "");
  const [content, setContent] = useState(blog?.content || "");
  const [category, setCategory] = useState<BlogCategory>(
    (blog?.category as BlogCategory) || "tutorials"
  );
  const [clusterId, setClusterId] = useState<string | undefined>(blog?.cluster_id || undefined);
  const [tags, setTags] = useState<string[]>(blog?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(
    blog?.featured_image_url || undefined
  );
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | undefined>(
    blog?.featured_image_url || undefined
  );
  const [pendingEditorImages, setPendingEditorImages] = useState<Map<string, File>>(new Map());
  const [clusters, setClusters] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch clusters for dropdown
  useEffect(() => {
    const fetchClusters = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await (supabase.auth as any).getUser();

      if (!user) return;

      // Get clusters user is a member of
      const { data } = await supabase
        .from("cluster_members")
        .select(
          `
          cluster_id,
          clusters!cluster_id (
            id,
            name
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "approved");

      if (data) {
        const uniqueClusters = data
          .filter((d: any) => d.clusters)
          .map((d: any) => ({
            id: d.clusters.id,
            name: d.clusters.name,
          }));
        setClusters(uniqueClusters);
      }
    };

    fetchClusters();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file for later upload and create a preview
    setFeaturedImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFeaturedImagePreview(previewUrl);
    // Clear any existing URL since we have a new file
    setFeaturedImageUrl(undefined);
  };

  const clearFeaturedImage = () => {
    if (featuredImagePreview && !featuredImageUrl) {
      URL.revokeObjectURL(featuredImagePreview);
    }
    setFeaturedImageFile(null);
    setFeaturedImagePreview(undefined);
    setFeaturedImageUrl(undefined);
  };

  const handleEditorImageUpload = async (file: File): Promise<string | null> => {
    // Create a temporary blob URL for preview
    const tempUrl = URL.createObjectURL(file);
    // Store the file with the temp URL as key for later upload
    setPendingEditorImages(prev => new Map(prev).set(tempUrl, file));
    return tempUrl;
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (saveAsDraft: boolean) => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!content.trim()) {
      toast.error("Content is required");
      return;
    }

    setLoading(true);

    try {
      // Upload featured image if there's a pending file
      let finalFeaturedImageUrl = featuredImageUrl;
      if (featuredImageFile) {
        const uploadResult = await uploadBlogImage(featuredImageFile);
        if (uploadResult.success && uploadResult.url) {
          finalFeaturedImageUrl = uploadResult.url;
        } else {
          toast.error(uploadResult.error || "Failed to upload featured image");
          setLoading(false);
          return;
        }
      }

      // Upload any pending editor images and replace blob URLs in content
      let finalContent = content;
      for (const [tempUrl, file] of pendingEditorImages.entries()) {
        if (finalContent.includes(tempUrl)) {
          const uploadResult = await uploadBlogImage(file);
          if (uploadResult.success && uploadResult.url) {
            finalContent = finalContent.replaceAll(tempUrl, uploadResult.url);
          } else {
            toast.error("Failed to upload one or more images");
            setLoading(false);
            return;
          }
        }
        // Revoke the blob URL to free memory
        URL.revokeObjectURL(tempUrl);
      }
      // Clear pending images after upload
      setPendingEditorImages(new Map());

      if (isEditing) {
        const result = await updateBlog(blog.id, {
          title,
          excerpt,
          content: finalContent,
          category,
          clusterId,
          tags,
          featuredImageUrl: finalFeaturedImageUrl,
        });

        if (result.success) {
          toast.success("Blog updated successfully");
          onSuccess?.();
          router.push("/dashboard/blog");
        } else {
          toast.error(result.error || "Failed to update blog");
        }
      } else {
        const result = await createBlog({
          title,
          excerpt,
          content: finalContent,
          category,
          clusterId,
          tags,
          featuredImageUrl: finalFeaturedImageUrl,
          saveAsDraft,
        });

        if (result.success) {
          const isAutoPublished = userRole === "staff" || userRole === "admin";
          if (saveAsDraft) {
            toast.success("Blog saved as draft");
          } else if (isAutoPublished) {
            toast.success("Blog published successfully");
          } else {
            toast.success("Blog submitted for approval");
          }
          onSuccess?.();
          router.push("/dashboard/blog");
        } else {
          toast.error(result.error || "Failed to create blog");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter blog title"
          className="text-lg"
        />
      </div>

      {/* Featured Image */}
      <div className="space-y-2">
        <Label>Featured Image</Label>
        <Card className="border-dashed">
          <CardContent className="p-4">
            {featuredImagePreview ? (
              <div className="relative">
                <img
                  src={featuredImagePreview}
                  alt="Featured"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearFeaturedImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload featured image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category & Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as BlogCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {BLOG_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cluster">Tag to Cluster (optional)</Label>
          <Select
            value={clusterId || "none"}
            onValueChange={(v) => setClusterId(v === "none" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No cluster</SelectItem>
              {clusters.map((cluster) => (
                <SelectItem key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Excerpt */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt (optional)</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of your blog post (auto-generated if empty)"
          rows={2}
        />
      </div>

      {/* Content Editor */}
      <div className="space-y-2">
        <Label>Content *</Label>
        <BlogEditor
          content={content}
          onChange={setContent}
          onImageUpload={handleEditorImageUpload}
          placeholder="Write your blog content here..."
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {tags.length}/10 tags - Press Enter or click Add to add a tag
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        {!isEditing && (
          <Button
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save as Draft
          </Button>
        )}
        <Button onClick={() => handleSubmit(false)} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {isEditing
            ? "Update"
            : userRole === "staff" || userRole === "admin"
            ? "Publish"
            : "Submit for Approval"}
        </Button>
      </div>
    </div>
  );
}
