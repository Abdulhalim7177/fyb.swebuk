"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toggleBlogLike } from "@/lib/supabase/blog-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BlogLikeButtonProps {
  blogId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function BlogLikeButton({
  blogId,
  initialLiked,
  initialCount,
}: BlogLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    setLoading(true);

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const result = await toggleBlogLike(blogId);

      if (!result.success) {
        // Revert on error
        setLiked(liked);
        setCount(count);

        if (result.error === "Not authenticated") {
          toast.error("Please sign in to like posts");
        } else {
          toast.error(result.error || "Failed to update like");
        }
      }
    } catch (error) {
      // Revert on error
      setLiked(liked);
      setCount(count);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className={cn(
        "gap-2",
        liked && "text-red-500 hover:text-red-600"
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all",
          liked && "fill-current"
        )}
      />
      <span>{count}</span>
    </Button>
  );
}
