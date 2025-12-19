"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusColorClass, getStatusLabel, type BlogStatus } from "@/lib/constants/blog";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: BlogStatus;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "default", className }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    default: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(getStatusColorClass(status), sizeClasses[size], "font-medium", className)}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
