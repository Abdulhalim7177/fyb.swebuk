import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Download,
  MailIcon,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEventForManagement, getEventRegistrations } from "@/lib/supabase/event-staff-actions";
import { createClient } from "@/lib/supabase/server";
import { CheckInButton } from "@/components/events/check-in-button";

function getStatusBadge(status: string) {
  const configs = {
    registered: { variant: "default" as const, icon: CheckCircle, label: "Registered" },
    attended: { variant: "default" as const, icon: CheckCircle, label: "Attended" },
    waitlisted: { variant: "secondary" as const, icon: Clock, label: "Waitlisted" },
    cancelled: { variant: "destructive" as const, icon: XCircle, label: "Cancelled" },
    no_show: { variant: "destructive" as const, icon: XCircle, label: "No Show" },
  };

  const config = configs[status as keyof typeof configs] || configs.registered;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default async function EventRegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const { id } = await params;
  const { status, search } = await searchParams;

  // Check authorization
  const supabase = await createClient();
  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const event = await getEventForManagement(id);

  if (!event) {
    notFound();
  }

  const allRegistrations = await getEventRegistrations(id);

  // Filter registrations
  let registrations = allRegistrations;
  if (status) {
    registrations = registrations.filter((r) => r.status === status);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    registrations = registrations.filter(
      (r) =>
        r.user_name?.toLowerCase().includes(searchLower) ||
        r.user_email?.toLowerCase().includes(searchLower)
    );
  }

  const stats = {
    total: allRegistrations.length,
    registered: allRegistrations.filter((r) => r.status === "registered").length,
    waitlisted: allRegistrations.filter((r) => r.status === "waitlisted").length,
    cancelled: allRegistrations.filter((r) => r.status === "cancelled").length,
    checkedIn: allRegistrations.filter((r) => r.checked_in_at).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/staff/events/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">Event Registrations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <MailIcon className="h-4 w-4 mr-2" />
            Email All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.registered}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.checkedIn}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Waitlisted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.waitlisted}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle>Registrations List</CardTitle>
          <CardDescription>
            Manage all registrations for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                defaultValue={search}
              />
            </div>
            <div className="flex gap-2">
              <Button variant={!status ? "default" : "outline"} size="sm" asChild>
                <Link href={`/dashboard/staff/events/${id}/registrations`}>
                  All
                </Link>
              </Button>
              <Button
                variant={status === "confirmed" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/dashboard/staff/events/${id}/registrations?status=confirmed`}
                >
                  Confirmed
                </Link>
              </Button>
              <Button
                variant={status === "waitlisted" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/dashboard/staff/events/${id}/registrations?status=waitlisted`}
                >
                  Waitlisted
                </Link>
              </Button>
              <Button
                variant={status === "cancelled" ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={`/dashboard/staff/events/${id}/registrations?status=cancelled`}
                >
                  Cancelled
                </Link>
              </Button>
            </div>
          </div>

          {registrations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No registrations found</h3>
              <p className="text-muted-foreground">
                {search || status
                  ? "Try adjusting your filters"
                  : "No one has registered for this event yet"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Academic Level</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration, index) => (
                    <TableRow key={registration.id || `registration-${registration.user_id}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={registration.user_avatar || undefined} />
                            <AvatarFallback>
                              {registration.user_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {registration.user_name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {registration.user_email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {registration.academic_level ? (
                          <Badge variant="outline">
                            Level {registration.academic_level}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(registration.registered_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(registration.registered_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(registration.status)}
                      </TableCell>
                      <TableCell>
                        {registration.checked_in_at ? (
                          <div>
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Checked In
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(registration.checked_in_at).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not checked in
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <CheckInButton
                          eventId={id}
                          userId={registration.user_id}
                          isCheckedIn={!!registration.checked_in_at}
                          status={registration.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
