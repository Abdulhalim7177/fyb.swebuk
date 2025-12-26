"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogModeration } from "@/components/blog/blog-moderation";
import {
  getAllBlogsForModeration,
  getBlogModerationStats,
} from "@/lib/supabase/blog-staff-actions";
import {
  getBlogAnalytics,
  toggleFeatured,
  adminDeleteBlog,
} from "@/lib/supabase/blog-admin-actions";
import type { DetailedBlog } from "@/lib/constants/blog";
import { CategoryBadge } from "@/components/blog/category-badge";
import { StatusBadge } from "@/components/blog/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Star,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  MessageCircle,
  Heart,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<DetailedBlog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("moderation");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blogsData, analyticsData] = await Promise.all([
        getAllBlogsForModeration(),
        getBlogAnalytics(),
      ]);
      setBlogs(blogsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleFeatured = async (blogId: string) => {
    const result = await toggleFeatured(blogId);
    if (result.success) {
      toast.success(result.featured ? "Blog featured" : "Blog unfeatured");
      fetchData();
    } else {
      toast.error(result.error || "Failed to update featured status");
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog permanently?")) return;

    const result = await adminDeleteBlog(blogId);
    if (result.success) {
      toast.success("Blog deleted");
      fetchData();
    } else {
      toast.error(result.error || "Failed to delete blog");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

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
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">
            Full administrative control over the blog system
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blog/create">
            Create Blog Post
          </Link>
        </Button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Blogs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{analytics.totals.blogs}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{analytics.totals.published}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{analytics.totals.views}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{analytics.totals.comments}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{analytics.totals.likes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="all">All Blogs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="mt-4">
          <BlogModeration blogs={blogs} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All Blog Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {blog.featured_image_url ? (
                            <div className="w-14 h-10 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={blog.featured_image_url}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="max-w-[180px]">
                            <p className="font-medium truncate">{blog.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(blog.created_at)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{blog.author_name}</TableCell>
                      <TableCell>
                        <CategoryBadge category={blog.category} size="sm" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={blog.status} size="sm" />
                      </TableCell>
                      <TableCell>{blog.view_count || 0}</TableCell>
                      <TableCell>
                        {blog.is_featured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {blog.status === "published" && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/blog/${blog.slug}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleFeatured(blog.id)}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  {blog.is_featured ? "Unfeature" : "Feature"}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(blog.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Authors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Authors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topAuthors.map((author: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{author.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {author.count} posts • {author.views} views
                          </p>
                        </div>
                        <span className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Viewed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Most Viewed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.mostViewed.map((blog: any, index: number) => (
                      <div key={blog.id} className="flex items-center justify-between">
                        <div className="max-w-[200px]">
                          <Link
                            href={`/blog/${blog.slug}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {blog.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            by {blog.author}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{blog.views}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Posts by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(analytics.categoryStats).map(
                      ([category, count]: [string, any]) => (
                        <div
                          key={category}
                          className="flex items-center gap-2 bg-muted rounded-full px-4 py-2"
                        >
                          <CategoryBadge category={category as any} size="sm" />
                          <span className="font-medium">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
