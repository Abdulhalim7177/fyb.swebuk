"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, MapPin, Lock, UserCheck, UserX, Check, X, Ticket,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Link from "next/link";

interface ClusterEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  created_at: string;
  cluster_id: string;
  organizer_name: string;
  attendees_count: number;
}

interface ClusterEventsListProps {
  clusterId: string;
  userRole: string;
  userId?: string;
  isMember?: boolean;
  canManage?: boolean;
}

export function ClusterEventsList({ clusterId, userRole, userId, isMember = false, canManage = false }: ClusterEventsListProps) {
  const [events, setEvents] = useState<ClusterEvent[]>([]);
  const [registrations, setRegistrations] = useState<Record<string, { status: string; id: string }>>({});
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<Record<string, boolean>>({});
  const [registerDialogOpen, setRegisterDialogOpen] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClusterEvent | null>(null);

  const supabase = createClient();

  const handleRegisterClick = (eventId: string, eventTitle: string) => {
    if (!userId) {
      toast.error("Please log in to register for events");
      return;
    }
    const registration = registrations[eventId];
    const minimalEvent: ClusterEvent = {
      id: eventId,
      slug: "",
      title: eventTitle,
      description: "",
      start_date: "",
      end_date: "",
      location: "",
      status: "",
      created_at: "",
      cluster_id: "",
      organizer_name: "",
      attendees_count: 0,
    };
    if (registration?.status === "registered") {
      // Already registered - show success info
      setSelectedEvent(minimalEvent);
      setSuccessDialogOpen(true);
      return;
    }
    setSelectedEvent(minimalEvent);
    setRegisterDialogOpen(eventId);
  };

  const handleConfirmRegister = async () => {
    if (!selectedEvent || !userId) return;

    const eventId = selectedEvent.id;
    try {
      setRegistering(prev => ({ ...prev, [eventId]: true }));
      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: userId,
          status: "registered",
        });

      if (error) throw error;

      // Update local state
      setRegistrations(prev => ({ ...prev, [eventId]: { status: "registered", id: "" } }));
      setRegisterDialogOpen(null);

      // Show success modal
      setSelectedEvent({ ...selectedEvent, slug: "" });
      setSuccessDialogOpen(true);
    } catch (error: any) {
      console.error("Error registering for event:", error);
      toast.error("Failed to register: " + error.message);
    } finally {
      setRegistering({ ...registering, [eventId]: false });
    }
  };

  const handleUnregister = async (eventId: string) => {
    const registration = registrations[eventId];
    if (!registration) return;

    try {
      setRegistering(prev => ({ ...prev, [eventId]: true }));
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", registration.id)
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Successfully unregistered from event");
      setRegistrations(prev => ({ ...prev, [eventId]: { status: "cancelled", id: registration.id } }));
    } catch (error: any) {
      console.error("Error unregistering from event:", error);
      toast.error("Failed to unregister: " + error.message);
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);

        // Fetch events associated with this cluster
        const { data, error } = await supabase
          .from("events")
          .select(`
            id,
            slug,
            title,
            description,
            start_date,
            end_date,
            location,
            status,
            created_at,
            cluster_id,
            organizer_id,
            profiles!events_organizer_id_fkey (
              full_name
            )
          `)
          .eq("cluster_id", clusterId)
          .gte("start_date", new Date().toISOString()) // Only show future/upcoming events
          .order("start_date", { ascending: true });

        if (error) throw error;

        if (data) {
          // If user is a member, fetch their registration status for events
          if (userId && (isMember || canManage)) {
            const { data: regData } = await supabase
              .from("event_registrations")
              .select("event_id, status, id")
              .eq("user_id", userId)
              .in("event_id", data.map(e => e.id));

            const regMap: Record<string, { status: string; id: string }> = {};
            regData?.forEach((reg: any) => {
              regMap[reg.event_id] = { status: reg.status, id: reg.id };
            });
            setRegistrations(regMap);
          }

          // For each event, also fetch number of attendees/registrations
          const eventsWithAttendees = await Promise.all(
            data.map(async (event: any) => {
              // Count event registrations (registered/attended users)
              const { count: attendeesCount, error: attendeeError } = await supabase
                .from("event_registrations")
                .select("*", { count: "exact", head: true })
                .eq("event_id", event.id)
                .in("status", ["registered", "attended"]);

              if (attendeeError) {
                console.error("Error counting attendees for event:", event.id, attendeeError);
              }

              return {
                id: event.id,
                slug: event.slug,
                title: event.title,
                description: event.description,
                start_date: event.start_date,
                end_date: event.end_date,
                location: event.location,
                status: event.status,
                created_at: event.created_at,
                cluster_id: event.cluster_id,
                organizer_name: event.profiles?.full_name || 'Unknown',
                attendees_count: attendeesCount || 0,
              };
            })
          );

          setEvents(eventsWithAttendees);
        }
      } catch (error: any) {
        console.error("Error fetching cluster events:", error);
        toast.error("Failed to load cluster events: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (clusterId) {
      fetchEvents();
    }
  }, [clusterId, userId, isMember]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b bg-muted/30">
        <h3 className="text-lg font-semibold">Cluster Events</h3>
        <p className="text-sm text-muted-foreground">Upcoming events organized by this cluster</p>
      </div>
      <div className="divide-y max-h-[400px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No upcoming events scheduled for this cluster yet.
          </div>
        ) : (
          events.map((event) => {
            const canAccessEvent = isMember || canManage;
            const registration = registrations[event.id];

            const eventCard = (
              <div
                key={event.id}
                className={canAccessEvent ? "p-4 hover:bg-muted/50 transition-colors" : "p-4"}
              >
                <div className="flex items-start gap-4">
                  <Calendar className={`h-6 w-6 mt-1 flex-shrink-0 ${canAccessEvent ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${!canAccessEvent ? "text-muted-foreground" : ""}`}>
                          {event.title}
                        </h4>
                        {!canAccessEvent && (
                          <span title="Join this cluster to access event details">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </span>
                        )}
                      </div>
                      <Badge variant={event.status === "active" ? "default" :
                                    event.status === "completed" ? "secondary" :
                                    event.status === "cancelled" ? "destructive" : "outline"}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(event.start_date).toLocaleDateString()}{' '}
                          {new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location || "TBA"}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span>{event.attendees_count} attendees</span>
                      </div>

                      {canAccessEvent && (
                        <div className="flex items-center gap-1">
                          {registration?.status === "registered" ? (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <UserCheck className="h-4 w-4" />
                              <span className="text-xs font-medium">Registered</span>
                            </div>
                          ) : registration?.status === "cancelled" ? (
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <UserX className="h-4 w-4" />
                              <span className="text-xs font-medium">Cancelled</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Organized by: {event.organizer_name}
                    </div>

                    {!canAccessEvent && (
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        Join this cluster to access event details and register
                      </p>
                    )}

                    {/* Register button for members */}
                    {canAccessEvent && (
                      <div className="mt-3">
                        {registration?.status === "registered" ? (
                          <Button size="sm" variant="secondary" disabled>
                            Already Registered
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegisterClick(event.id, event.title);
                            }}
                            disabled={registering[event.id]}
                          >
                            {registering[event.id] ? "Registering..." : "Register"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );

            return canAccessEvent ? (
              <Link href={`/events/${event.slug}`} key={event.slug}>
                {eventCard}
              </Link>
            ) : (
              <div className="opacity-75" key={event.slug}>
                {eventCard}
              </div>
            );
          })
        )}
      </div>

      {/* Registration Confirmation Dialog */}
      <AlertDialog open={registerDialogOpen !== null} onOpenChange={() => setRegisterDialogOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Register for {selectedEvent?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to register for this event. Please confirm your registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegister}>
              Confirm Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Registration Success Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={() => setSuccessDialogOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registration Successful!</AlertDialogTitle>
            <AlertDialogDescription>
              You have successfully registered for {selectedEvent?.title}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessDialogOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
