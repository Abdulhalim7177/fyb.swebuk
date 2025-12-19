import { Suspense } from "react";
import Link from "next/link";
import { getPublishedBlogs, getClustersWithBlogs, getCurrentUser } from "@/lib/supabase/blog-actions";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogNavBar } from "@/components/blog/blog-nav-bar";
import { BlogFiltersClient } from "./blog-filters-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import type { BlogCategory, DetailedBlog } from "@/lib/constants/blog";

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
        <Card key={i} className="overflow-hidden border-0">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function HeroSection({ featuredBlog, isAuthenticated }: { featuredBlog?: DetailedBlog; isAuthenticated?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Community Blog
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Stories, Insights &{" "}
              <span className="text-primary">Knowledge</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Discover tutorials, project showcases, career tips, and community stories from software engineering students.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <a href="#posts">
                  Explore Posts
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href={isAuthenticated ? "/dashboard/blog/new" : "/auth/login"}>
                  Write a Post
                </Link>
              </Button>
            </div>
          </div>

          {/* Right - Featured Post */}
          {featuredBlog && (
            <div className="hidden lg:block">
              <BlogCard blog={featuredBlog} variant="featured" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection({ blogs }: { blogs: DetailedBlog[] }) {
  if (blogs.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Featured Posts</h2>
              <p className="text-sm text-muted-foreground">Hand-picked articles from our community</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.slice(0, 3).map((blog) => (
            <BlogCard key={blog.id} blog={blog} variant="featured" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { search, category, cluster } = await searchParams;

  // Fetch data server-side
  const [blogs, featuredBlogs, clusters, currentUser] = await Promise.all([
    getPublishedBlogs({
      search,
      category: category as BlogCategory | undefined,
      clusterId: cluster,
      limit: 12,
    }),
    getPublishedBlogs({ featured: true, limit: 3 }),
    getClustersWithBlogs(),
    getCurrentUser(),
  ]);

  const hasFilters = !!(search || category || cluster);
  const heroFeatured = featuredBlogs[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <BlogNavBar isAuthenticated={!!currentUser} />

      {/* Hero Section - only show when no filters */}
      {!hasFilters && <HeroSection featuredBlog={heroFeatured} isAuthenticated={!!currentUser} />}

      {/* Featured Section - only show when no filters */}
      {!hasFilters && featuredBlogs.length > 1 && (
        <FeaturedSection blogs={featuredBlogs.slice(1)} />
      )}

      {/* Main Content */}
      <main id="posts" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header when filters are active */}
        {hasFilters && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Search Results</h1>
            <p className="text-muted-foreground mt-1">
              {blogs.length} post{blogs.length !== 1 ? "s" : ""} found
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-10">
          <BlogFiltersClient
            clusters={clusters}
            initialSearch={search}
            initialCategory={category as BlogCategory | undefined}
            initialCluster={cluster}
          />
        </div>

        {/* Section Title */}
        {!hasFilters && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Latest Posts</h2>
                <p className="text-sm text-muted-foreground">Fresh content from our writers</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {blogs.length} post{blogs.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Blog Grid */}
        <Suspense fallback={<BlogGridSkeleton />}>
          {blogs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-6">
                {hasFilters
                  ? "Try adjusting your search or filters"
                  : "No blog posts have been published yet. Check back soon!"}
              </p>
              {hasFilters && (
                <Button variant="outline" asChild>
                  <Link href="/blog">Clear Filters</Link>
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog: DetailedBlog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>
          )}
        </Suspense>

        {/* Load More / CTA */}
        {blogs.length >= 12 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Posts
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      {/* CTA Section */}
      {!hasFilters && (
        <section className="border-t bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Share Your Story</h2>
              <p className="text-muted-foreground mb-8">
                Have something to share? Join our community and start writing. Share tutorials, project experiences, or career insights with fellow students.
              </p>
              <Button size="lg" asChild>
                <Link href={currentUser ? "/dashboard/blog/new" : "/auth/login"}>
                  Start Writing
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
