"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  FolderGit2,
  FileText,
  Target,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectMembersList } from "@/components/projects/project-members-list";
import { ProjectRequestsList } from "@/components/projects/project-requests-list";
import { ProjectFiles } from "@/components/projects/project-files";
import { ProjectActivity } from "@/components/projects/project-activity";
import { ProjectChat } from "@/components/projects/project-chat";
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
  const [isClusterMember, setIsClusterMember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Array<{ user_id: string; full_name: string; avatar_url: string | null }>>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState("activity");

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

          // Check if user is a cluster member (for cluster projects)
          if (projectData.type === "cluster" && projectData.cluster_id) {
            const { data: clusterMemberData } = await supabase
              .from("cluster_members")
              .select("status")
              .eq("cluster_id", projectData.cluster_id)
              .eq("user_id", user.id)
              .single();

            if (clusterMemberData && clusterMemberData.status === "approved") {
              setIsClusterMember(true);
            }
          }

          // Fetch current user profile for chat
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .single();

          if (profileData) {
            setCurrentUserProfile(profileData);
          }
        }

        // Fetch project members for progress component
        const { data: membersData } = await supabase
          .from("detailed_project_members")
          .select("user_id, full_name, avatar_url")
          .eq("project_id", projectId)
          .eq("status", "approved");

        if (membersData) {
          setProjectMembers(membersData);
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
  const canUpload = (isMember && userMembershipStatus === "approved") || isClusterMember || isOwner;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Project Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{project.name}</h1>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Badge variant={project.status === "active" ? "default" : "secondary"} className="text-[10px] sm:text-xs px-1.5 py-0 h-5">
                {project.status}
              </Badge>
              <Badge variant={project.type === "cluster" ? "default" : "secondary"} className="text-[10px] sm:text-xs px-1.5 py-0 h-5">
                {project.type}
              </Badge>
              {project.visibility === "private" ? (
                <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 py-0 h-5">
                  <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Private
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs px-1.5 py-0 h-5">
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  Public
                </Badge>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="sm:hidden">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project.repository_url && (
                <DropdownMenuItem asChild>
                  <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                    <GitBranch className="mr-2 h-4 w-4" />
                    Repository
                  </a>
                </DropdownMenuItem>
              )}
              {project.demo_url && (
                <DropdownMenuItem asChild>
                  <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Demo
                  </a>
                </DropdownMenuItem>
              )}
              {canManage && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/projects/${project.id}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Owner Info */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <Avatar className="h-4 w-4 sm:h-5 sm:w-5">
            <AvatarImage src={project.owner_avatar} />
            <AvatarFallback className="text-[8px] sm:text-[10px]">
              {project.owner_name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">
            by <span className="font-medium">{project.owner_name}</span>
          </span>
          {project.cluster_name && (
            <>
              <span className="text-muted-foreground">•</span>
              <Link href={`/dashboard/clusters/${project.cluster_id}`} className="text-primary hover:underline truncate max-w-[150px]">
                {project.cluster_name}
              </Link>
            </>
          )}
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex gap-2 flex-wrap">
          {project.repository_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.repository_url} target="_blank" rel="noopener noreferrer">
                <GitBranch className="mr-2 h-3 w-3" />
                Repository
              </a>
            </Button>
          )}
          {project.demo_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-3 w-3" />
                Demo
              </a>
            </Button>
          )}
          {canManage && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/projects/${project.id}/settings`}>
                <Settings className="mr-2 h-3 w-3" />
                Settings
              </Link>
            </Button>
          )}
          {!isMember && !isOwner && (
            <Button size="sm" onClick={handleJoinClick}>
              <Plus className="mr-2 h-3 w-3" />
              Join
            </Button>
          )}
          {isMember && userMembershipStatus === "pending" && (
            <Button variant="outline" size="sm" onClick={handleLeaveClick}>
              Cancel Request
            </Button>
          )}
          {isMember && userMembershipStatus === "approved" && !isOwner && (
            <Button variant="outline" size="sm" onClick={handleLeaveClick}>
              Leave
            </Button>
          )}
        </div>

        {/* Mobile Join/Leave Button */}
        {!isMember && !isOwner && (
          <Button size="sm" onClick={handleJoinClick} className="w-full sm:hidden">
            <Plus className="mr-2 h-3 w-3" />
            Join Project
          </Button>
        )}
        {isMember && userMembershipStatus === "pending" && (
          <Button variant="outline" size="sm" onClick={handleLeaveClick} className="w-full sm:hidden">
            Cancel Request
          </Button>
        )}
        {isMember && userMembershipStatus === "approved" && !isOwner && (
          <Button variant="outline" size="sm" onClick={handleLeaveClick} className="w-full sm:hidden">
            Leave Project
          </Button>
        )}
      </div>

      {/* Project Info and Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        {/* Left Column - Description and Links (70%) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />

              {/* Repository and Demo Links */}
              {(project.repository_url || project.demo_url) && (
                <>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap gap-2">
                    {project.repository_url && (
                      <Button variant="default" size="sm" asChild>
                        <a
                          href={project.repository_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <GitBranch className="h-3 w-3" />
                          View Repository
                        </a>
                      </Button>
                    )}
                    {project.demo_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={project.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Demo
                        </a>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Project Info (30%) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {/* Members */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3 text-blue-600" />
                  <span className="font-medium">Members</span>
                </div>
                <div className="text-lg font-bold">{project.members_count}</div>
              </div>

              <Separator />

              {/* Started Date */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 text-green-600" />
                  <span className="font-medium">Started</span>
                </div>
                <div className="text-lg font-bold">
                  {new Date(project.started_at || project.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <Separator />

              {/* Technologies */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FolderGit2 className="h-3 w-3 text-purple-600" />
                  <span className="font-medium">Technologies</span>
                </div>
                <div className="text-lg font-bold">{project.tags?.length || 0}</div>
                {project.tags && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs: Progress (Activity), Members, Files, Chat */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" id="project-tabs">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Activity & Progress</span>
            <span className="sm:hidden">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Members ({project.members_count})</span>
            <span className="sm:hidden">Members</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            Files
          </TabsTrigger>
          {project.members_count > 1 && (
            <TabsTrigger value="chat" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              Chat
            </TabsTrigger>
          )}
          {canManage && (
            <TabsTrigger value="requests" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Requests</span>
              <span className="sm:hidden">Req</span>
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="activity" className="mt-4">
          <ProjectActivity
            projectId={project.id}
            projectName={project.name}
            currentUserId={user?.id || ""}
            isOwner={isOwner}
            projectOwnerId={project.owner_id}
            onTabChange={setActiveTab}
          />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <ProjectMembersList
            projectId={project.id}
            canManage={canManage}
            currentUserId={user?.id || ""}
          />
        </TabsContent>
        <TabsContent value="files" className="mt-4">
          <ProjectFiles
            projectId={project.id}
            canUpload={canUpload}
            currentUserId={user?.id || ""}
          />
        </TabsContent>
        {project.members_count > 1 && (
          <TabsContent value="chat" className="mt-4">
            <ProjectChat
              projectId={project.id}
              currentUserId={user?.id || ""}
              currentUserName={currentUserProfile?.full_name || "You"}
              currentUserAvatar={currentUserProfile?.avatar_url || null}
            />
          </TabsContent>
        )}
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
