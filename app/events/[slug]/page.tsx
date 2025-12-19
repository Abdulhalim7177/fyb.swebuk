import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  ExternalLink,
  Share2,
  ArrowLeft,
  Globe,
  Building,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEventBySlug, getEventFeedback, getEventFeedbackStats, getEventRegisteredUsers } from "@/lib/supabase/event-actions";
import { EventRegistrationButton } from "@/components/events/event-registration-button";
import { EventHeader } from "@/components/events/event-header";
import { RegisteredUsersAvatars } from "@/components/events/registered-users-avatars";
import {
  getEventTypeLabel,
  getEventTypeColorClass,
  getEventCategoryLabel,
  getLocationTypeLabel,
  formatEventDateRange,
  getEventTimeStatus,
  getEventDurationHours,
} from "@/lib/constants/events";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: "Event Not Found | Swebuk",
    };
  }

  return {
    title: `${event.title} | Swebuk Events`,
    description: event.short_description || event.description.substring(0, 160),
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const [feedback, feedbackStats, registeredUsers] = await Promise.all([
    getEventFeedback(event.id),
    getEventFeedbackStats(event.id),
    getEventRegisteredUsers(event.id, 10),
  ]);

  const timeStatus = getEventTimeStatus(event.start_date, event.end_date);
  const durationHours = getEventDurationHours(event.start_date, event.end_date);

  return (
    <div className="min-h-screen bg-background">
      <EventHeader showBack={true} backHref="/events" title="Event Details" />

      {/* Hero Section */}
      <div className="relative">
        {event.banner_image_url ? (
          <div className="relative h-80 md:h-[500px]">
            <Image
              src={event.banner_image_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-96 bg-gradient-to-br from-primary/20 via-primary/10 to-background relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          </div>
        )}

        {/* Event Info Overlay */}
        <div className="container mx-auto relative -mt-40 md:-mt-64 pb-8 px-4 max-w-7xl">
          <div className="bg-card/95 backdrop-blur-lg rounded-2xl shadow-2xl border p-6 md:p-10 transition-all hover:shadow-3xl">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getEventTypeColorClass(event.event_type)}>
                {getEventTypeLabel(event.event_type)}
              </Badge>
              {event.category && (
                <Badge variant="outline">
                  {getEventCategoryLabel(event.category)}
                </Badge>
              )}
              {timeStatus.status === "ongoing" && (
                <Badge className="bg-green-500 text-white animate-pulse">
                  Happening Now
                </Badge>
              )}
              {event.is_full && <Badge variant="destructive">Full</Badge>}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>

            {event.short_description && (
              <p className="text-lg text-muted-foreground mb-6">
                {event.short_description}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
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

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {event.location_type === "online" ? (
                    <Globe className="h-5 w-5 text-primary" />
                  ) : (
                    <MapPin className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {event.venue_name ||
                      event.location ||
                      getLocationTypeLabel(event.location_type)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Attendees</p>
                  <RegisteredUsersAvatars
                    users={registeredUsers}
                    maxDisplay={5}
                    totalCount={event.registrations_count}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              <EventRegistrationButton event={event} className="min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all" />
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full hover:scale-105 transition-transform">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-2xl font-bold">
                        {new Date(event.start_date).getDate()}
                      </p>
                      <p className="text-sm text-muted-foreground uppercase">
                        {new Date(event.start_date).toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatEventDateRange(event.start_date, event.end_date)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {timeStatus.label}
                      </p>
                    </div>
                  </div>

                  {event.registration_deadline && (
                    <Separator />
                  )}

                  {event.registration_deadline && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Registration deadline:{" "}
                        {new Date(event.registration_deadline).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feedback Section */}
            {feedbackStats && feedbackStats.total_feedback > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    Attendee Feedback
                  </CardTitle>
                  <CardDescription>
                    {feedbackStats.total_feedback} reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
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

                  {/* Rating Distribution */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm w-3">{rating}</span>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{
                              width: `${
                                (feedbackStats.rating_distribution[
                                  rating as keyof typeof feedbackStats.rating_distribution
                                ] /
                                  feedbackStats.total_feedback) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">
                          {
                            feedbackStats.rating_distribution[
                              rating as keyof typeof feedbackStats.rating_distribution
                            ]
                          }
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Recent Feedback */}
                  {feedback.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <Separator />
                      <h4 className="font-medium">Recent Reviews</h4>
                      {feedback.slice(0, 3).map((fb) => (
                        <div key={fb.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= fb.overall_rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              by {fb.user_name || "Anonymous"}
                            </span>
                          </div>
                          {fb.feedback_text && (
                            <p className="text-sm">{fb.feedback_text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer */}
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

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  {event.location_type === "online" ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : event.location_type === "hybrid" ? (
                    <Building className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Badge variant="secondary">
                    {getLocationTypeLabel(event.location_type)}
                  </Badge>
                </div>

                {event.venue_name && (
                  <p className="font-medium">{event.venue_name}</p>
                )}

                {event.location && (
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                )}

                {event.meeting_url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={event.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join Online
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certificate Info */}
            {event.certificate_enabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Certificate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Participants who attend this event will receive a certificate
                    of participation.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
