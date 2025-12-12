import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBlogBySlug,
  getBlogComments,
  getRelatedBlogs,
  checkBlogLiked,
  incrementViewCount,
} from "@/lib/supabase/blog-actions";
import { BlogContent } from "@/components/blog/blog-editor";
import { CategoryBadge } from "@/components/blog/category-badge";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogCommentsSection } from "./blog-comments-section";
import { BlogLikeButton } from "./blog-like-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, Eye, MessageCircle, Share2 } from "lucide-react";
import type { Metadata } from "next";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: "Blog Post Not Found",
    };
  }

  return {
    title: `${blog.title} | Swebuk Blog`,
    description: blog.excerpt || undefined,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || undefined,
      images: blog.featured_image_url ? [blog.featured_image_url] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog || blog.status !== "published") {
    notFound();
  }

  // Fetch related data
  const [comments, relatedBlogs, isLiked] = await Promise.all([
    getBlogComments(blog.id),
    getRelatedBlogs(blog.id, blog.category, 3),
    checkBlogLiked(blog.id),
  ]);

  // Increment view count (fire and forget)
  incrementViewCount(blog.id);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with featured image */}
      {blog.featured_image_url && (
        <div className="relative h-[400px] w-full">
          <img
            src={blog.featured_image_url}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </Button>

        {/* Article Header */}
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <CategoryBadge category={blog.category} size="lg" />
              {blog.cluster_name && (
                <span className="text-sm text-muted-foreground">
                  in {blog.cluster_name}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>

            {/* Author and Meta */}
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={blog.author_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {blog.author_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{blog.author_name}</p>
                  <p className="text-sm capitalize">{blog.author_role}</p>
                </div>
              </div>

              <Separator orientation="vertical" className="h-8" />

              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {formatDate(blog.published_at || blog.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{blog.read_time_minutes || 5} min read</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span className="text-sm">{blog.view_count || 0} views</span>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="mb-8">
            <BlogContent content={blog.content} />
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {blog.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?search=${encodeURIComponent(tag)}`}
                  className="text-sm bg-muted px-3 py-1 rounded-full hover:bg-muted/80 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Engagement Bar */}
          <div className="flex items-center justify-between py-4 border-t border-b mb-8">
            <div className="flex items-center gap-4">
              <BlogLikeButton
                blogId={blog.id}
                initialLiked={isLiked}
                initialCount={blog.likes_count || 0}
              />
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{blog.comments_count || 0} comments</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Comments Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Comments</h2>
            <BlogCommentsSection
              blogId={blog.id}
              initialComments={comments}
            />
          </section>
        </article>

        {/* Related Posts */}
        {relatedBlogs.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog: any) => (
                <BlogCard
                  key={relatedBlog.id}
                  blog={relatedBlog}
                  variant="compact"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
