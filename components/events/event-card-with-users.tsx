import { getEventRegisteredUsers } from "@/lib/supabase/event-actions";
import { EventCard } from "./event-card";
import type { DetailedEvent } from "@/lib/constants/events";

interface EventCardWithUsersProps {
  event: DetailedEvent;
  variant?: "default" | "compact" | "featured";
  showOrganizer?: boolean;
}

export async function EventCardWithUsers({
  event,
  variant = "default",
  showOrganizer = true,
}: EventCardWithUsersProps) {
  const registeredUsers = await getEventRegisteredUsers(event.id, 5);

  return (
    <EventCard
      event={event}
      variant={variant}
      showOrganizer={showOrganizer}
      registeredUsers={registeredUsers}
    />
  );
}
