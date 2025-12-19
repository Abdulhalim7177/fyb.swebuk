"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, LogIn, Loader2, Users } from "lucide-react";
import { toggleBlogLike, getBlogLikes, type BlogLikeUser } from "@/lib/supabase/blog-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

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
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [likes, setLikes] = useState<BlogLikeUser[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

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
          setShowLoginDialog(true);
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

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleShowLikes = async () => {
    if (count === 0) return;

    setShowLikesDialog(true);
    setLoadingLikes(true);

    try {
      const likesData = await getBlogLikes(blogId);
      setLikes(likesData);
    } catch (error) {
      toast.error("Failed to load likes");
    } finally {
      setLoadingLikes(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
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
        </Button>

        {/* Clickable count to show who liked */}
        <button
          onClick={handleShowLikes}
          disabled={count === 0}
          className={cn(
            "text-sm font-medium transition-colors",
            count > 0
              ? "hover:text-primary hover:underline cursor-pointer"
              : "text-muted-foreground cursor-default"
          )}
        >
          {count} {count === 1 ? "like" : "likes"}
        </button>
      </div>

      {/* Login Required Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign in required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in to like posts. Join our community to engage with content and share your thoughts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogin}>
              Sign in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Who Liked Dialog */}
      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              Liked by
            </DialogTitle>
          </DialogHeader>

          {loadingLikes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : likes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No likes yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {likes.map((like) => (
                  <div
                    key={like.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={like.user_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {like.user_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {like.user_name || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {like.user_role || "Member"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(like.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
