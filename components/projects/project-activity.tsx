"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Activity,
  Target,
  Users,
  FileText,
  MessageSquare,
  UserPlus,
  UserMinus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Ban,
  Upload,
  Loader2,
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "progress" | "member" | "file" | "chat" | "project";
  action: string;
  description: string;
  user_name: string;
  user_avatar: string | null;
  created_at: string;
  metadata?: any;
}

interface ProjectActivityProps {
  projectId: string;
  projectName: string;
  currentUserId: string;
  isOwner: boolean;
  projectOwnerId: string;
  onTabChange?: (tab: string) => void;
}

export function ProjectActivity({ projectId, projectName, currentUserId, isOwner, projectOwnerId, onTabChange }: ProjectActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [progressItems, setProgressItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [milestoneToToggle, setMilestoneToToggle] = useState<{ id: string; status: string; title: string } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchAllActivities();
  }, [projectId]);

  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch progress items
      const { data: progressData } = await supabase
        .from("project_progress")
        .select(`
          *,
          creator:created_by (full_name, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (progressData) {
        setProgressItems(progressData);
      }

      // Fetch project members activity
      const { data: membersData } = await supabase
        .from("project_members")
        .select(`
          *,
          user:user_id (full_name, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("joined_at", { ascending: false });

      // Fetch project files
      const { data: filesData } = await supabase
        .from("project_files")
        .select(`
          *,
          uploader:uploaded_by (full_name, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);

      // Fetch recent chat messages count
      const { count: chatCount } = await supabase
        .from("project_chat")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Combine all activities
      const allActivities: ActivityItem[] = [];

      // Progress activities
      progressData?.forEach((item: any) => {
        allActivities.push({
          id: `progress-${item.id}`,
          type: "progress",
          action: item.status === "completed" ? "completed milestone" : "updated progress",
          description: item.title,
          user_name: item.creator?.full_name || "Unknown User",
          user_avatar: item.creator?.avatar_url || null,
          created_at: item.updated_at || item.created_at,
          metadata: {
            status: item.status,
            progress: item.progress_percentage,
          },
        });
      });

      // Member activities
      membersData?.forEach((item: any) => {
        if (item.status === "approved") {
          allActivities.push({
            id: `member-${item.id}`,
            type: "member",
            action: "joined project",
            description: `${item.user?.full_name || "A user"} joined the project`,
            user_name: item.user?.full_name || "Unknown User",
            user_avatar: item.user?.avatar_url || null,
            created_at: item.approved_at || item.joined_at,
            metadata: { role: item.role },
          });
        }
      });

      // File activities
      filesData?.forEach((item: any) => {
        allActivities.push({
          id: `file-${item.id}`,
          type: "file",
          action: "uploaded file",
          description: item.file_name,
          user_name: item.uploader?.full_name || "Unknown User",
          user_avatar: item.uploader?.avatar_url || null,
          created_at: item.created_at,
          metadata: { fileType: item.file_type },
        });
      });

      // Sort by date
      allActivities.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(allActivities);
    } catch (error: any) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "progress":
        return <Target className="h-5 w-5 text-blue-500" />;
      case "member":
        return <Users className="h-5 w-5 text-green-500" />;
      case "file":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "chat":
        return <MessageSquare className="h-5 w-5 text-amber-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProgressStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "blocked":
        return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const calculateOverallProgress = () => {
    if (progressItems.length === 0) return 0;
    const completedCount = progressItems.filter(item => item.status === "completed").length;
    return Math.round((completedCount / progressItems.length) * 100);
  };

  const handleCreateMilestone = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a milestone title");
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createClient();

      const dataToSubmit = {
        project_id: projectId,
        title: formData.title,
        description: formData.description || null,
        status: "pending",
        progress_percentage: 0,
        created_by: currentUserId,
      };

      if (editingMilestone) {
        const { error } = await supabase
          .from("project_progress")
          .update(dataToSubmit)
          .eq("id", editingMilestone.id);

        if (error) throw error;
        toast.success("Milestone updated successfully");
      } else {
        const { error } = await supabase
          .from("project_progress")
          .insert(dataToSubmit);

        if (error) throw error;
        toast.success("Milestone created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchAllActivities();
    } catch (error: any) {
      console.error("Error saving milestone:", error);
      toast.error("Failed to save milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMilestoneComplete = async () => {
    if (!milestoneToToggle) return;

    try {
      const supabase = createClient();
      const newStatus = milestoneToToggle.status === "completed" ? "pending" : "completed";
      const newProgress = newStatus === "completed" ? 100 : 0;

      const { error } = await supabase
        .from("project_progress")
        .update({
          status: newStatus,
          progress_percentage: newProgress,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", milestoneToToggle.id);

      if (error) throw error;

      toast.success(`Milestone marked as ${newStatus}`);
      setConfirmDialogOpen(false);
      setMilestoneToToggle(null);
      fetchAllActivities();
    } catch (error: any) {
      console.error("Error updating milestone:", error);
      toast.error("Failed to update milestone");
    }
  };

  const openConfirmDialog = (milestoneId: string, currentStatus: string, title: string) => {
    setMilestoneToToggle({ id: milestoneId, status: currentStatus, title });
    setConfirmDialogOpen(true);
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_progress")
        .delete()
        .eq("id", milestoneId);

      if (error) throw error;

      toast.success("Milestone deleted successfully");
      fetchAllActivities();
    } catch (error: any) {
      console.error("Error deleting milestone:", error);
      toast.error("Failed to delete milestone");
    }
  };

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
    });
    setEditingMilestone(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Overview Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">{calculateOverallProgress()}%</div>
            <Progress value={calculateOverallProgress()} className="mt-1.5 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">{progressItems.length}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {progressItems.filter(i => i.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Files Shared
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">
              {activities.filter(a => a.type === "file").length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Uploaded by team
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">
              {activities.filter(a => a.type === "member").length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Collaborating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-4 w-4" />
            Project Activity
          </CardTitle>
          <CardDescription className="text-xs">
            Complete audit trail of all project activities
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-base font-medium">No activities yet</p>
              <p className="text-xs text-muted-foreground">
                Project activities will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full p-1.5 bg-muted">
                        {getActivityIcon(activity.type)}
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-px h-full bg-border mt-1.5" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={activity.user_avatar || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {activity.user_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-xs">
                              {activity.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {activity.action}
                            </span>
                          </div>
                          {activity.type === "file" && onTabChange ? (
                            <button
                              onClick={() => onTabChange("files")}
                              className="text-xs text-primary hover:underline pl-6 cursor-pointer text-left"
                            >
                              {activity.description}
                            </button>
                          ) : (
                            <p className="text-xs text-muted-foreground pl-6">
                              {activity.description}
                            </p>
                          )}
                          {activity.metadata && activity.type === "progress" && (
                            <div className="flex items-center gap-2 pl-6 mt-1">
                              {getProgressStatusIcon(activity.metadata.status)}
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {activity.metadata.status === "completed" ? "Completed" : `${activity.metadata.progress}% progress`}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones Management */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Project Milestones</CardTitle>
              <CardDescription className="text-xs">
                {isOwner
                  ? "Set and track milestones. Progress based on completion."
                  : "Track project milestones"}
              </CardDescription>
            </div>
            {isOwner && (
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add New Milestone"}</DialogTitle>
                    <DialogDescription>
                      Create milestones to track project progress
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Milestone Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Complete user authentication"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add details about this milestone..."
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMilestone} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingMilestone ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        editingMilestone ? "Update" : "Create"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          {progressItems.length === 0 ? (
            <div className="text-center py-6">
              <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-base font-medium">No milestones yet</p>
              <p className="text-xs text-muted-foreground">
                {isOwner ? "Add your first milestone to track progress" : "Milestones will appear here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {progressItems.map((item) => (
                <Card key={item.id} className={item.status === "completed" ? "bg-muted/50" : ""}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center mt-0.5">
                        {isOwner ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openConfirmDialog(item.id, item.status, item.title)}
                          >
                            {item.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                            )}
                          </Button>
                        ) : (
                          getProgressStatusIcon(item.status)
                        )}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {item.title}
                          </h4>
                          {isOwner && (
                            <div className="flex gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditMilestone(item)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteMilestone(item.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge variant={item.status === "completed" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                            {item.status === "completed" ? "Completed" : "Pending"}
                          </Badge>
                          <span>Created {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Milestone Status Change */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {milestoneToToggle?.status === "completed" ? "Mark as Pending?" : "Mark as Completed?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {milestoneToToggle?.status === "completed" ? (
                <>
                  Are you sure you want to mark <strong>"{milestoneToToggle?.title}"</strong> as pending?
                  <br />
                  This will decrease the overall project progress.
                </>
              ) : (
                <>
                  Are you sure you want to mark <strong>"{milestoneToToggle?.title}"</strong> as completed?
                  <br />
                  This will increase the overall project progress.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMilestoneToToggle(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleMilestoneComplete}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
