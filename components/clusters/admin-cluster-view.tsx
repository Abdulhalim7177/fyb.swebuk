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
      {/* Admin Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500 via-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
            {cluster.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{cluster.name}</h1>
              <Badge variant={cluster.status === "active" ? "default" : cluster.status === "inactive" ? "secondary" : "destructive"}>
                {cluster.status}
              </Badge>
              <Badge variant="outline" className="border-red-500/50 text-red-600 dark:text-red-400">
                <Shield className="h-3 w-3 mr-1" />
                Admin View
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 max-w-2xl">{cluster.description || "No description provided."}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {new Date(cluster.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                ID: {cluster.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Admin Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}>
                <Settings className="h-4 w-4 mr-2" />
                Cluster Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canManageProjects && (
                <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/create?cluster_id=${cluster.id}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Create Project
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => router.push(`/dashboard/events/create?cluster_id=${cluster.id}`)}>
                <Calendar className="h-4 w-4 mr-2" />
                Create Event
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Cluster
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)} className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Admin Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cluster.members_count}</div>
            <p className="text-xs text-muted-foreground">Total members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events}</div>
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>
        <Card className={stats.pendingRequests > 0 ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.pendingRequests > 0 ? "text-amber-600 animate-pulse" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Requests to review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date(cluster.created_at).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(cluster.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className={`h-4 w-4 ${cluster.status === 'active' ? "text-green-600" : cluster.status === 'inactive' ? "text-amber-600" : "text-red-600"}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${cluster.status === 'active' ? "bg-green-500" : cluster.status === 'inactive' ? "bg-amber-500" : "bg-red-500"}`} />
              <span className="font-medium capitalize">{cluster.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cluster.status === 'active' ? 'Cluster is operational' : cluster.status === 'inactive' ? 'Temporarily paused' : 'Marked for deletion'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions & Leadership */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Management Actions
            </CardTitle>
            <CardDescription>Fast access to common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.pendingRequests > 0 && (
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-4 border-amber-500/50 hover:bg-amber-500/10"
                  onClick={() => {
                    const requestsTrigger = document.querySelector('[value="requests"]') as HTMLElement;
                    requestsTrigger?.click();
                  }}
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Review Requests</div>
                    <div className="text-xs text-muted-foreground">{stats.pendingRequests} pending</div>
                  </div>
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-4"
                onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
              >
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Edit Cluster</div>
                  <div className="text-xs text-muted-foreground">Update details & settings</div>
                </div>
              </Button>
              {canManageProjects && (
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-4"
                  onClick={() => router.push(`/dashboard/projects/create?cluster_id=${cluster.id}`)}
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">New Project</div>
                    <div className="text-xs text-muted-foreground">Create for this cluster</div>
                  </div>
                </Button>
              )}
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-4"
                onClick={() => router.push(`/dashboard/clusters/events/new?cluster_id=${cluster.id}`)}
              >
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Schedule Event</div>
                  <div className="text-xs text-muted-foreground">Plan a cluster event</div>
                </div>
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Leadership Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Leadership
            </CardTitle>
            <CardDescription>Assigned managers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  {cluster.lead_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{cluster.lead_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground truncate">{cluster.lead_email || "—"}</p>
              </div>
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {cluster.deputy_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{cluster.deputy_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground truncate">{cluster.deputy_email || "—"}</p>
              </div>
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  {cluster.staff_manager_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{cluster.staff_manager_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground truncate">{cluster.staff_manager_email || "—"}</p>
              </div>
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Assignments
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Cluster Activities</CardTitle>
          <CardDescription>Manage all cluster content and memberships</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="members" className="w-full">
            <div className="px-6">
              <TabsList className="w-full sm:w-auto inline-flex h-9 items-center justify-start bg-muted/50 p-1 rounded-lg">
                <TabsTrigger value="members" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow min-w-max">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Members</span>
                  <span className="sm:hidden">Members</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">{cluster.members_count}</Badge>
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow min-w-max">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Projects</span>
                  <span className="sm:hidden">Projects</span>
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow min-w-max">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Events</span>
                  <span className="sm:hidden">Events</span>
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow relative min-w-max">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Requests</span>
                  <span className="sm:hidden">Requests</span>
                  {stats.pendingRequests > 0 && (
                    <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full">
                      {stats.pendingRequests}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="p-6">
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
