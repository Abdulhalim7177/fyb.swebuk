"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MessageCircle, BookOpen, User, Eye, Heart } from "lucide-react";
import Link from "next/link";
import type { DetailedBlog } from "@/lib/constants/blog";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  blog: DetailedBlog;
  showStatus?: boolean;
  showAuthor?: boolean;
  variant?: "default" | "featured";
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  tutorials: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  news: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  projects: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  events: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  career: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/30" },
  resources: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  community: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
  other: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
};

export function BlogCard({
  blog,
  showStatus = false,
  showAuthor = true,
  variant = "default",
}: BlogCardProps) {
  const formatDate = (date: string) => {
    const now = new Date();
    const blogDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - blogDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;

    return blogDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const colors = categoryColors[blog.category] || categoryColors.other;
  const hasImage = !!blog.featured_image_url;

  // Featured variant - with image area (for featured posts section)
  if (variant === "featured") {
    return (
      <Link href={`/blog/${blog.slug}`} className="group block h-full">
        <div className="h-full rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
          <div className="p-0 h-full flex flex-col">
            {/* Image or Gradient Placeholder */}
            {hasImage ? (
              <div className="h-48 overflow-hidden">
                <img
                  src={blog.featured_image_url!}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-emerald-400/50" />
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <Badge
                  variant="secondary"
                  className={cn("text-xs border", colors.bg, colors.text, colors.border)}
                >
                  {blog.category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {blog.read_time_minutes || 5} min read
                </span>
              </div>

              <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {blog.title}
              </h4>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                {blog.excerpt}
              </p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={blog.author_avatar || undefined} />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-primary to-purple-500 text-white">
                      {blog.author_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">{blog.author_name}</span>
                </div>
                <div className="flex items-center space-x-3 text-muted-foreground text-xs">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {blog.view_count || 0}
                  </span>
                  <span className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {blog.likes_count || 0}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {blog.comments_count || 0}
                  </span>
                  <span>{formatDate(blog.published_at || blog.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - shows image if available
  return (
    <Link href={`/blog/${blog.slug}`} className="group block h-full">
      <Card className="h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border-border/50 hover:border-primary/30 hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Image area - show if image exists */}
          {hasImage && (
            <div className="relative h-44 overflow-hidden">
              <img
                src={blog.featured_image_url!}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <Badge
                variant="secondary"
                className={cn("absolute top-3 left-3 text-xs border", colors.bg, colors.text, colors.border)}
              >
                {blog.category}
              </Badge>
            </div>
          )}

          <div className={cn("flex-1 flex flex-col", hasImage ? "p-4" : "p-6")}>
            {/* Category badge - only show here if no image */}
            {!hasImage && (
              <div className="flex items-center justify-between mb-3">
                <Badge
                  variant="secondary"
                  className={cn("text-xs border", colors.bg, colors.text, colors.border)}
                >
                  {blog.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {blog.read_time_minutes || 5} min read
                </span>
              </div>
            )}

            <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {blog.title}
            </h4>

            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
              {blog.excerpt}
            </p>

            <div className="flex items-center justify-between text-sm pt-3 border-t border-border/50">
              <div className="flex items-center space-x-2">
                {showAuthor ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={blog.author_avatar || undefined} />
                      <AvatarFallback className="text-[10px] bg-gradient-to-r from-primary to-purple-500 text-white">
                        {blog.author_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground truncate max-w-[80px]">{blog.author_name}</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate max-w-[80px]">{blog.author_name}</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground text-xs">
                <span className="flex items-center">
                  <Eye className="w-3.5 h-3.5 mr-0.5" />
                  {blog.view_count || 0}
                </span>
                <span className="flex items-center">
                  <Heart className="w-3.5 h-3.5 mr-0.5" />
                  {blog.likes_count || 0}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="w-3.5 h-3.5 mr-0.5" />
                  {blog.comments_count || 0}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-0.5" />
                  {formatDate(blog.published_at || blog.created_at)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
