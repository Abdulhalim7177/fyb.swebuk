"use client";

import { useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { postBlogComment, deleteBlogComment } from "@/lib/supabase/blog-actions";
import type { DetailedBlogComment } from "@/lib/constants/blog";
import { MessageCircle, Reply, Trash2, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface BlogCommentsSectionProps {
  blogId: string;
  initialComments: DetailedBlogComment[];
  currentUserId?: string;
}

// Format time helper
const formatTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// CommentItem component extracted outside to prevent re-renders
interface CommentItemProps {
  comment: DetailedBlogComment;
  isReply?: boolean;
  currentUserId?: string;
  replyingTo: string | null;
  replyContent: string;
  submitting: boolean;
  onReplyContentChange: (content: string) => void;
  onToggleReply: (commentId: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  onDeleteComment: (commentId: string) => void;
}

function CommentItem({
  comment,
  isReply = false,
  currentUserId,
  replyingTo,
  replyContent,
  submitting,
  onReplyContentChange,
  onToggleReply,
  onSubmitReply,
  onCancelReply,
  onDeleteComment,
}: CommentItemProps) {
  const canDelete = currentUserId && currentUserId === comment.user_id;

  return (
    <div className={`flex gap-3 ${isReply ? "ml-12 mt-4" : ""}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user_avatar || undefined} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {comment.user_name?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.user_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(comment.created_at)}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                onClick={() => onDeleteComment(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-sm">{comment.content}</p>
        </div>
        {!isReply && (
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onToggleReply(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
        )}

        {/* Reply input */}
        {replyingTo === comment.id && (
          <div className="mt-3 flex gap-2">
            <Textarea
              value={replyContent}
              onChange={(e) => onReplyContentChange(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="text-sm"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                onClick={() => onSubmitReply(comment.id)}
                disabled={submitting || !replyContent.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Reply"
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelReply}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4 mt-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply
                currentUserId={currentUserId}
                replyingTo={replyingTo}
                replyContent={replyContent}
                submitting={submitting}
                onReplyContentChange={onReplyContentChange}
                onToggleReply={onToggleReply}
                onSubmitReply={onSubmitReply}
                onCancelReply={onCancelReply}
                onDeleteComment={onDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function BlogCommentsSection({
  blogId,
  initialComments,
  currentUserId,
}: BlogCommentsSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await postBlogComment(blogId, newComment);

      if (result.success) {
        toast.success("Comment posted");
        setNewComment("");
        window.location.reload();
      } else {
        if (result.error === "Not authenticated") {
          setShowLoginDialog(true);
        } else {
          toast.error(result.error || "Failed to post comment");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = useCallback(async (parentId: string) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const result = await postBlogComment(blogId, replyContent, parentId);

      if (result.success) {
        toast.success("Reply posted");
        setReplyContent("");
        setReplyingTo(null);
        window.location.reload();
      } else {
        if (result.error === "Not authenticated") {
          setShowLoginDialog(true);
        } else {
          toast.error(result.error || "Failed to post reply");
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  }, [blogId, replyContent]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const result = await deleteBlogComment(commentId);

      if (result.success) {
        toast.success("Comment deleted");
        setComments(prev => {
          // Remove from top-level comments
          const filtered = prev.filter((c) => c.id !== commentId);
          // Also remove from nested replies
          return filtered.map(c => ({
            ...c,
            replies: c.replies?.filter(r => r.id !== commentId)
          }));
        });
      } else {
        toast.error(result.error || "Failed to delete comment");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }, []);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleToggleReply = useCallback((commentId: string) => {
    setReplyingTo(prev => prev === commentId ? null : commentId);
    setReplyContent("");
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
    setReplyContent("");
  }, []);

  const handleReplyContentChange = useCallback((content: string) => {
    setReplyContent(content);
  }, []);

  return (
    <>
      <div className="space-y-6">
        {/* New Comment Form */}
        <Card>
          <CardContent className="pt-6">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                Post Comment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="group">
                <CommentItem
                  comment={comment}
                  currentUserId={currentUserId}
                  replyingTo={replyingTo}
                  replyContent={replyContent}
                  submitting={submitting}
                  onReplyContentChange={handleReplyContentChange}
                  onToggleReply={handleToggleReply}
                  onSubmitReply={handleSubmitReply}
                  onCancelReply={handleCancelReply}
                  onDeleteComment={handleDeleteComment}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login Dialog */}
      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign in required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in to comment on posts. Join our community to engage with content and share your thoughts.
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
    </>
  );
}
