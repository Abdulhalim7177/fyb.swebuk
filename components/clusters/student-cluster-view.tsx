"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Users, Calendar, FileText, AlertCircle, Clock, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClusterMembersList } from "./cluster-members-list";
import { ClusterProjectsList } from "./cluster-projects-list";
import { ClusterEventsList } from "./cluster-events-list";
import { ClusterRequestsList } from "./cluster-requests-list";
import { StudentClusterStats } from "./student-cluster-stats";

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

interface StudentClusterViewProps {
  cluster: DetailedCluster;
  user: User;
  isMember: boolean;
  hasPendingRequest: boolean;
  userMembershipStatus: string | null;
  canManageProjects: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

export function StudentClusterView({
  cluster,
  user,
  isMember,
  hasPendingRequest,
  userMembershipStatus,
  canManageProjects,
  onJoin,
  onLeave,
}: StudentClusterViewProps) {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-white/10 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-100 bg-clip-text text-transparent">{cluster.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${cluster.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                    {cluster.status}
                  </span>
                </div>
                <p className="text-slate-300 mt-2 max-w-2xl">{cluster.description || "No description provided."}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-2">
              {!isMember && !hasPendingRequest && (
                <button onClick={handleJoinClick} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-medium transition-all duration-300 hover:scale-105">
                  <Plus className="h-4 w-4" />
                  Join Cluster
                </button>
              )}
              {hasPendingRequest && (
                <button onClick={handleLeaveClick} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-medium transition-all duration-300 hover:scale-105">
                  <Clock className="h-4 w-4" />
                  Cancel Request
                </button>
              )}
              {isMember && userMembershipStatus === "approved" && (
                <button onClick={handleLeaveClick} className="px-6 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium transition-all duration-300 hover:scale-105">
                  Leave Cluster
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
          <div className="p-3 rounded-xl bg-purple-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{cluster.members_count}</p>
          <p className="text-sm font-medium text-slate-400">Members</p>
        </div>

        <StudentClusterStats clusterId={cluster.id} />

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
          <div className={`p-3 rounded-xl ${cluster.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'} mb-3 group-hover:scale-110 transition-transform duration-300`}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="text-xl font-bold text-white mb-1 uppercase">{cluster.status}</p>
          <p className="text-sm font-medium text-slate-400">Cluster Status</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
          <div className="p-3 rounded-xl bg-blue-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-white mb-1">{new Date(cluster.created_at).toLocaleDateString()}</p>
          <p className="text-sm font-medium text-slate-400">Created On</p>
        </div>
      </div>

      {/* Leadership Info */}
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Leadership Team</h2>
          <p className="text-slate-400 text-sm mt-1">People leading this cluster</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
              {cluster.lead_name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white truncate">{cluster.lead_name || "Not assigned"}</p>
              <p className="text-xs text-slate-400">Lead Student</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
              {cluster.deputy_name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white truncate">{cluster.deputy_name || "Not assigned"}</p>
              <p className="text-xs text-slate-400">Deputy Lead</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-lg">
              {cluster.staff_manager_name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white truncate">{cluster.staff_manager_name || "Not assigned"}</p>
              <p className="text-xs text-slate-400">Staff Manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className="border border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle>Cluster Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="members" className="w-full">
            <div className="px-4 sm:px-6">
              <TabsList className="w-full sm:w-auto grid sm:inline-flex grid-cols-2 sm:h-9 h-auto items-start sm:items-center justify-start bg-muted/50 p-1 rounded-lg overflow-x-auto max-w-full">
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
                {isMember && (
                  <TabsTrigger value="requests" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow min-w-max">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Requests</span>
                    <span className="sm:hidden">Requests</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <div className="p-6">
              <TabsContent value="members" className="mt-0">
                <ClusterMembersList clusterId={cluster.id} userRole={user.role} canManage={false} />
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
                  canManage={false}
                />
              </TabsContent>
              {isMember && (
                <TabsContent value="requests" className="mt-0">
                  <ClusterRequestsList
                    clusterId={cluster.id}
                    userRole={user.role}
                    userId={user.id}
                    hasPendingRequest={hasPendingRequest}
                    canManage={false}
                  />
                </TabsContent>
              )}
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
    </div>
  );
}
