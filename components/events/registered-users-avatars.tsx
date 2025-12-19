"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface RegisteredUser {
  id: string;
  avatar_url?: string | null;
  full_name?: string | null;
}

interface RegisteredUsersAvatarsProps {
  users: RegisteredUser[];
  maxDisplay?: number;
  totalCount?: number;
  size?: "sm" | "md" | "lg";
}

export function RegisteredUsersAvatars({
  users,
  maxDisplay = 5,
  totalCount,
  size = "md",
}: RegisteredUsersAvatarsProps) {
  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = (totalCount || users.length) - maxDisplay;

  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  const borderSizes = {
    sm: "border-[1.5px]",
    md: "border-2",
    lg: "border-[2.5px]",
  };

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className={`${size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5"}`} />
        <span className="text-sm">No registrations yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <Avatar
            key={user.id}
            className={`${sizeClasses[size]} ${borderSizes[size]} border-background ring-2 ring-background transition-transform hover:scale-110 hover:z-10`}
            style={{ zIndex: displayUsers.length - index }}
          >
            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-medium">
              {user.full_name
                ? user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"}
            </AvatarFallback>
          </Avatar>
        ))}

        {remainingCount > 0 && (
          <Avatar
            className={`${sizeClasses[size]} ${borderSizes[size]} border-background ring-2 ring-background bg-muted`}
            style={{ zIndex: 0 }}
          >
            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {totalCount && totalCount > 0 && (
        <span className="text-sm text-muted-foreground font-medium">
          {totalCount} {totalCount === 1 ? "attendee" : "attendees"}
        </span>
      )}
    </div>
  );
}
