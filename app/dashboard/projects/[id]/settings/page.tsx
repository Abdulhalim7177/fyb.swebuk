"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Save, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { AddProjectMemberDialog } from "@/components/projects/add-project-member-dialog";

interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  status: string;
  owner_id: string;
  repository_url: string | null;
  demo_url: string | null;
  tags: string[] | null;
}

async function getUser() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    return { user, role: user.user_metadata?.role || "student" };
  }

  return { user, role: profileData.role || 'student' };
}

export default function ProjectSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public",
    status: "active",
    repository_url: "",
    demo_url: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { user, role } = await getUser();
        setUserRole(role);
        setUserId(user.id);

        const { id } = await params;
        const supabase = createClient();
        const { data: projectData, error } = await supabase
          .from("detailed_projects")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !projectData) {
          toast.error("Project not found");
          router.push("/dashboard/projects");
          return;
        }

        // Check if user can manage this project
        if (projectData.owner_id !== user.id && role !== 'admin') {
          toast.error("You don't have permission to edit this project");
          router.push(`/dashboard/projects/${id}`);
          return;
        }

        setProject(projectData);
        setFormData({
          name: projectData.name,
          description: projectData.description,
          visibility: projectData.visibility,
          status: projectData.status,
          repository_url: projectData.repository_url || "",
          demo_url: projectData.demo_url || "",
        });
        setTags(projectData.tags || []);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Failed to load project");
        router.push("/dashboard/projects");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params, router]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();

      // Update project
      const { error: updateError } = await supabase
        .from("projects")
        .update({
          name: formData.name,
          description: formData.description,
          visibility: formData.visibility,
          status: formData.status,
          repository_url: formData.repository_url || null,
          demo_url: formData.demo_url || null,
        })
        .eq("id", project!.id);

      if (updateError) throw updateError;

      // Update tags - delete old and insert new
      const { error: deleteTagsError } = await supabase
        .from("project_tags")
        .delete()
        .eq("project_id", project!.id);

      if (deleteTagsError) throw deleteTagsError;

      if (tags.length > 0) {
        const tagInserts = tags.map((tag) => ({
          project_id: project!.id,
          tag: tag,
        }));

        const { error: tagsError } = await supabase
          .from("project_tags")
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast.success("Project updated successfully!");
      router.push(`/dashboard/projects/${project!.id}`);
    } catch (error: any) {
      console.error("Error updating project:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      toast.error("Failed to update project: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project!.id);

      if (error) throw error;

      toast.success("Project deleted successfully");
      router.push("/dashboard/projects");
    } catch (error: any) {
      console.error("Error deleting project:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      toast.error("Failed to delete project: " + errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading project settings...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
          <p className="text-muted-foreground">
            Manage your project settings and information
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/projects/${project.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your project's basic details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {project.type === "personal" && (
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) =>
                      setFormData({ ...formData, visibility: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>Project Links</CardTitle>
            <CardDescription>
              Add links to your project repository and demo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repository_url">Repository URL</Label>
              <Input
                id="repository_url"
                type="url"
                placeholder="https://github.com/username/repo"
                value={formData.repository_url}
                onChange={(e) =>
                  setFormData({ ...formData, repository_url: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demo_url">Demo/Live URL</Label>
              <Input
                id="demo_url"
                type="url"
                placeholder="https://demo.example.com"
                value={formData.demo_url}
                onChange={(e) =>
                  setFormData({ ...formData, demo_url: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Technologies/Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Technologies</CardTitle>
            <CardDescription>
              Add or remove technologies used in this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="React, Node.js, TypeScript..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Members Section (Admin/Owner only, Cluster projects only) */}
        {project.type === "cluster" && (userRole === "admin" || project.owner_id === userId) && (
          <Card>
            <CardHeader>
              <CardTitle>Project Members</CardTitle>
              <CardDescription>
                Directly add students or staff to this cluster project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddProjectMemberDialog
                projectId={project.id}
                projectType={project.type}
                onMemberAdded={() => {
                  setRefreshKey(prev => prev + 1);
                  toast.success("You can view the member in the project details page");
                }}
              />
              <p className="text-sm text-muted-foreground mt-4">
                Members added here will be automatically approved and can start contributing to the project immediately.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  project and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
