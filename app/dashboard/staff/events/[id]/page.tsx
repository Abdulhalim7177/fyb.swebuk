import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Edit,
  MoreHorizontal,
  Globe,
  Building2,
  ExternalLink,
  Star,
  FileText,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEventForManagement } from "@/lib/supabase/event-staff-actions";
import { getEventRegisteredUsers, getEventFeedbackStats } from "@/lib/supabase/event-actions";
import { RegisteredUsersAvatars } from "@/components/events/registered-users-avatars";
import { DeleteEventButton } from "@/components/events/delete-event-button";
import {
  getEventTypeLabel,
  getEventTypeColorClass,
  getEventStatusLabel,
  getEventStatusColorClass,
  getLocationTypeLabel,
  formatEventDateRange,
  getEventTimeStatus,
  getEventDurationHours,
} from "@/lib/constants/events";
import { createClient } from "@/lib/supabase/server";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const [registeredUsers, feedbackStats] = await Promise.all([
    getEventRegisteredUsers(event.id, 10),
    getEventFeedbackStats(event.id),
  ]);

  const timeStatus = getEventTimeStatus(event.start_date, event.end_date);
  const durationHours = getEventDurationHours(event.start_date, event.end_date);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/staff/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">Event Details</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/events/${event.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Public Page
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/staff/events/${event.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
              {event.status === "completed" && event.certificate_enabled && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/staff/events/${event.id}/certificates`}>
                    Issue Certificates
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/staff/events/${event.id}/feedback`}>
                  View Feedback
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteEventButton
            eventId={event.id}
            eventTitle={event.title}
            hasRegistrations={event.registrations_count > 0}
            variant="outline"
          />
        </div>
      </div>

      {/* Banner */}
      {event.banner_image_url && (
        <div className="relative h-64 rounded-lg overflow-hidden">
          <Image
            src={event.banner_image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Event Overview</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getEventStatusColorClass(event.status)}>
                    {getEventStatusLabel(event.status)}
                  </Badge>
                  <Badge className={getEventTypeColorClass(event.event_type)}>
                    {getEventTypeLabel(event.event_type)}
                  </Badge>
                  {timeStatus.status === "ongoing" && (
                    <Badge className="bg-green-500 text-white animate-pulse">
                      Live Now
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.short_description && (
                <p className="text-lg text-muted-foreground">
                  {event.short_description}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {new Date(event.start_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start_date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {durationHours < 1
                        ? `${Math.round(durationHours * 60)} minutes`
                        : `${durationHours} hours`}
                    </p>
                  </div>
                </div>

                {/* Physical or Hybrid Location */}
                {(event.location_type === "physical" || event.location_type === "hybrid") && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-medium">
                        {event.venue_name || "Physical Location"}
                      </p>
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Online or Hybrid Meeting Link */}
                {(event.location_type === "online" || event.location_type === "hybrid") && event.meeting_url && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Online Meeting</p>
                      <Button variant="outline" size="sm" className="mt-1" asChild>
                        <a
                          href={event.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Meeting
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      Registrations
                    </p>
                    <RegisteredUsersAvatars
                      users={registeredUsers}
                      maxDisplay={5}
                      totalCount={event.registrations_count}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </CardContent>
          </Card>

          {/* Feedback Stats */}
          {feedbackStats && feedbackStats.total_feedback > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    Feedback Summary
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/staff/events/${event.id}/feedback`}>
                      View All Feedback
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">
                    {feedbackStats.average_overall.toFixed(1)}
                  </div>
                  <div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(feedbackStats.average_overall)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {feedbackStats.total_feedback} reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Registrations
                </span>
                <span className="text-2xl font-bold">
                  {event.registrations_count}
                  {event.max_capacity && (
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      / {event.max_capacity}
                    </span>
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Attended</span>
                <span className="text-2xl font-bold">{event.attendees_count}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Waitlist</span>
                <span className="text-2xl font-bold">{event.waitlist_count}</span>
              </div>
              {feedbackStats && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Feedback
                    </span>
                    <span className="text-2xl font-bold">
                      {feedbackStats.total_feedback}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Public Event</span>
                <Badge variant={event.is_public ? "default" : "secondary"}>
                  {event.is_public ? "Yes" : "No"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Registration Required
                </span>
                <Badge
                  variant={event.is_registration_required ? "default" : "secondary"}
                >
                  {event.is_registration_required ? "Yes" : "No"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Certificates</span>
                <Badge
                  variant={event.certificate_enabled ? "default" : "secondary"}
                >
                  {event.certificate_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {event.registration_deadline && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">
                      Registration Deadline
                    </span>
                    <p className="text-sm font-medium mt-1">
                      {new Date(event.registration_deadline).toLocaleString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Organizer */}
          {event.organizer_name && (
            <Card>
              <CardHeader>
                <CardTitle>Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={event.organizer_avatar || undefined} />
                    <AvatarFallback>
                      {event.organizer_name?.charAt(0) || "O"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{event.organizer_name}</p>
                    {event.cluster_name && (
                      <p className="text-sm text-muted-foreground">
                        {event.cluster_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/staff/events/${event.id}/registrations`}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Registrations
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/staff/events/${event.id}/attendance`}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Track Attendance
                </Link>
              </Button>
              {event.status === "completed" && event.certificate_enabled && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={`/dashboard/staff/events/${event.id}/certificates`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Issue Certificates
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
