"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { BlogCard } from "./blog-card";
import { getPublishedBlogs, type GetPublishedBlogsOptions } from "@/lib/supabase/blog-actions";
import type { DetailedBlog, BlogCategory } from "@/lib/constants/blog";

interface BlogGridProps {
  searchTerm?: string;
  filterCategory?: BlogCategory;
  filterCluster?: string;
  featured?: boolean;
  limit?: number;
  showStatus?: boolean;
  initialBlogs?: DetailedBlog[];
}

export function BlogGrid({
  searchTerm = "",
  filterCategory,
  filterCluster,
  featured,
  limit = 12,
  showStatus = false,
  initialBlogs,
}: BlogGridProps) {
  const [blogs, setBlogs] = useState<DetailedBlog[]>(initialBlogs || []);
  const [loading, setLoading] = useState(!initialBlogs);

  useEffect(() => {
    if (initialBlogs) {
      setBlogs(initialBlogs);
      return;
    }

    fetchBlogs();
  }, [searchTerm, filterCategory, filterCluster, featured, limit]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const options: GetPublishedBlogsOptions = {
        limit,
        search: searchTerm || undefined,
        category: filterCategory,
        clusterId: filterCluster,
        featured,
      };

      const data = await getPublishedBlogs(options);
      setBlogs(data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <div className="aspect-video">
              <Skeleton className="w-full h-full rounded-t-lg" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No blog posts found</h3>
        <p className="text-muted-foreground mt-2">
          {searchTerm || filterCategory || filterCluster
            ? "Try adjusting your search or filters"
            : "No blog posts have been published yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} showStatus={showStatus} />
      ))}
    </div>
  );
}

// Featured blogs grid with larger cards
export function FeaturedBlogsGrid({
  limit = 3,
  initialBlogs,
}: {
  limit?: number;
  initialBlogs?: DetailedBlog[];
}) {
  const [blogs, setBlogs] = useState<DetailedBlog[]>(initialBlogs || []);
  const [loading, setLoading] = useState(!initialBlogs);

  useEffect(() => {
    if (initialBlogs) {
      setBlogs(initialBlogs);
      return;
    }

    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const data = await getPublishedBlogs({ featured: true, limit });
        setBlogs(data);
      } catch (error) {
        console.error("Error fetching featured blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="aspect-video">
              <Skeleton className="w-full h-full rounded-t-lg" />
            </div>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-7 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (blogs.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} variant="featured" />
      ))}
    </div>
  );
}
