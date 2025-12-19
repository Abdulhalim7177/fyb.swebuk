"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogForm } from "@/components/blog/blog-form";
import { createClient } from "@/lib/supabase/client";

export default function CreateBlogPage() {
  const [userRole, setUserRole] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
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
      setLoading(false);
    };

    fetchUserRole();
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Blog Post</CardTitle>
          <p className="text-muted-foreground">
            {userRole === "staff" || userRole === "admin"
              ? "Your post will be published immediately."
              : "Your post will be submitted for approval before publishing."}
          </p>
        </CardHeader>
        <CardContent>
          <BlogForm userRole={userRole} />
        </CardContent>
      </Card>
    </div>
  );
}
