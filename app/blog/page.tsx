import { Suspense } from "react";
import { getPublishedBlogs, getClustersWithBlogs } from "@/lib/supabase/blog-actions";
import { BlogGrid, FeaturedBlogsGrid } from "@/components/blog/blog-grid";
import { BlogFiltersClient } from "./blog-filters-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlogCategory } from "@/lib/constants/blog";

export const metadata = {
  title: "Blog | Swebuk",
  description: "Read the latest blog posts from the Swebuk community",
};

interface BlogPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    cluster?: string;
  }>;
}

function BlogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { search, category, cluster } = await searchParams;

  // Fetch data server-side
  const [blogs, featuredBlogs, clusters] = await Promise.all([
    getPublishedBlogs({
      search,
      category: category as BlogCategory | undefined,
      clusterId: cluster,
      limit: 12,
    }),
    getPublishedBlogs({ featured: true, limit: 3 }),
    getClustersWithBlogs(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-center">Community Blog</h1>
          <p className="text-muted-foreground text-center mt-2 max-w-2xl mx-auto">
            Discover articles, tutorials, and insights from the Swebuk community
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Posts Section */}
        {featuredBlogs.length > 0 && !search && !category && !cluster && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Posts</h2>
            <FeaturedBlogsGrid initialBlogs={featuredBlogs} />
          </section>
        )}

        {/* Filters */}
        <section className="mb-8">
          <BlogFiltersClient
            clusters={clusters}
            initialSearch={search}
            initialCategory={category as BlogCategory | undefined}
            initialCluster={cluster}
          />
        </section>

        {/* Blog Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {search || category || cluster ? "Search Results" : "Latest Posts"}
            </h2>
            <span className="text-muted-foreground">
              {blogs.length} post{blogs.length !== 1 ? "s" : ""} found
            </span>
          </div>

          <Suspense fallback={<BlogGridSkeleton />}>
            <BlogGrid
              initialBlogs={blogs}
              searchTerm={search}
              filterCategory={category as BlogCategory | undefined}
              filterCluster={cluster}
            />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
