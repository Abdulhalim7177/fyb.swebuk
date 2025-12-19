"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Clock, Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RegisteredUsersAvatars } from "@/components/events/registered-users-avatars";
import type { DetailedEvent } from "@/lib/constants/events";
import {
  getEventTypeLabel,
  getEventTypeColorClass,
  getEventStatusColorClass,
  getEventTimeStatus,
  formatEventDateRange,
  getLocationTypeLabel,
} from "@/lib/constants/events";

interface EventCardProps {
  event: DetailedEvent;
  variant?: "default" | "compact" | "featured";
  showOrganizer?: boolean;
  registeredUsers?: Array<{ id: string; avatar_url: string | null; full_name: string | null }>;
}

export function EventCard({
  event,
  variant = "default",
  showOrganizer = true,
  registeredUsers = [],
}: EventCardProps) {
  const timeStatus = getEventTimeStatus(event.start_date, event.end_date);

  if (variant === "compact") {
    return (
      <Link href={`/events/${event.slug}`}>
        <Card className="group hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {new Date(event.start_date).getDate()}
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  {new Date(event.start_date).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getEventTypeColorClass(event.event_type)}`}
                  >
                    {getEventTypeLabel(event.event_type)}
                  </Badge>
                  {timeStatus.status === "ongoing" && (
                    <Badge variant="default" className="text-xs bg-green-500">
                      Live
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(event.start_date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {getLocationTypeLabel(event.location_type)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/events/${event.slug}`}>
        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="relative h-64">
            {event.banner_image_url ? (
              <Image
                src={event.banner_image_url}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className={getEventTypeColorClass(event.event_type)}>
                {getEventTypeLabel(event.event_type)}
              </Badge>
              {timeStatus.status === "ongoing" && (
                <Badge className="bg-green-500 text-white">Live Now</Badge>
              )}
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
              <p className="text-sm opacity-90 line-clamp-2">
                {event.short_description}
              </p>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatEventDateRange(event.start_date, event.end_date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location || getLocationTypeLabel(event.location_type)}
              </span>
              <RegisteredUsersAvatars
                users={registeredUsers}
                maxDisplay={4}
                totalCount={event.registrations_count}
                size="sm"
              />
              {event.average_rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {event.average_rating.toFixed(1)}
                </span>
              )}
            </div>
          </CardContent>
          {showOrganizer && event.organizer_name && (
            <CardFooter className="p-4 pt-0 border-t">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={event.organizer_avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {event.organizer_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  Organized by {event.organizer_name}
                </span>
              </div>
            </CardFooter>
          )}
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/events/${event.slug}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col border-2 hover:border-primary/20">
        <div className="relative h-48">
          {event.banner_image_url ? (
            <Image
              src={event.banner_image_url}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background relative">
              <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge
              variant="secondary"
              className={getEventTypeColorClass(event.event_type)}
            >
              {getEventTypeLabel(event.event_type)}
            </Badge>
          </div>
          {timeStatus.status === "ongoing" && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white animate-pulse">
                Live
              </Badge>
            </div>
          )}
          {event.is_full && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="destructive">Full</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 flex-1">
          <div className="mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                timeStatus.status === "upcoming"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : timeStatus.status === "ongoing"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {timeStatus.label}
            </span>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {event.short_description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {event.short_description}
            </p>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {new Date(event.start_date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {" at "}
                {new Date(event.start_date).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {event.venue_name || event.location || getLocationTypeLabel(event.location_type)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <RegisteredUsersAvatars
                users={registeredUsers}
                maxDisplay={3}
                totalCount={event.registrations_count}
                size="sm"
              />
              {event.average_rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {event.average_rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </CardContent>

        {showOrganizer && event.organizer_name && (
          <CardFooter className="p-4 pt-0">
            <div className="flex items-center gap-2 w-full">
              <Avatar className="h-6 w-6">
                <AvatarImage src={event.organizer_avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {event.organizer_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">
                {event.organizer_name}
              </span>
              {event.cluster_name && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {event.cluster_name}
                </Badge>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
