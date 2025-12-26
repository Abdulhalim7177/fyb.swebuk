"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Folder, ArrowLeft, Eye, EyeOff, Github, Globe, Plus, X, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Cluster {
  id: string;
  name: string;
  description: string;
  status: string;
  lead_id: string | null;
  deputy_id: string | null;
  staff_manager_id: string | null;
}

interface User {
  id: string;
  role: string;
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

export default function CreateClusterProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clusterIdParam = searchParams.get('cluster_id');

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    repository_url: "",
    demo_url: "",
    is_public: true,
    tags: [] as string[],
  });

  const [currentTag, setCurrentTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get user info
        const { user, role } = await getUser();
        setUser({ id: user.id, role: role });
        setUserRole(role);

        // If cluster_id is provided in URL, fetch cluster details
        if (clusterIdParam) {
          const supabase = createClient();
          const { data: clusterData, error: clusterError } = await supabase
            .from("clusters")
            .select("*")
            .eq("id", clusterIdParam)
            .single();

          if (clusterError || !clusterData) {
            setError("Cluster not found");
            return;
          }

          setCluster(clusterData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clusterIdParam]);

  const canCreate = userRole === 'admin' ||
                   userRole === 'staff' ||
                   cluster?.lead_id === user?.id ||
                   cluster?.deputy_id === user?.id ||
                   cluster?.staff_manager_id === user?.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_public: checked }));
  };

  const handleAddTag = () => {
    const tag = currentTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !cluster?.id) {
      toast.error("Required data is missing");
      return;
    }

    try {
      setSubmitting(true);
      const supabase = createClient();

      // Create the project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: formData.name,
          description: formData.description,
          type: "cluster",
          visibility: formData.is_public ? "public" : "private",
          status: "active",
          owner_id: user.id,
          cluster_id: cluster.id,
          repository_url: formData.repository_url || null,
          demo_url: formData.demo_url || null,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Add tags if any
      if (formData.tags.length > 0 && projectData) {
        const tagInserts = formData.tags.map(tag => ({
          project_id: projectData.id,
          tag: tag
        }));

        const { error: tagError } = await supabase
          .from("project_tags")
          .insert(tagInserts);

        if (tagError) console.error("Error adding tags:", tagError);
      }

      toast.success("Cluster project created successfully!");
      router.push(`/dashboard/projects/${projectData.id}`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/30 max-w-md">
          <p className="text-destructive">{error}</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/clusters")}
          >
            Back to Clusters
          </Button>
        </div>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/30 max-w-md">
          <p className="text-destructive">You don't have permission to create a project for this cluster</p>
          <Button
            className="mt-4"
            onClick={() => cluster ? router.push(`/dashboard/clusters/${cluster.id}`) : router.push("/dashboard/clusters")}
          >
            Back to Cluster
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => cluster ? router.push(`/dashboard/clusters/${cluster.id}`) : router.push("/dashboard/clusters")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cluster
        </Button>
        <div className="flex-1" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-6 w-6 text-primary" />
            Create New Cluster Project
          </CardTitle>
          <CardDescription>
            {cluster ? `Create a new project for ${cluster.name}` : "Create a new cluster project"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Web Development Platform"
                className="border-2 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this project is about, its goals, and technologies used..."
                className="border-2 focus:border-primary focus:ring-primary/20 resize-none"
                rows={5}
                required
              />
            </div>

            {/* Links Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="repository_url" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  Repository URL
                </Label>
                <Input
                  id="repository_url"
                  name="repository_url"
                  value={formData.repository_url}
                  onChange={handleChange}
                  placeholder="https://github.com/username/repo"
                  className="border-2 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="demo_url" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Demo URL
                </Label>
                <Input
                  id="demo_url"
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleChange}
                  placeholder="https://your-demo-url.com"
                  className="border-2 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-muted/30">
              <div className="space-y-1">
                <Label htmlFor="is_public" className="text-sm font-semibold flex items-center gap-2 cursor-pointer">
                  {formData.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Public Visibility
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.is_public
                    ? "Anyone can view this project"
                    : "Only cluster members can view this project"}
                </p>
              </div>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={handleToggleChange}
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Add a tag (e.g., React, TypeScript)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!currentTag.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-2">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => cluster ? router.push(`/dashboard/clusters/${cluster.id}`) : router.push("/dashboard/clusters")}
                className="border-2 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || !formData.name || !formData.description}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                {submitting ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
