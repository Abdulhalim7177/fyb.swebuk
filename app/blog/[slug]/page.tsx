import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBlogBySlug,
  getBlogComments,
  getRelatedBlogs,
  checkBlogLiked,
  incrementViewCount,
  getCurrentUser,
} from "@/lib/supabase/blog-actions";
import { BlogContent } from "@/components/blog/blog-editor";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogNavBar } from "@/components/blog/blog-nav-bar";
import { BlogCommentsSection } from "./blog-comments-section";
import { BlogLikeButton } from "./blog-like-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  BookOpen,
  Twitter,
  Linkedin,
  Link2,
  ChevronRight,
} from "lucide-react";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

const categoryColors: Record<string, string> = {
  tutorials: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  news: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  projects: "bg-green-500/10 text-green-600 dark:text-green-400",
  events: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  career: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  resources: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  community: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  other: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

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
  const [comments, relatedBlogs, isLiked, currentUser] = await Promise.all([
    getBlogComments(blog.id),
    getRelatedBlogs(blog.id, blog.category, 3),
    checkBlogLiked(blog.id),
    getCurrentUser(),
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

  const categoryColor = categoryColors[blog.category] || categoryColors.other;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <BlogNavBar isAuthenticated={!!currentUser} />

      {/* Hero Header */}
      <header className="relative">
        {/* Featured Image */}
        {blog.featured_image_url ? (
          <>
            {/* Mobile: Full image in container */}
            <div className="block md:hidden px-4 pt-6">
              <div className="relative w-full rounded-xl overflow-hidden shadow-lg">
                <img
                  src={blog.featured_image_url}
                  alt={blog.title}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
            {/* Desktop: Full width with overlap */}
            <div className="hidden md:block relative w-full aspect-[24/9]">
              <img
                src={blog.featured_image_url}
                alt={blog.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          </>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5" />
        )}

        {/* Content */}
        <div className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${blog.featured_image_url ? "pt-6 md:-mt-32" : "pt-8"}`}>
          <div className="bg-background/95 backdrop-blur-sm rounded-t-2xl md:rounded-2xl shadow-lg border border-border/50 p-6 md:p-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/blog" className="hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              Blog
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="capitalize">{blog.category}</span>
          </nav>

          {/* Category & Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={cn("text-sm font-medium border-0", categoryColor)}>
              {blog.category}
            </Badge>
            {blog.cluster_name && (
              <span className="text-sm text-muted-foreground">
                in {blog.cluster_name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {blog.title}
          </h1>

          {/* Author & Meta Bar */}
          <div className="flex flex-wrap items-center gap-6 pb-8 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-background">
                <AvatarImage src={blog.author_avatar || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {blog.author_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{blog.author_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{blog.author_role}</p>
              </div>
            </div>

            <Separator orientation="vertical" className="h-10 hidden md:block" />

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.published_at || blog.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {blog.read_time_minutes || 5} min read
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {blog.view_count || 0} views
              </span>
            </div>
          </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-background/95 backdrop-blur-sm md:rounded-b-2xl shadow-lg border border-t-0 border-border/50 p-6 md:p-8 -mt-px">
        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <BlogContent content={blog.content} />
        </article>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t">
            <span className="text-sm font-medium text-muted-foreground mr-2">Tags:</span>
            {blog.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?search=${encodeURIComponent(tag)}`}
                className="text-sm bg-muted px-3 py-1.5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* Engagement Bar */}
        <Card className="mt-8 p-6 border-0 bg-muted/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
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

            {/* Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Share:</span>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Author Card */}
        <Card className="mt-8 p-6 border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-background">
              <AvatarImage src={blog.author_avatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {blog.author_name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Written by</p>
              <h3 className="text-lg font-semibold">{blog.author_name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{blog.author_role}</p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/blog?author=${blog.author_id}`}>
                View all posts
              </Link>
            </Button>
          </div>
        </Card>

        {/* Comments Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Comments ({blog.comments_count || 0})
          </h2>
          <BlogCommentsSection
            blogId={blog.id}
            initialComments={comments}
            currentUserId={currentUser?.id}
          />
        </section>
        </div>
      </div>

      {/* Related Posts */}
      {relatedBlogs.length > 0 && (
        <section className="border-t bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Related Posts</h2>
              <Button variant="outline" asChild>
                <Link href={`/blog?category=${blog.category}`}>
                  View all in {blog.category}
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog: any) => (
                <BlogCard
                  key={relatedBlog.id}
                  blog={relatedBlog}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <div className="border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button variant="ghost" asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to all posts
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
