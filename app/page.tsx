import { Suspense } from "react";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { getFeaturedBlogs, getLatestBlogs, getUpcomingEvents, getPopularClusters } from "@/lib/supabase/landing-actions";
import { LandingBlogCard } from "@/components/landing/landing-blog-card";
import { LandingEventCard } from "@/components/landing/landing-event-card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { PageAnimations } from "@/components/landing/page-animations";

function LandingPageClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1"></div>
        <div className="ambient-orb ambient-orb-2"></div>
        <div className="ambient-orb ambient-orb-3"></div>
      </div>

      {children}
      <PageAnimations />
    </div>
  );
}

// Loading skeletons
function BlogSkeleton() {
  return (
    <div className="glass-card feature-card animate-on-scroll" suppressHydrationWarning>
      <div className="feature-icon">
        <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse mb-2" />
      <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-2" />
      <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="glass-card feature-card animate-on-scroll" suppressHydrationWarning>
      <div className="feature-icon">
        <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse mb-2" />
      <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-2" />
      <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

function ClusterSkeleton() {
  return (
    <div className="glass-card feature-card animate-on-scroll" suppressHydrationWarning>
      <div className="feature-icon">
        <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse mb-2" />
      <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-2" />
      <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

// Featured Blogs Section
async function FeaturedBlogsSection() {
  const blogs = await getFeaturedBlogs(3);

  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50 dark:bg-white/5 backdrop-blur-sm border-y border-slate-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-200 dark:border-emerald-500/30">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Featured Articles</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Hand-picked content from our community</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30"
            asChild
          >
            <Link href="/blog">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <LandingBlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Latest Blogs Section
async function LatestBlogsSection() {
  const blogs = await getLatestBlogs(4);

  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="py-16 bg-white dark:bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-200 dark:border-emerald-500/30">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Latest Articles</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Fresh content from our writers</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30"
            asChild
          >
            <Link href="/blog">See More</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogs.map((blog) => (
            <LandingBlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Upcoming Events Section
async function UpcomingEventsSection() {
  const events = await getUpcomingEvents(3);

  if (!events || events.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50 dark:bg-white/5 backdrop-blur-sm border-y border-slate-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-200 dark:border-blue-500/30">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Upcoming Events</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Join our community events</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30"
            asChild
          >
            <Link href="/events">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => (
            <LandingEventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Popular Clusters Section
async function PopularClustersSection() {
  const clusters = await getPopularClusters(4);

  if (!clusters || clusters.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50 dark:bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-gradient-to-br dark:from-violet-500/20 dark:to-purple-500/20 border border-violet-200 dark:border-violet-500/30">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Popular Clusters</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Join our active communities</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-white/20 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/30"
            asChild
          >
            <Link href="/dashboard/clusters">Explore</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {clusters.map((cluster) => (
            <Link key={cluster.id} href={`/dashboard/clusters/${cluster.id}`} className="group block h-full">
              <div className="glass-card animate-on-scroll h-full flex flex-col overflow-hidden" suppressHydrationWarning>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="feature-icon mb-4 bg-primary/10 dark:bg-white/5">
                    <Users className="w-8 h-8 text-primary dark:text-white" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-gradient transition-colors duration-300 flex-grow">
                    {cluster.name}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 flex-grow">{cluster.description || "No description available."}</p>

                </div>
                <div className="px-6 py-3 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {cluster.members_count} members
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  return (
    <LandingPageClient>
      <Navigation />

      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />

        {/* Dynamic content sections */}
        <Suspense fallback={
          <section className="py-16 bg-white/5 backdrop-blur-sm border-y border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <BookOpen className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Featured Articles</h2>
                    <p className="text-sm text-slate-400">Hand-picked content from our community</p>
                  </div>
                </div>
                <div className="border border-white/20 text-white bg-transparent py-2 px-4 rounded-md text-sm animate-pulse">
                  Loading...
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <BlogSkeleton key={i} />)}
              </div>
            </div>
          </section>
        }>
          <FeaturedBlogsSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <BookOpen className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Latest Articles</h2>
                    <p className="text-sm text-slate-400">Fresh content from our writers</p>
                  </div>
                </div>
                <div className="border border-white/20 text-white bg-transparent py-2 px-4 rounded-md text-sm animate-pulse">
                  Loading...
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <BlogSkeleton key={i} />)}
              </div>
            </div>
          </section>
        }>
          <LatestBlogsSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16 bg-white/5 backdrop-blur-sm border-y border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                    <Calendar className="w-5 h-5 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
                    <p className="text-sm text-slate-400">Join our community events</p>
                  </div>
                </div>
                <div className="border border-white/20 text-white bg-transparent py-2 px-4 rounded-md text-sm animate-pulse">
                  Loading...
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <EventSkeleton key={i} />)}
              </div>
            </div>
          </section>
        }>
          <UpcomingEventsSection />
        </Suspense>

        <Suspense fallback={
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
                    <Users className="w-5 h-5 text-violet-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Popular Clusters</h2>
                    <p className="text-sm text-slate-400">Join our active communities</p>
                  </div>
                </div>
                <div className="border border-white/20 text-white bg-transparent py-2 px-4 rounded-md text-sm animate-pulse">
                  Loading...
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <ClusterSkeleton key={i} />)}
              </div>
            </div>
          </section>
        }>
          <PopularClustersSection />
        </Suspense>

        <CtaSection />
      </main>

      <Footer />
    </LandingPageClient>
  );
}
