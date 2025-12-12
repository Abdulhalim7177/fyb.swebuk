"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryBadge } from "@/components/blog/category-badge";
import { StatusBadge } from "@/components/blog/status-badge";
import {
  getMyBlogs,
  getMyBlogStats,
  deleteBlog,
  submitForApproval,
  saveAsDraft,
} from "@/lib/supabase/blog-student-actions";
import type { DetailedBlog, BlogStatus } from "@/lib/constants/blog";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardBlogPage() {
  const [blogs, setBlogs] = useState<DetailedBlog[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    draft: number;
    pending: number;
    published: number;
    rejected: number;
    totalViews: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BlogStatus | "all">("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blogsData, statsData] = await Promise.all([
        getMyBlogs(),
        getMyBlogStats(),
      ]);
      setBlogs(blogsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    const result = await deleteBlog(blogId);
    if (result.success) {
      toast.success("Blog deleted");
      fetchData();
    } else {
      toast.error(result.error || "Failed to delete blog");
    }
  };

  const handleSubmitForApproval = async (blogId: string) => {
    const result = await submitForApproval(blogId);
    if (result.success) {
      toast.success("Blog submitted for approval");
      fetchData();
    } else {
      toast.error(result.error || "Failed to submit");
    }
  };

  const handleSaveAsDraft = async (blogId: string) => {
    const result = await saveAsDraft(blogId);
    if (result.success) {
      toast.success("Blog saved as draft");
      fetchData();
    } else {
      toast.error(result.error || "Failed to save as draft");
    }
  };

  const filteredBlogs =
    activeTab === "all" ? blogs : blogs.filter((b) => b.status === activeTab);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage and track your blog posts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blog/create">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-2xl font-bold">{stats.draft}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.published}</span>
              </div>
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
                <span className="text-2xl font-bold">{stats.totalViews}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Blog List */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({blogs.length})</TabsTrigger>
          <TabsTrigger value="draft">
            Drafts ({blogs.filter((b) => b.status === "draft").length})
          </TabsTrigger>
          <TabsTrigger value="pending_approval">
            Pending ({blogs.filter((b) => b.status === "pending_approval").length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({blogs.filter((b) => b.status === "published").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({blogs.filter((b) => b.status === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredBlogs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No blog posts found</h3>
                <p className="text-muted-foreground mt-1">
                  {activeTab === "all"
                    ? "Start writing your first blog post"
                    : `No ${activeTab.replace("_", " ")} posts`}
                </p>
                {activeTab === "all" && (
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/blog/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {blog.featured_image_url ? (
                            <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={blog.featured_image_url}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="max-w-[250px]">
                            <p className="font-medium truncate">{blog.title}</p>
                            {blog.rejected_reason && (
                              <p className="text-xs text-red-500 mt-1 truncate">
                                Reason: {blog.rejected_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={blog.category} size="sm" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={blog.status} size="sm" />
                      </TableCell>
                      <TableCell>{blog.view_count || 0}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(blog.created_at)}
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
                              <DropdownMenuItem asChild>
                                <Link href={`/blog/${blog.slug}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {["draft", "rejected"].includes(blog.status) && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/blog/${blog.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSubmitForApproval(blog.id)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Submit for Approval
                                </DropdownMenuItem>
                              </>
                            )}
                            {blog.status === "pending_approval" && (
                              <DropdownMenuItem
                                onClick={() => handleSaveAsDraft(blog.id)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Save as Draft
                              </DropdownMenuItem>
                            )}
                            {blog.status !== "published" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(blog.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
