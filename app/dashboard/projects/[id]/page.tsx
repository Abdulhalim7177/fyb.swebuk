"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { toast } from "sonner";
import {
  Users,
  Calendar,
  Settings,
  Plus,
  AlertCircle,
  GitBranch,
  ExternalLink,
  Eye,
  Lock,
  FolderGit2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectMembersList } from "@/components/projects/project-members-list";
import { ProjectRequestsList } from "@/components/projects/project-requests-list";
import Link from "next/link";

interface DetailedProject {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  status: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  owner_avatar: string;
  cluster_id: string | null;
  cluster_name: string | null;
  repository_url: string | null;
  demo_url: string | null;
  members_count: number;
  tags: string[] | null;
  created_at: string;
  started_at: string;
  completed_at: string | null;
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
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return { user, role: user.user_metadata?.role || "student", fullName: user.user_metadata?.full_name || user.email };
  }

  return { user, role: profileData.role || 'student', fullName: profileData.full_name || user.user_metadata?.full_name || user.email };
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<DetailedProject | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userMembershipStatus, setUserMembershipStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get user info
        const { user, role } = await getUser();
        setUser({ id: user.id, role: role });
        setUserRole(role);

        // Get project ID from URL params
        const { id } = await params;
        const projectId = id;

        // Fetch project info
        const supabase = createClient();
        const { data: projectData, error: projectError } = await supabase
          .from("detailed_projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError || !projectData) {
          setError("Project not found");
          return;
        }

        setProject(projectData);

        // Check if user is a member of this project
        if (user.id) {
          const { data: membershipData, error: membershipError } = await supabase
            .from("project_members")
            .select("status")
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .single();

          if (membershipData) {
            setIsMember(true);
            setUserMembershipStatus(membershipData.status);
          } else {
            setIsMember(false);
            setUserMembershipStatus(null);
          }
        }
      } catch (err) {
        console.error("Error fetching project data:", err);
        setError("Failed to load project information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleJoinClick = () => {
    setJoinDialogOpen(true);
  };

  const confirmJoin = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: project!.id,
          user_id: user.id,
          status: "pending",
          role: "member",
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already requested to join this project.");
        } else {
          throw error;
        }
      } else {
        toast.success("Request to join project sent! Wait for approval.");
        setIsMember(true);
        setUserMembershipStatus("pending");
      }
    } catch (error: any) {
      console.error("Error joining project:", error);
      const errorMessage = error?.message || "An unknown error occurred";
      toast.error("Failed to join project: " + errorMessage);
    } finally {
      setJoinDialogOpen(false);
    }
  };

  const handleLeaveClick = () => {
    setLeaveDialogOpen(true);
  };

  const confirmLeave = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", project!.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Successfully left the project");
      setIsMember(false);
      setUserMembershipStatus(null);
      router.refresh ? router.refresh() : window.location.reload();
    } catch (error: any) {
      console.error("Error leaving project:", error);
      toast.error("Failed to leave project: " + error.message);
    } finally {
      setLeaveDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading project information...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/30 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive">Project Not Found</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/projects")}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = project.owner_id === user?.id;
  const canManage = isOwner || userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"}>
              {project.status}
            </Badge>
            <Badge variant={project.type === "cluster" ? "default" : "secondary"}>
              {project.type}
            </Badge>
            {project.visibility === "private" ? (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Eye className="h-3 w-3" />
                Public
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">{project.description}</p>

          {/* Owner Info */}
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.owner_avatar} />
              <AvatarFallback className="text-xs">
                {project.owner_name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              Created by <span className="font-medium">{project.owner_name}</span>
            </span>
            {project.cluster_name && (
              <>
                <span className="text-muted-foreground">•</span>
                <Link href={`/dashboard/clusters/${project.cluster_id}`} className="text-sm text-primary hover:underline">
                  {project.cluster_name}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {project.repository_url && (
            <Button variant="outline" asChild>
              <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                <GitBranch className="mr-2 h-4 w-4" />
                Repository
              </a>
            </Button>
          )}
          {project.demo_url && (
            <Button variant="outline" asChild>
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Demo
              </a>
            </Button>
          )}
          {canManage && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/projects/${project.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          )}
          {!isMember && !isOwner && (
            <Button onClick={handleJoinClick}>
              <Plus className="mr-2 h-4 w-4" />
              Join Project
            </Button>
          )}
          {isMember && userMembershipStatus === "pending" && (
            <Button variant="outline" onClick={handleLeaveClick}>
              Cancel Request
            </Button>
          )}
          {isMember && userMembershipStatus === "approved" && !isOwner && (
            <Button variant="outline" onClick={handleLeaveClick}>
              Leave Project
            </Button>
          )}
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.members_count}</div>
            <p className="text-xs text-muted-foreground">Project contributors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Started</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(project.started_at || project.created_at).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">Project start date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Technologies</CardTitle>
            <FolderGit2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.tags?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Tech stack items</p>
          </CardContent>
        </Card>
      </div>

      {/* Technologies/Tags */}
      {project.tags && project.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Technologies</CardTitle>
            <CardDescription>Tech stack used in this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Members, Requests */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members ({project.members_count})
          </TabsTrigger>
          {canManage && (
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Join Requests
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="members" className="mt-4">
          <ProjectMembersList
            projectId={project.id}
            canManage={canManage}
            currentUserId={user?.id || ""}
          />
        </TabsContent>
        {canManage && (
          <TabsContent value="requests" className="mt-4">
            <ProjectRequestsList
              projectId={project.id}
              canManage={canManage}
              currentUserId={user?.id || ""}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Join Dialog */}
      <AlertDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request to Join Project?</AlertDialogTitle>
            <AlertDialogDescription>
              A request will be sent to the project owner for approval. You will be notified once your request has been reviewed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmJoin}>
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove you from the project. If you have a pending request, it will be cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} className="bg-destructive hover:bg-destructive/90">
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
