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
      {/* Admin Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/20 via-purple-500/20 to-blue-500/20 border border-white/10 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-red-100 to-purple-100 bg-clip-text text-transparent">{cluster.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${cluster.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                    {cluster.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin View
                  </span>
                </div>
                <p className="text-slate-300 mt-2 max-w-2xl">{cluster.description || "No description provided."}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
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

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 font-medium transition-all duration-300 hover:scale-105">
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-medium transition-all duration-300 hover:scale-105">
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button onClick={() => setDeleteDialogOpen(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium transition-all duration-300 hover:scale-105">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
          <div className="p-3 rounded-xl bg-purple-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{cluster.members_count}</p>
          <p className="text-sm font-medium text-slate-400">Total Members</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
          <div className="p-3 rounded-xl bg-blue-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
            <FileText className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.projects}</p>
          <p className="text-sm font-medium text-slate-400">Active Projects</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
          <div className="p-3 rounded-xl bg-emerald-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
            <Calendar className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.events}</p>
          <p className="text-sm font-medium text-slate-400">Upcoming Events</p>
        </div>

        <div className={`rounded-2xl border backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105 ${stats.pendingRequests > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
          <div className={`p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300 ${stats.pendingRequests > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/10 text-slate-400'}`}>
            <AlertCircle className={`h-6 w-6 ${stats.pendingRequests > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.pendingRequests}</p>
          <p className="text-sm font-medium text-slate-400">Pending Requests</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
          <div className="p-3 rounded-xl bg-cyan-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-6 w-6 text-cyan-500" />
          </div>
          <p className="text-lg font-bold text-white mb-1">{new Date(cluster.created_at).toLocaleDateString()}</p>
          <p className="text-sm font-medium text-slate-400">Created On</p>
        </div>

        <div className={`rounded-2xl border backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105 ${cluster.status === 'active' ? 'bg-green-500/10 border-green-500/30' : cluster.status === 'inactive' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className={`p-3 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300 ${cluster.status === 'active' ? 'bg-green-500/20 text-green-500' : cluster.status === 'inactive' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
            <Activity className="h-6 w-6" />
          </div>
          <p className="text-xl font-bold text-white mb-1 capitalize">{cluster.status}</p>
          <p className="text-sm font-medium text-slate-400">Status</p>
        </div>
      </div>

      {/* Management Actions & Leadership */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Management Actions
            </h2>
            <p className="text-slate-400 text-sm mt-1">Fast access to common administrative tasks</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.pendingRequests > 0 && (
              <button
                className="flex items-start justify-start gap-3 p-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-left transition-all duration-200 hover:scale-105"
                onClick={() => {
                  const requestsTrigger = document.querySelector('[value="requests"]') as HTMLElement;
                  requestsTrigger?.click();
                }}
              >
                <div className="h-10 w-10 rounded-lg bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <div className="font-semibold text-amber-300">Review Requests</div>
                  <div className="text-xs text-amber-400/70">{stats.pendingRequests} pending</div>
                </div>
              </button>
            )}
            <button
              className="flex items-start justify-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all duration-200 hover:scale-105"
              onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
            >
              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Edit className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Edit Cluster</div>
                <div className="text-xs text-slate-400">Update details & settings</div>
              </div>
            </button>
            {canManageProjects && (
              <button
                className="flex items-start justify-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all duration-200 hover:scale-105"
                onClick={() => router.push(`/dashboard/projects/create?cluster_id=${cluster.id}`)}
              >
                <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">New Project</div>
                  <div className="text-xs text-slate-400">Create for this cluster</div>
                </div>
              </button>
            )}
            <button
              className="flex items-start justify-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all duration-200 hover:scale-105"
              onClick={() => router.push(`/dashboard/clusters/events/new?cluster_id=${cluster.id}`)}
            >
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="font-semibold text-white">Schedule Event</div>
                <div className="text-xs text-slate-400">Plan a cluster event</div>
              </div>
            </button>
          </div>
        </div>

        {/* Leadership Team */}
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Leadership
            </h2>
            <p className="text-slate-400 text-sm mt-1">Assigned managers</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                {cluster.lead_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm text-white">{cluster.lead_name || "Not assigned"}</p>
                <p className="text-xs text-slate-400 truncate">{cluster.lead_email || "—"}</p>
              </div>
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                {cluster.deputy_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm text-white">{cluster.deputy_name || "Not assigned"}</p>
                <p className="text-xs text-slate-400 truncate">{cluster.deputy_email || "—"}</p>
              </div>
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {cluster.staff_manager_name?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm text-white">{cluster.staff_manager_name || "Not assigned"}</p>
                <p className="text-xs text-slate-400 truncate">{cluster.staff_manager_email || "—"}</p>
              </div>
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
            <button
              className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all duration-200 hover:scale-105"
              onClick={() => router.push(`/dashboard/clusters/${cluster.id}/settings`)}
            >
              <Edit className="h-4 w-4" />
              Edit Assignments
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
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
