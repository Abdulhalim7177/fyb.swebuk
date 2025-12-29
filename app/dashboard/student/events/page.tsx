import { Suspense } from "react";
import Link from "next/link";
import { Calendar, Award, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMyRegistrations,
  getMyUpcomingRegistrations,
  getMyPastRegistrations,
  getMyCertificates,
  getMyEventStats,
} from "@/lib/supabase/event-student-actions";
import {
  getRegistrationStatusLabel,
  getRegistrationStatusColorClass,
  getEventTypeLabel,
  getLocationTypeLabel,
} from "@/lib/constants/events";

export const metadata = {
  title: "My Events | Dashboard",
  description: "View your registered events and certificates",
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 animate-pulse h-24" />
      ))}
    </div>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 animate-pulse h-32" />
      ))}
    </div>
  );
}

async function EventStats() {
  const stats = await getMyEventStats();

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/10 backdrop-blur-xl p-6 hover:scale-105 transition-all duration-300">
        <p className="text-sm font-medium text-slate-400 mb-2">Total Registrations</p>
        <p className="text-4xl font-bold text-white">{stats.total_registrations}</p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 backdrop-blur-xl p-6 hover:scale-105 transition-all duration-300">
        <p className="text-sm font-medium text-slate-400 mb-2">Upcoming Events</p>
        <p className="text-4xl font-bold text-white">{stats.upcoming}</p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 backdrop-blur-xl p-6 hover:scale-105 transition-all duration-300">
        <p className="text-sm font-medium text-slate-400 mb-2">Events Attended</p>
        <p className="text-4xl font-bold text-white">{stats.attended}</p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 backdrop-blur-xl p-6 hover:scale-105 transition-all duration-300">
        <p className="text-sm font-medium text-slate-400 mb-2">Certificates Earned</p>
        <p className="text-4xl font-bold text-white">{stats.certificates_earned}</p>
      </div>
    </div>
  );
}

async function UpcomingEvents() {
  const registrations = await getMyUpcomingRegistrations();

  if (registrations.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
        <Calendar className="h-16 w-16 mx-auto text-slate-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No upcoming events</h3>
        <p className="text-slate-400 mb-4">
          You haven&apos;t registered for any upcoming events yet.
        </p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((reg) => (
        <Card key={reg.registration_id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {new Date(reg.start_date).getDate()}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  {new Date(reg.start_date).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {getEventTypeLabel(reg.event_type)}
                  </Badge>
                  <Badge
                    className={`text-xs ${getRegistrationStatusColorClass(
                      reg.registration_status
                    )}`}
                  >
                    {getRegistrationStatusLabel(reg.registration_status)}
                  </Badge>
                </div>

                <Link
                  href={`/events/${reg.event_slug}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {reg.event_title}
                </Link>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(reg.start_date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>{getLocationTypeLabel(reg.location_type)}</span>
                  {reg.organizer_name && <span>by {reg.organizer_name}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm">
                  <Link href={`/events/${reg.event_slug}`}>View Details</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function PastEvents() {
  const registrations = await getMyPastRegistrations();

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No past events</h3>
        <p className="text-muted-foreground">
          Your attended events will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.map((reg) => (
        <Card key={reg.registration_id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex flex-col items-center justify-center">
                <span className="text-xl font-bold">
                  {new Date(reg.start_date).getDate()}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  {new Date(reg.start_date).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {getEventTypeLabel(reg.event_type)}
                  </Badge>
                  {reg.registration_status === "attended" ? (
                    <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Attended
                    </Badge>
                  ) : reg.registration_status === "no_show" ? (
                    <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      <XCircle className="h-3 w-3 mr-1" />
                      Missed
                    </Badge>
                  ) : (
                    <Badge
                      className={`text-xs ${getRegistrationStatusColorClass(
                        reg.registration_status
                      )}`}
                    >
                      {getRegistrationStatusLabel(reg.registration_status)}
                    </Badge>
                  )}
                </div>

                <Link
                  href={`/events/${reg.event_slug}`}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  {reg.event_title}
                </Link>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    {new Date(reg.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {reg.organizer_name && <span>by {reg.organizer_name}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                {reg.registration_status === "attended" && !reg.has_feedback && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/events/${reg.event_slug}#feedback`}>
                      Give Feedback
                    </Link>
                  </Button>
                )}
                {reg.has_certificate && (
                  <Button asChild size="sm">
                    <Link href="/dashboard/student/events/certificates">
                      <Award className="h-4 w-4 mr-1" />
                      Certificate
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function MyCertificates() {
  const certificates = await getMyCertificates();

  if (certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No certificates yet</h3>
        <p className="text-muted-foreground">
          Attend events to earn certificates.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {certificates.map((cert) => {
        const eventData = cert.events as { title: string; start_date: string; event_type: string } | null;
        return (
          <Card key={cert.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{eventData?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Certificate #{cert.certificate_number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Issued on{" "}
                    {new Date(cert.issued_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="mt-3">
                    <Button size="sm" variant="outline">
                      Download Certificate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function StudentEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Events</h1>
          <p className="text-muted-foreground">
            View your registered events and certificates
          </p>
        </div>
        <Button asChild>
          <Link href="/events">
            <Calendar className="h-4 w-4 mr-2" />
            Browse Events
          </Link>
        </Button>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <EventStats />
      </Suspense>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Suspense fallback={<EventsSkeleton />}>
            <UpcomingEvents />
          </Suspense>
        </TabsContent>

        <TabsContent value="past">
          <Suspense fallback={<EventsSkeleton />}>
            <PastEvents />
          </Suspense>
        </TabsContent>

        <TabsContent value="certificates">
          <Suspense fallback={<EventsSkeleton />}>
            <MyCertificates />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
