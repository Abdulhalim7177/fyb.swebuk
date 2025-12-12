"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "./category-badge";
import { StatusBadge } from "./status-badge";
import { Clock, MessageCircle, Heart, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import type { DetailedBlog } from "@/lib/constants/blog";

interface BlogCardProps {
  blog: DetailedBlog;
  showStatus?: boolean;
  showAuthor?: boolean;
  variant?: "default" | "compact" | "featured";
}

export function BlogCard({
  blog,
  showStatus = false,
  showAuthor = true,
  variant = "default",
}: BlogCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (variant === "compact") {
    return (
      <Link href={`/blog/${blog.slug}`}>
        <Card className="group hover:shadow-md transition-shadow duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {blog.featured_image_url && (
                <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={blog.featured_image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CategoryBadge category={blog.category} size="sm" />
                <h4 className="font-semibold mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(blog.published_at || blog.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/blog/${blog.slug}`}>
        <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden h-full">
          {blog.featured_image_url && (
            <div className="aspect-video overflow-hidden">
              <img
                src={blog.featured_image_url}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CategoryBadge category={blog.category} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {blog.read_time_minutes || 5} min read
              </span>
            </div>
            <h3 className="text-xl font-bold mt-2 group-hover:text-primary transition-colors line-clamp-2">
              {blog.title}
            </h3>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-muted-foreground line-clamp-3">{blog.excerpt}</p>
          </CardContent>
          <CardFooter className="pt-2 flex items-center justify-between">
            {showAuthor && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={blog.author_avatar || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {blog.author_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{blog.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(blog.published_at || blog.created_at)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {blog.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {blog.likes_count || 0}
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      {blog.featured_image_url && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <Link href={`/blog/${blog.slug}`}>
            <img
              src={blog.featured_image_url}
              alt={blog.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>
      )}
      <CardHeader className={`pb-2 ${!blog.featured_image_url ? "pt-6" : ""}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CategoryBadge category={blog.category} />
          {showStatus && <StatusBadge status={blog.status} />}
          {!showStatus && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {blog.read_time_minutes || 5} min
            </span>
          )}
        </div>
        <Link href={`/blog/${blog.slug}`}>
          <h3 className="text-lg font-semibold mt-2 group-hover:text-primary transition-colors line-clamp-2">
            {blog.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        <p className="text-sm text-muted-foreground line-clamp-3">{blog.excerpt}</p>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-muted px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {blog.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{blog.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 flex items-center justify-between border-t">
        {showAuthor && (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={blog.author_avatar || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {blog.author_name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{blog.author_name}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(blog.published_at || blog.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {blog.comments_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {blog.likes_count || 0}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
