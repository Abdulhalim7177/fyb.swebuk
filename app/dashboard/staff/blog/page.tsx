"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BlogModeration } from "@/components/blog/blog-moderation";
import { getAllBlogsForModeration } from "@/lib/supabase/blog-staff-actions";
import type { DetailedBlog } from "@/lib/constants/blog";
import Link from "next/link";

export default function StaffBlogModerationPage() {
  const [blogs, setBlogs] = useState<DetailedBlog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const data = await getAllBlogsForModeration();
      setBlogs(data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Blog Moderation</h1>
          <p className="text-muted-foreground">
            Review and approve pending blog posts from students
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blog/create">
            Create Blog Post
          </Link>
        </Button>
      </div>
      <BlogModeration
        blogs={blogs}
        title="Blog Moderation"
        description="Review and approve pending blog posts from students"
        onRefresh={fetchBlogs}
      />
    </div>
  );
}
