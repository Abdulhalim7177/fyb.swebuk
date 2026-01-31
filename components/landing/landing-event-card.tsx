import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import type { DetailedEvent } from "@/lib/constants/events";
import { getEventTypeLabel, getEventTypeColorClass, getEventTimeStatus, formatEventDateRange } from "@/lib/constants/events";
import { RegisteredUsersAvatars } from "@/components/events/registered-users-avatars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LandingEventCardProps {
  event: DetailedEvent;
}

export function LandingEventCard({ event }: LandingEventCardProps) {
  const eventTypeLabel = getEventTypeLabel(event.event_type);
  const eventTypeColor = getEventTypeColorClass(event.event_type);
  const timeStatus = getEventTimeStatus(event.start_date, event.end_date);
  
  const formattedDate = new Date(event.start_date).toLocaleDateString("en-US", {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = new Date(event.start_date).toLocaleTimeString("en-US", {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Link href={`/events/${event.slug}`} className="group block h-full">
      <div className="glass-card animate-on-scroll h-full flex flex-col overflow-hidden" suppressHydrationWarning>
        {event.banner_image_url && (
          <div className="relative w-full h-40">
            <Image
              src={event.banner_image_url}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}
        
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${eventTypeColor}`}>
              {eventTypeLabel}
            </span>
            <span className={`font-semibold ${timeStatus.status === 'upcoming' ? 'text-green-500 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {timeStatus.label}
            </span>
          </div>
          
          <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-gradient transition-colors duration-300 flex-grow mt-2">
            {event.title}
          </h4>
          
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 flex-grow">{event.short_description}</p>
          
          <div className="text-sm text-slate-600 dark:text-slate-300 mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{formattedDate} at {formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{event.location_type === 'online' ? 'Online' : event.venue_name || event.location}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={event.organizer_avatar || undefined} alt={event.organizer_name || ""} />
              <AvatarFallback>{event.organizer_name?.charAt(0) || "O"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{event.organizer_name}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <RegisteredUsersAvatars
            users={event.attendees || []}
            totalCount={event.registrations_count}
            size="sm"
            maxDisplay={3}
          />
        </div>
      </div>
    </Link>
  );
}