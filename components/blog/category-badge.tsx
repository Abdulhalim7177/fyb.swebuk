"use client";

import { Badge } from "@/components/ui/badge";
import { getCategoryColorClass, getCategoryLabel, type BlogCategory } from "@/lib/constants/blog";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: BlogCategory;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function CategoryBadge({ category, size = "default", className }: CategoryBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    default: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <Badge
      variant="secondary"
      className={cn(getCategoryColorClass(category), sizeClasses[size], "font-medium", className)}
    >
      {getCategoryLabel(category)}
    </Badge>
  );
}
