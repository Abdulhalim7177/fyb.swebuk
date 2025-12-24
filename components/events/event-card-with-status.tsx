import { getEventRegisteredUsers } from "@/lib/supabase/event-actions";
import { checkRegistrationStatus } from "@/lib/supabase/event-student-actions";
import { EventCard } from "./event-card";
import type { DetailedEvent } from "@/lib/constants/events";
import { createClient } from "@/lib/supabase/server";

interface EventCardWithStatusProps {
  event: DetailedEvent;
  variant?: "default" | "compact" | "featured";
  showOrganizer?: boolean;
}

export async function EventCardWithStatus({
  event,
  variant = "default",
  showOrganizer = true,
}: EventCardWithStatusProps) {
  // Get registered users
  const registeredUsers = await getEventRegisteredUsers(event.id, 5);

  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { session },
  } = await (supabase.auth as any).getSession();

  let userRegistrationStatus = null;
  let showRegistrationStatus = false;

  if (session) {
    // User is authenticated, check registration status
    showRegistrationStatus = true;
    const regStatus = await checkRegistrationStatus(event.id);
    userRegistrationStatus = regStatus.status;
  }

  return (
    <EventCard
      event={event}
      variant={variant}
      showOrganizer={showOrganizer}
      registeredUsers={registeredUsers}
      userRegistrationStatus={userRegistrationStatus}
      showRegistrationStatus={showRegistrationStatus}
    />
  );
}
