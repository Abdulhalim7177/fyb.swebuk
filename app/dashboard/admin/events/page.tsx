import { Suspense } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Trash2,
  Archive,
  BarChart3,
} from "lucide-react";
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
import { getEventAnalytics } from "@/lib/supabase/event-admin-actions";
import {
  getEventStatusLabel,
  getEventStatusColorClass,
  getEventTypeLabel,
} from "@/lib/constants/events";

export const metadata = {
  title: "Event Management | Admin Dashboard",
  description: "Manage all events across the platform",
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
            <TableHead>Organizer</TableHead>
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
                <span className="text-sm">{event.organizer_name || "Unknown"}</span>
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
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/staff/events/${event.id}/certificates`}>
                        Issue Certificates
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/events/${event.slug}`} target="_blank">
                        View Public Page
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {event.status !== "archived" && (
                      <DropdownMenuItem className="text-amber-600">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Event
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
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

async function EventAnalytics() {
  const analytics = await getEventAnalytics();

  if (!analytics) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Events</CardDescription>
          <CardTitle className="text-3xl">{analytics.events.total}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {analytics.events.this_month} created this month
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Active Events</CardDescription>
          <CardTitle className="text-3xl">{analytics.events.by_status.published}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {analytics.events.by_status.draft} drafts pending
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Registrations</CardDescription>
          <CardTitle className="text-3xl">{analytics.registrations.total}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {analytics.registrations.attendance_rate}% attendance rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Certificates Issued</CardDescription>
          <CardTitle className="text-3xl">{analytics.certificates.total}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Avg. rating: {analytics.feedback.average_rating.toFixed(1)}/5
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">
            Manage all events across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/events/templates">
              Certificate Templates
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/staff/events/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        }
      >
        <EventAnalytics />
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
          <TabsTrigger value="archived">
            <Archive className="h-4 w-4 mr-1" />
            Archived
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

        <TabsContent value="archived">
          <Suspense fallback={<TableSkeleton />}>
            <EventsTable status="archived" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
