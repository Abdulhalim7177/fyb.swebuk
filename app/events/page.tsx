import { Suspense } from "react";
import { Calendar } from "lucide-react";
import { getPublishedEvents } from "@/lib/supabase/event-actions";
import { EventCard } from "@/components/events/event-card";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

async function EventsList({
  searchParams,
}: {
  searchParams: {
    type?: string;
    category?: string;
    search?: string;
    page?: string;
  };
}) {
  const { events, total, totalPages, page } = await getPublishedEvents({
    eventType: searchParams.type,
    category: searchParams.category,
    search: searchParams.search,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 12,
  });

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground">
          {searchParams.search || searchParams.type || searchParams.category
            ? "Try adjusting your filters or search terms"
            : "Check back later for upcoming events"}
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
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
              }`}
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

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-12">
          <h1 className="text-4xl font-bold mb-4">Events</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover workshops, seminars, hackathons, and more. Join our
            community events to learn, network, and grow.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <Suspense fallback={<EventsSkeleton />}>
          <EventsList searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
