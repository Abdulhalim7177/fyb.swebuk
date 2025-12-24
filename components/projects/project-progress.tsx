"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Target, Loader2, CheckCircle2, Clock, AlertCircle, Ban, Calendar as CalendarIcon, Trash2, Activity, Users, FileText, MessageSquare, UserPlus, UserMinus } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ProjectProgress {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "blocked";
  progress_percentage: number;
  created_by: string;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  creator_name: string;
  creator_avatar: string | null;
  assignee_name: string | null;
  assignee_avatar: string | null;
}

interface ProjectProgressProps {
  projectId: string;
  canManage: boolean;
  currentUserId: string;
  projectMembers: Array<{ user_id: string; full_name: string; avatar_url: string | null }>;
}

export function ProjectProgress({ projectId, canManage, currentUserId, projectMembers }: ProjectProgressProps) {
  const [progressItems, setProgressItems] = useState<ProjectProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectProgress | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as ProjectProgress["status"],
    progress_percentage: 0,
    assigned_to: "",
    due_date: "",
  });

  useEffect(() => {
    fetchProgressItems();
  }, [projectId]);

  const fetchProgressItems = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("project_progress")
        .select(`
          *,
          creator:created_by (full_name, avatar_url),
          assignee:assigned_to (full_name, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedItems = data.map((item: any) => ({
        ...item,
        creator_name: item.creator?.full_name || "Unknown User",
        creator_avatar: item.creator?.avatar_url || null,
        assignee_name: item.assignee?.full_name || null,
        assignee_avatar: item.assignee?.avatar_url || null,
      }));

      setProgressItems(formattedItems);
    } catch (error: any) {
      console.error("Error fetching progress items:", error);
      toast.error("Failed to load progress items");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createClient();

      const dataToSubmit = {
        project_id: projectId,
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        progress_percentage: formData.progress_percentage,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
        ...(editingItem ? {} : { created_by: currentUserId }),
      };

      if (editingItem) {
        const { error } = await supabase
          .from("project_progress")
          .update(dataToSubmit)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Progress item updated successfully");
      } else {
        const { error } = await supabase
          .from("project_progress")
          .insert(dataToSubmit);

        if (error) throw error;
        toast.success("Progress item created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchProgressItems();
    } catch (error: any) {
      console.error("Error saving progress item:", error);
      toast.error("Failed to save progress item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this progress item?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_progress")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Progress item deleted successfully");
      fetchProgressItems();
    } catch (error: any) {
      console.error("Error deleting progress item:", error);
      toast.error("Failed to delete progress item");
    }
  };

  const handleEdit = (item: ProjectProgress) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      status: item.status,
      progress_percentage: item.progress_percentage,
      assigned_to: item.assigned_to || "",
      due_date: item.due_date ? format(new Date(item.due_date), "yyyy-MM-dd") : "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "pending",
      progress_percentage: 0,
      assigned_to: "",
      due_date: "",
    });
    setEditingItem(null);
  };

  const getStatusIcon = (status: ProjectProgress["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "blocked":
        return <Ban className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusColor = (status: ProjectProgress["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-blue-500";
      case "blocked":
        return "bg-red-500";
      default:
        return "bg-amber-500";
    }
  };

  const calculateOverallProgress = () => {
    if (progressItems.length === 0) return 0;
    const total = progressItems.reduce((sum, item) => sum + item.progress_percentage, 0);
    return Math.round(total / progressItems.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Progress</span>
            <span className="text-2xl font-bold">{calculateOverallProgress()}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={calculateOverallProgress()} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{progressItems.filter(i => i.status === "completed").length} completed</span>
            <span>{progressItems.filter(i => i.status === "in_progress").length} in progress</span>
            <span>{progressItems.filter(i => i.status === "pending").length} pending</span>
          </div>
        </CardContent>
      </Card>

      {/* Add New Button */}
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Progress Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Progress Item" : "Add Progress Item"}</DialogTitle>
                <DialogDescription>
                  Track milestones and progress for your project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: ProjectProgress["status"]) =>
                        setFormData({ ...formData, status: value })
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="progress">Progress (%)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress_percentage}
                      onChange={(e) =>
                        setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })
                      }
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Select
                      value={formData.assigned_to}
                      onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {projectMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
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
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingItem ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingItem ? "Update" : "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Progress Items */}
      {progressItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No progress items yet</p>
            <p className="text-sm text-muted-foreground">
              {canManage ? "Add your first milestone to track progress" : "Progress items will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {progressItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge className={getStatusColor(item.status) + " text-white"}>
                        {item.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground pl-8">{item.description}</p>
                    )}
                    <div className="pl-8">
                      <Progress value={item.progress_percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{item.progress_percentage}% complete</p>
                    </div>
                    <div className="flex items-center gap-4 pl-8 text-sm text-muted-foreground">
                      {item.assignee_name && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={item.assignee_avatar || undefined} />
                            <AvatarFallback className="text-xs">
                              {item.assignee_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{item.assignee_name}</span>
                        </div>
                      )}
                      {item.due_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>Due {format(new Date(item.due_date), "MMM dd, yyyy")}</span>
                        </div>
                      )}
                      <span>Created {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
