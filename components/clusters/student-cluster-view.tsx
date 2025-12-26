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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{cluster.name}</h1>
                  <Badge variant={cluster.status === "active" ? "default" : cluster.status === "inactive" ? "secondary" : "destructive"}>
                    {cluster.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2 max-w-2xl">{cluster.description || "No description provided."}</p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex gap-2">
              {!isMember && !hasPendingRequest && (
                <Button onClick={handleJoinClick} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Join Cluster
                </Button>
              )}
              {hasPendingRequest && (
                <Button variant="outline" onClick={handleLeaveClick}>
                  <Clock className="mr-2 h-4 w-4" />
                  Cancel Request
                </Button>
              )}
              {isMember && userMembershipStatus === "approved" && (
                <Button variant="outline" onClick={handleLeaveClick}>
                  Leave Cluster
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cluster.members_count}</div>
          </CardContent>
        </Card>
        <StudentClusterStats clusterId={cluster.id} />
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge className="h-4" variant={cluster.status === "active" ? "default" : "secondary"}>
              {cluster.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {cluster.status === "active" ? "Open for new members" : "Currently inactive"}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(cluster.created_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leadership Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leadership Team</CardTitle>
          <CardDescription>People leading this cluster</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                {cluster.lead_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{cluster.lead_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground">Lead Student</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                {cluster.deputy_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{cluster.deputy_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground">Deputy Lead</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                {cluster.staff_manager_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{cluster.staff_manager_name || "Not assigned"}</p>
                <p className="text-xs text-muted-foreground">Staff Manager</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
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
