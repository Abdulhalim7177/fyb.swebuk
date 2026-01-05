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
import { Users, Calendar, FileText, AlertCircle, Clock, Plus, LogOut } from "lucide-react";
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
      {/* Hero Header - Sleek Supabase Style */}
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
                </div>
                <p className="text-muted-foreground text-base max-w-3xl leading-relaxed">{cluster.description || "No description provided."}</p>
              </div>

              {/* Action Button */}
              <div className="flex flex-wrap gap-2 shrink-0">
                {!isMember && !hasPendingRequest && (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="gap-2 h-9 bg-primary shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    onClick={handleJoinClick}
                  >
                    <Plus className="h-4 w-4" />
                    Join Cluster
                  </Button>
                )}
                {hasPendingRequest && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 h-9 border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-600"
                    onClick={handleLeaveClick}
                  >
                    <Clock className="h-4 w-4" />
                    Cancel Request
                  </Button>
                )}
                {isMember && userMembershipStatus === "approved" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 h-9 border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
                    onClick={handleLeaveClick}
                  >
                    <LogOut className="h-4 w-4" />
                    Leave Cluster
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards - Sleek Implementation */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-purple-500/10 mb-2 sm:mb-3">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-500" />
            </div>
            <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{cluster.members_count}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Members</p>
          </CardContent>
        </Card>

        <StudentClusterStats clusterId={cluster.id} />

        <Card className={`hover:shadow-md transition-all duration-300 hover:scale-[1.02] ${cluster.status === 'active' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/50'}`}>
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className={`p-1.5 sm:p-2.5 rounded-xl mb-2 sm:mb-3 ${cluster.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <p className="text-xs sm:text-xl font-bold text-foreground mb-0.5 sm:mb-1 uppercase">{cluster.status}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Status</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
          <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-blue-500/10 mb-2 sm:mb-3">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
            </div>
            <p className="text-xs sm:text-lg font-bold text-foreground mb-0.5 sm:mb-1">{new Date(cluster.created_at).toLocaleDateString()}</p>
            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Created</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Sleek Implementation */}
      <Card className="border-border/50 bg-card overflow-hidden shadow-sm">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Cluster Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="members" className="w-full">
            <div className="px-4 sm:px-6 border-b border-border/50">
              <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-transparent p-0 h-auto gap-6 sm:gap-8 rounded-none">
                <TabsTrigger value="members" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap">
                  <Users className="h-4 w-4" />
                  Members
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-muted/50">{cluster.members_count}</Badge>
                </TabsTrigger>
                <TabsTrigger value="projects" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap">
                  <FileText className="h-4 w-4" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap">
                  <Calendar className="h-4 w-4" />
                  Events
                </TabsTrigger>
                {isMember && (
                  <TabsTrigger value="requests" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-3 h-auto gap-2 font-semibold transition-all text-sm sm:text-base whitespace-nowrap">
                    <AlertCircle className="h-4 w-4" />
                    Requests
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <div className="p-4 sm:p-6">
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

      {/* Leadership Info - Sleek Implementation */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">Leadership Team</CardTitle>
          <CardDescription className="text-xs">People leading this cluster</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                {cluster.lead_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate text-sm">{cluster.lead_name || "Not assigned"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Lead Student</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                {cluster.deputy_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate text-sm">{cluster.deputy_name || "Not assigned"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Deputy Lead</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                {cluster.staff_manager_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate text-sm">{cluster.staff_manager_name || "Not assigned"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Staff Manager</p>
              </div>
            </div>
          </div>
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
