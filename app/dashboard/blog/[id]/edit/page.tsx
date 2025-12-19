"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BlogForm } from "@/components/blog/blog-form";
import { getMyBlogById } from "@/lib/supabase/blog-student-actions";
import { createClient } from "@/lib/supabase/client";
import type { DetailedBlog } from "@/lib/constants/blog";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EditBlogPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [blog, setBlog] = useState<DetailedBlog | null>(null);
  const [userRole, setUserRole] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await (supabase.auth as any).getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          setUserRole(profile?.role);
        }

        const blogData = await getMyBlogById(id);

        if (!blogData) {
          setError("Blog not found or you don't have permission to edit it.");
          setLoading(false);
          return;
        }

        if (!["draft", "rejected", "pending_approval"].includes(blogData.status)) {
          setError("You cannot edit a published blog.");
          setLoading(false);
          return;
        }

        setBlog(blogData);
      } catch (err) {
        setError("An error occurred while loading the blog.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-xl font-semibold mb-2">Cannot Edit Blog</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/dashboard/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Blogs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/blog">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <CardTitle>Edit Blog Post</CardTitle>
              <p className="text-muted-foreground">
                Make changes to your blog post
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BlogForm blog={blog} userRole={userRole} />
        </CardContent>
      </Card>
    </div>
  );
}
