import { Suspense } from "react";
import { Calendar, Search, Sparkles, Clock, CalendarCheck, History, TrendingUp } from "lucide-react";
import { getPublishedEvents } from "@/lib/supabase/event-actions";
import { EventCardWithStatus } from "@/components/events/event-card-with-status";
import { EventHeader } from "@/components/events/event-header";
import { EventFilters } from "@/components/events/event-filters";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Events | Swebuk",
  description: "Discover and register for upcoming events at Swebuk",
};

interface EventsPageProps {
  searchParams: Promise<{
    type?: string;
    category?: string;
    search?: string;
    page?: string;
  }>;
}

function EventsSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Section for the Closest Upcoming Event
async function ClosestEventSection() {
  const { events } = await getPublishedEvents({
    upcoming: true,
    limit: 1,
  });

  if (events.length === 0) return null;

  const closestEvent = events[0];

  return (
    <section className="space-y-6 mb-16">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Next Event</h2>
          <p className="text-sm text-muted-foreground">
            Don't miss our upcoming event
          </p>
        </div>
      </div>

      <EventCardWithStatus event={closestEvent} variant="featured" />
    </section>
  );
}

// Section for Upcoming Events (Next 30 days)
async function UpcomingEventsSection() {
  const { events } = await getPublishedEvents({
    upcoming: true,
    limit: 7, // Get 7 so we can skip the first one (shown in ClosestEventSection)
  });

  // Skip the first event if we have more than one (first is shown in ClosestEventSection)
  const upcomingEvents = events.length > 1 ? events.slice(1) : [];

  if (upcomingEvents.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">More Upcoming Events</h2>
            <p className="text-sm text-muted-foreground">
              Explore what else is coming up
            </p>
          </div>
        </div>
        {upcomingEvents.length >= 6 && (
          <Link
            href="/events?section=upcoming"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingEvents.map((event) => (
          <EventCardWithStatus key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

// Section for Recent Past Events (Events that have ended in last 30 days)
async function RecentPastEventsSection() {
  const supabase = await createClient();
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get events where end_date is in the past (within last 30 days)
  const { data, error } = await supabase
    .from("detailed_events")
    .select("*")
    .eq("is_public", true)
    .lte("end_date", now.toISOString())
    .gte("end_date", thirtyDaysAgo.toISOString())
    .order("end_date", { ascending: false })
    .limit(6);

  if (error || !data || data.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CalendarCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Recent Past Events</h2>
            <p className="text-sm text-muted-foreground">
              Catch up on what you might have missed
            </p>
          </div>
        </div>
        {data.length >= 6 && (
          <Link
            href="/events?section=past"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((event: any) => (
          <EventCardWithStatus key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

// Section for Events by Category
async function EventsByCategorySection() {
  const categories = [
    { name: "Technical", value: "technical", color: "blue" },
    { name: "Career", value: "career", color: "purple" },
    { name: "Networking", value: "networking", color: "orange" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <p className="text-sm text-muted-foreground">
            Find events that match your interests
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.value}
            href={`/events?category=${category.value}`}
            className="group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Explore {category.name.toLowerCase()} events
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Section for Past Events Archive (All events older than 30 days)
async function PastEventsSection() {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get events where end_date is older than 30 days
  const { data, error } = await supabase
    .from("detailed_events")
    .select("*")
    .eq("is_public", true)
    .lt("end_date", thirtyDaysAgo.toISOString())
    .order("end_date", { ascending: false })
    .limit(3);

  if (error || !data || data.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-500/10">
            <History className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Event Archive</h2>
            <p className="text-sm text-muted-foreground">
              Browse our collection of past events
            </p>
          </div>
        </div>
        <Link
          href="/events?section=archive"
          className="text-sm font-medium text-primary hover:underline"
        >
          View archive →
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((event: any) => (
          <EventCardWithStatus key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

// Main Events List with all sections
async function EventsList({
  searchParams,
}: {
  searchParams: {
    type?: string;
    category?: string;
    search?: string;
    page?: string;
    section?: string;
  };
}) {
  // If filters are applied, show filtered results
  if (searchParams.search || searchParams.type || searchParams.category || searchParams.section) {
    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Handle section-based filtering with custom queries
    if (searchParams.section === "past") {
      // Recent past events (ended in last 30 days)
      const pageNum = searchParams.page ? parseInt(searchParams.page) : 1;
      const limitNum = 12;
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;

      const { data, error, count } = await supabase
        .from("detailed_events")
        .select("*", { count: "exact" })
        .eq("is_public", true)
        .lte("end_date", now.toISOString())
        .gte("end_date", thirtyDaysAgo.toISOString())
        .order("end_date", { ascending: false })
        .range(from, to);

      if (!error && data) {
        const events = data;
        const total = count || 0;
        const totalPages = Math.ceil(total / limitNum);

        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {events.length} of {total} past events
              </p>
            </div>

            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event: any) => (
                <EventCardWithStatus key={event.id} event={event} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <a
                    key={pageNum}
                    href={`/events?section=past&page=${pageNum}`}
                    className={`px-3 py-1 rounded-md text-sm ${
                      pageNum === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {pageNum}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      }
    } else if (searchParams.section === "archive") {
      // Archive events (older than 30 days)
      const pageNum = searchParams.page ? parseInt(searchParams.page) : 1;
      const limitNum = 12;
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;

      const { data, error, count } = await supabase
        .from("detailed_events")
        .select("*", { count: "exact" })
        .eq("is_public", true)
        .lt("end_date", thirtyDaysAgo.toISOString())
        .order("end_date", { ascending: false })
        .range(from, to);

      if (!error && data) {
        const events = data;
        const total = count || 0;
        const totalPages = Math.ceil(total / limitNum);

        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {events.length} of {total} archived events
              </p>
            </div>

            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event: any) => (
                <EventCardWithStatus key={event.id} event={event} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <a
                    key={pageNum}
                    href={`/events?section=archive&page=${pageNum}`}
                    className={`px-3 py-1 rounded-md text-sm ${
                      pageNum === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {pageNum}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      }
    }

    // Default filtering for other cases
    let options: any = {
      eventType: searchParams.type,
      category: searchParams.category,
      search: searchParams.search,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 12,
    };

    // Handle section filtering for upcoming
    if (searchParams.section === "upcoming") {
      options.upcoming = true;
    }

    const { events, total, totalPages, page } = await getPublishedEvents(options);

    if (events.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {events.length} of {total} events
          </p>
        </div>

        <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCardWithStatus key={event.id} event={event} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <a
                key={pageNum}
                href={`/events?page=${pageNum}${
                  searchParams.type ? `&type=${searchParams.type}` : ""
                }${searchParams.category ? `&category=${searchParams.category}` : ""}${
                  searchParams.search ? `&search=${searchParams.search}` : ""
                }${searchParams.section ? `&section=${searchParams.section}` : ""}`}
                className={`px-3 py-1 rounded-md text-sm ${
                  pageNum === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {pageNum}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default view: Show categorized sections
  return (
    <div className="space-y-16">
      <Suspense fallback={<SectionSkeleton />}>
        <ClosestEventSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <UpcomingEventsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <EventsByCategorySection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <RecentPastEventsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <PastEventsSection />
      </Suspense>
    </div>
  );
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      <EventHeader showBack={false} />

      {/* Hero Section with Modern Design */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="container mx-auto relative py-16 md:py-24 px-4 max-w-7xl">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Discover Amazing Events</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Events That{" "}
              <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                Inspire
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Join workshops, seminars, hackathons, and more. Connect with our
              community to learn, network, and grow together.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        {/* Filters */}
        <div className="mb-8">
          <EventFilters />
        </div>

        {/* Events List */}
        <Suspense fallback={<EventsSkeleton />}>
          <EventsList searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
