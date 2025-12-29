import { Suspense } from "react";
import Link from "next/link";
import { Plus, Calendar, Users, CheckCircle, Clock, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllEventsForManagement } from "@/lib/supabase/event-staff-actions";
import {
  getEventStatusLabel,
  getEventStatusColorClass,
  getEventTypeLabel,
} from "@/lib/constants/events";

export const metadata = {
  title: "Event Management | Staff Dashboard",
  description: "Create and manage events",
};

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

async function EventsTable({ status }: { status?: string }) {
  const events = await getAllEventsForManagement(
    status as "draft" | "published" | "completed" | "cancelled" | "archived" | undefined
  );

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground mb-4">
          {status
            ? `No ${status} events at the moment.`
            : "Get started by creating your first event."}
        </p>
        <Button asChild>
          <Link href="/dashboard/staff/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Registrations</TableHead>
            <TableHead className="text-center">Attended</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <div>
                  <Link
                    href={`/dashboard/staff/events/${event.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {event.title}
                  </Link>
                  {event.cluster_name && (
                    <p className="text-xs text-muted-foreground">
                      {event.cluster_name}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{getEventTypeLabel(event.event_type)}</Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(event.start_date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getEventStatusColorClass(event.status)}>
                  {getEventStatusLabel(event.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {event.registrations_count}
                    {event.max_capacity && ` / ${event.max_capacity}`}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span>{event.attendees_count}</span>
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/staff/events/${event.id}`}>
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/staff/events/${event.id}/edit`}>
                        Edit Event
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/staff/events/${event.id}/registrations`}>
                        View Registrations
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/staff/events/${event.id}/attendance`}>
                        Manage Attendance
                      </Link>
                    </DropdownMenuItem>
                    {new Date(event.end_date) < new Date() && (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/staff/events/${event.id}/certificates`}>
                          Issue Certificates
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/events/${event.slug}`} target="_blank">
                        View Public Page
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

async function EventStats() {
  const allEvents = await getAllEventsForManagement();

  const stats = {
    total: allEvents.length,
    draft: allEvents.filter((e) => e.status === "draft").length,
    published: allEvents.filter((e) => e.status === "published").length,
    completed: allEvents.filter((e) => e.status === "completed").length,
    totalRegistrations: allEvents.reduce(
      (sum, e) => sum + e.registrations_count,
      0
    ),
    totalAttended: allEvents.reduce((sum, e) => sum + e.attendees_count, 0),
  };

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Events</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Active Events</CardDescription>
          <CardTitle className="text-3xl">{stats.published}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Registrations</CardDescription>
          <CardTitle className="text-3xl">{stats.totalRegistrations}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Attended</CardDescription>
          <CardTitle className="text-3xl">{stats.totalAttended}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function StaffEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">
            Create and manage events for the community
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/staff/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        }
      >
        <EventStats />
      </Suspense>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="draft">
            <Clock className="h-4 w-4 mr-1" />
            Drafts
          </TabsTrigger>
          <TabsTrigger value="published">
            <Calendar className="h-4 w-4 mr-1" />
            Published
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Suspense fallback={<TableSkeleton />}>
            <EventsTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="draft">
          <Suspense fallback={<TableSkeleton />}>
            <EventsTable status="draft" />
          </Suspense>
        </TabsContent>

        <TabsContent value="published">
          <Suspense fallback={<TableSkeleton />}>
            <EventsTable status="published" />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed">
          <Suspense fallback={<TableSkeleton />}>
            <EventsTable status="completed" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
