"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  FileText,
  AlertCircle,
  Clock,
  Settings,
  TrendingUp,
  UserPlus,
  Shield,
  Crown,
  MoreVertical,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Activity,
  Bell,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClusterMembersList } from "./cluster-members-list";
import { ClusterProjectsList } from "./cluster-projects-list";
import { ClusterEventsList } from "./cluster-events-list";
import { ClusterRequestsList } from "./cluster-requests-list";

interface DetailedCluster {
  id: string;
  name: string;
  description: string;
  created_at: string;
  status: string;
  lead_id: string | null;
  lead_name: string | null;
  lead_email: string | null;
  deputy_id: string | null;
  deputy_name: string | null;
  deputy_email: string | null;
  staff_manager_id: string | null;
  staff_manager_name: string | null;
  staff_manager_email: string | null;
  members_count: number;
}

interface User {
  id: string;
  role: string;
}

interface AdminClusterViewProps {
  cluster: DetailedCluster;
  user: User;
  isMember: boolean;
  hasPendingRequest: boolean;
  userMembershipStatus: string | null;
  canManage: boolean;
  canManageProjects: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

async function fetchClusterStats(clusterId: string) {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  // Get project count - use detailed_projects view for cluster projects
  const { count: projectCount } = await supabase
    .from("detailed_projects")
    .select("*", { count: "exact", head: true })
    .eq("cluster_id", clusterId);

  // Get upcoming events count
  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("cluster_id", clusterId)
    .gte("start_date", new Date().toISOString());

  // Get pending requests count
  const { count: pendingCount } = await supabase
    .from("cluster_members")
    .select("*", { count: "exact", head: true })
    .eq("cluster_id", clusterId)
    .eq("status", "pending");

  return {
    projects: projectCount || 0,
    events: eventsCount || 0,
    pendingRequests: pendingCount || 0,
  };
}

export function AdminClusterView({
  cluster,
  user,
  isMember,
  hasPendingRequest,
  userMembershipStatus,
  canManage,
  canManageProjects,
  onJoin,
  onLeave,
}: AdminClusterViewProps) {
  const router = useRouter();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stats, setStats] = useState<{ projects: number; events: number; pendingRequests: number }>({
    projects: 0,
    events: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    fetchClusterStats(cluster.id).then(setStats).catch(console.error);
  }, [cluster.id]);

  const handleDeleteCluster = async () => {
    try {
      setDeleting(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("clusters")
        .delete()
        .eq("id", cluster.id);

      if (error) throw error;

      toast.success("Cluster deleted successfully");
      router.push("/dashboard/admin/clusters");
    } catch (error: any) {
      console.error("Error deleting cluster:", error);
      toast.error("Failed to delete cluster: " + error.message);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleJoinClick = () => {
    setJoinDialogOpen(true);
  };

  const confirmJoin = () => {
    setJoinDialogOpen(false);
    onJoin();
  };

  const handleLeaveClick = () => {
    setLeaveDialogOpen(true);
  };

  const confirmLeave = () => {
    setLeaveDialogOpen(false);
    onLeave();
  };

  const isManager = cluster.lead_id === user.id ||
                    cluster.deputy_id === user.id ||
                    cluster.staff_manager_id === user.id;

  return (
    <div className="space-y-6">
      {/* Admin Hero Header - Reimplemented in Sleek Supabase Style */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-muted/40 shadow-sm">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{cluster.name}</h1>
                  <Badge variant={cluster.status === 'active' ? 'default' : 'secondary'} className={cluster.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : ''}>
                    {cluster.status}
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/5 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin View
                  </Badge>
                </div>
                <p className="text-muted-foreground text-base max-w-3xl leading-relaxed">{cluster.description || "No description provided."}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Created {new Date(cluster.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    ID: {cluster.id.slice(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 h-9"
                  onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 h-9 border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-600"
                  onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 h-9 border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Stats Row - Sleek Implementation */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-purple-500/10 mb-2 sm:mb-3">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
            </div>
            <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{cluster.members_count}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Members</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-blue-500/10 mb-2 sm:mb-3">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{stats.projects}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Projects</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-emerald-500/10 mb-2 sm:mb-3">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500" />
            </div>
            <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{stats.events}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Events</p>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${stats.pendingRequests > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-border/50'}`}>
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className={`p-1.5 sm:p-2.5 rounded-xl mb-2 sm:mb-3 ${stats.pendingRequests > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/10 text-slate-400'}`}>
              <AlertCircle className={`h-4 w-4 sm:h-6 sm:w-6 ${stats.pendingRequests > 0 ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{stats.pendingRequests}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Requests</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-cyan-500/10 mb-2 sm:mb-3">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-cyan-500" />
            </div>
            <p className="text-xs sm:text-lg font-bold text-foreground mb-0.5 sm:mb-1">{new Date(cluster.created_at).toLocaleDateString()}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Created</p>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${cluster.status === 'active' ? 'border-green-500/50 bg-green-500/5' : 'border-border/50'}`}>
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className={`p-1.5 sm:p-2.5 rounded-xl mb-2 sm:mb-3 ${cluster.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-slate-500/10 text-slate-400'}`}>
              <Activity className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <p className="text-xs sm:text-xl font-bold text-foreground mb-0.5 sm:mb-1 capitalize">{cluster.status}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions & Leadership */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2 border-border/50 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings className="h-5 w-5" />
              Quick Management Actions
            </CardTitle>
            <CardDescription>Fast access to common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.pendingRequests > 0 && (
                <button
                  className="flex items-start justify-start gap-3 p-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-left transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => {
                    const requestsTrigger = document.querySelector('[value="requests"]') as HTMLElement;
                    requestsTrigger?.click();
                  }}
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Review Requests</div>
                    <div className="text-xs text-muted-foreground">{stats.pendingRequests} pending</div>
                  </div>
                </button>
              )}
              <button
                className="flex items-start justify-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 text-left transition-all duration-200 hover:scale-[1.02]"
                onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
              >
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Edit className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Edit Cluster</div>
                  <div className="text-xs text-muted-foreground">Update details & settings</div>
                </div>
              </button>
              {canManageProjects && (
                <button
                  className="flex items-start justify-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 text-left transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => router.push(`/dashboard/projects/create?cluster_id=${cluster.id}`)}
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">New Project</div>
                    <div className="text-xs text-muted-foreground">Create for this cluster</div>
                  </div>
                </button>
              )}
              <button
                className="flex items-start justify-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 text-left transition-all duration-200 hover:scale-[1.02]"
                onClick={() => router.push(`/dashboard/clusters/events/new?cluster_id=${cluster.id}`)}
              >
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Schedule Event</div>
                  <div className="text-xs text-muted-foreground">Plan a cluster event</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Leadership Team */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5" />
              Leadership
            </CardTitle>
            <CardDescription>Assigned managers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-semibold">
                {cluster.lead_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm text-foreground">{cluster.lead_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground truncate">{cluster.lead_email || "—"}</p>
              </div>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold">
                {cluster.deputy_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm text-foreground">{cluster.deputy_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground truncate">{cluster.deputy_email || "—"}</p>
              </div>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-semibold">
                {cluster.staff_manager_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm text-foreground">{cluster.staff_manager_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground truncate">{cluster.staff_manager_email || "—"}</p>
              </div>
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 gap-2"
              onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
            >
              <Edit className="h-4 w-4" />
              Edit Assignments
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Reimplemented for Sleekness and Mobile UX */}
      <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Cluster Activities</CardTitle>
          <CardDescription className="text-sm">Manage all cluster content and memberships</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="members" className="w-full">
            <div className="px-4 sm:px-6 border-b border-border/50">
              <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-transparent p-0 h-auto gap-6 sm:gap-8 rounded-none">
                <TabsTrigger 
                  value="members" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap"
                >
                  <Users className="h-4 w-4" />
                  Members
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-muted/50">{cluster.members_count}</Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="projects" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
                  Projects
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
                <TabsTrigger 
                  value="requests" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap relative"
                >
                  <AlertCircle className="h-4 w-4" />
                  Requests
                  {stats.pendingRequests > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">
                      {stats.pendingRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="p-4 sm:p-6">
              <TabsContent value="members" className="mt-0">
                <ClusterMembersList clusterId={cluster.id} userRole={user.role} canManage={true} />
              </TabsContent>
              <TabsContent value="projects" className="mt-0">
                <ClusterProjectsList clusterId={cluster.id} userRole={user.role} userId={user.id} isMember={isMember} canManage={canManageProjects} />
              </TabsContent>
              <TabsContent value="events" className="mt-0">
                <ClusterEventsList
                  clusterId={cluster.id}
                  userRole={user.role}
                  userId={user.id}
                  isMember={isMember}
                  canManage={true}
                />
              </TabsContent>
              <TabsContent value="requests" className="mt-0">
                <ClusterRequestsList
                  clusterId={cluster.id}
                  userRole={user.role}
                  userId={user.id}
                  hasPendingRequest={hasPendingRequest}
                  canManage={true}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Join Dialog */}
      <AlertDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request to Join Cluster?</AlertDialogTitle>
            <AlertDialogDescription>
              A request will be sent to the cluster leaders for approval. You will be notified once your request has been reviewed.
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
              This action will remove you from the cluster. If you have a pending request, it will be cancelled.
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this cluster?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All cluster members, projects, and events will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCluster}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Cluster"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
