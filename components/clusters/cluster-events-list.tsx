"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ClusterEvent {
  id: string;
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
}

export function ClusterEventsList({ clusterId, userRole }: ClusterEventsListProps) {
  const [events, setEvents] = useState<ClusterEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Fetch events associated with this cluster
        try {
          const { data, error } = await supabase
            .from("events")
            .select(`
              id,
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
            .order("start_date", { ascending: true });

          if (error) throw error;

          if (data) {
            // For each event, also fetch the number of attendees
            const eventsWithAttendees = await Promise.all(
              data.map(async (event: any) => {
                // Count event attendees
                const { count: attendeesCount, error: attendeeError } = await supabase
                  .from("event_attendees")
                  .select("*", { count: "exact", head: true })
                  .eq("event_id", event.id);

                if (attendeeError) {
                  console.error("Error counting attendees for event:", event.id, attendeeError);
                }

                return {
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  start_date: event.start_date,
                  end_date: event.end_date,
                  location: event.location,
                  status: event.status,
                  created_at: event.created_at,
                  cluster_id: event.cluster_id,
                  organizer_name: event.profiles?.full_name || 'Unknown',
                  attendees_count: attendeesCount || 0
                };
              })
            );

            setEvents(eventsWithAttendees);
          }
        } catch (error: any) {
          console.error("Error fetching cluster events:", error);
          // If the events table doesn't exist, use mock data
          if (error.code === '42P01' || error.message?.includes('Could not find the table')) {
            // Use mock data for events
            const mockEvents: ClusterEvent[] = [
              {
                id: '1',
                title: 'Cluster Kickoff Meeting',
                description: 'Let\'s meet to discuss the goals and roadmap for this cluster.',
                start_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                end_date: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
                location: 'Online',
                status: 'active',
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                cluster_id: clusterId,
                organizer_name: 'System Admin',
                attendees_count: 12
              },
              {
                id: '2',
                title: 'Project Planning Session',
                description: 'Planning session for the upcoming projects in the cluster.',
                start_date: new Date(Date.now() + 172800000).toISOString(), // In 2 days
                end_date: new Date(Date.now() + 172800000 + 3600000).toISOString(), // In 2 days + 1 hour
                location: 'Room 204, Main Building',
                status: 'active',
                created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                cluster_id: clusterId,
                organizer_name: 'System Admin',
                attendees_count: 8
              }
            ];
            setEvents(mockEvents);
          } else {
            toast.error("Failed to load cluster events: " + error.message);
          }
        }
      } catch (error: any) {
        console.error("Error fetching cluster events:", error);
        console.error("Detailed error:", error.message, error.details, error.hint);
      } finally {
        setLoading(false);
      }
    };

    if (clusterId) {
      fetchEvents();
    }
  }, [clusterId]);

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
        <p className="text-sm text-muted-foreground">Upcoming and past events organized by this cluster</p>
      </div>
      <div className="divide-y">
        {events.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No events scheduled for this cluster yet.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="p-4">
              <div className="flex items-start gap-4">
                <Calendar className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">{event.title}</h4>
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
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Organized by: {event.organizer_name}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}