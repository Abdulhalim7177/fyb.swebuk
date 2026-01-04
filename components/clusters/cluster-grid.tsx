"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Crown, Shield, MoreHorizontal, UserPlus, Eye, LogOut, Clock } from "lucide-react";
import { toast } from "sonner";
import { getDetailedClusters } from "@/lib/supabase/admin-actions";
import { EditClusterDialog } from "./edit-cluster-dialog";
import { ClusterMembersDialog } from "./cluster-members-dialog";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

interface ClusterGridProps {
  userRole: string;
  userId?: string;
  searchTerm: string;
  filterStatus: string;
  showJoinButton?: boolean;
}

export function ClusterGrid({ userRole, userId, searchTerm, filterStatus, showJoinButton }: ClusterGridProps) {
  const [clusters, setClusters] = useState<DetailedCluster[]>([]);
  const [userClusterStatuses, setUserClusterStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<DetailedCluster | null>(null);
  const [clusterToDelete, setClusterToDelete] = useState<string | null>(null);
  const [clusterToLeave, setClusterToLeave] = useState<string | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [clusterToJoin, setClusterToJoin] = useState<string | null>(null);

  const supabase = createClient(); // For client-side operations like delete

  const fetchClusters = async () => {
    setLoading(true);
    console.log("Fetching clusters...");
    const { success, clusters: fetchedClusters, error } = await getDetailedClusters();
    console.log("Fetched clusters:", { success, fetchedClusters, error });
    if (success && fetchedClusters) {
      const filtered = fetchedClusters.filter(cluster => {
        const matchesSearch = searchTerm === "" ||
          cluster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cluster.lead_name && cluster.lead_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cluster.deputy_name && cluster.deputy_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (cluster.staff_manager_name && cluster.staff_manager_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = filterStatus === "all" || cluster.status === filterStatus;

        return matchesSearch && matchesStatus;
      });
      setClusters(filtered);
    } else {
      toast.error(error || "Failed to load clusters.");
      setClusters([]);
    }
    setLoading(false);
  };

  const fetchUserClusters = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from("cluster_members")
        .select("cluster_id, status")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user clusters:", error);
      } else {
        // Create a map of clusterId to status
        const statuses: Record<string, string> = {};
        data.forEach(item => {
          statuses[item.cluster_id] = item.status;
        });
        setUserClusterStatuses(statuses);
      }
    }
  };

  useEffect(() => {
    fetchClusters();
    if (showJoinButton) {
      fetchUserClusters();
    }
  }, [searchTerm, filterStatus, showJoinButton, userId]);

  const handleDeleteClick = (clusterId: string) => {
    setClusterToDelete(clusterId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!clusterToDelete) return;

    try {
      const { error } = await supabase
        .from("clusters")
        .delete()
        .eq("id", clusterToDelete);

      if (error) throw error;

      toast.success("Cluster deleted successfully");
      fetchClusters(); // Re-fetch clusters after deletion
    } catch (error: any) {
      console.error("Error deleting cluster:", error);
      toast.error(error.message || "Failed to delete cluster");
    } finally {
      setClusterToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditCluster = (cluster: DetailedCluster) => {
    setSelectedCluster(cluster);
    setEditDialogOpen(true);
  };

  const handleViewMembers = (cluster: DetailedCluster) => {
    setSelectedCluster(cluster);
    setMembersDialogOpen(true);
  };

  const handleJoinClick = (clusterId: string) => {
    setClusterToJoin(clusterId);
    setJoinDialogOpen(true);
  };

  const confirmJoin = async () => {
    if (!clusterToJoin) return;

    if (!userId) {
      toast.error("You must be logged in to join a cluster.");
      return;
    }

    try {
      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: clusterToJoin,
          user_id: userId,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast.error("You have already requested to join this cluster.");
        } else {
          throw error;
        }
      } else {
        toast.success("Request to join cluster sent!");
        fetchUserClusters(); // Re-fetch user clusters to update button state
      }
    } catch (error: any) {
      console.error("Error joining cluster:", error);
      toast.error(error.message || "Failed to join cluster.");
    } finally {
      setClusterToJoin(null);
      setJoinDialogOpen(false);
    }
  };

  const handleLeaveClick = (clusterId: string) => {
    setClusterToLeave(clusterId);
    setLeaveDialogOpen(true);
  };

  const confirmLeave = async () => {
    if (!clusterToLeave) return;

    if (!userId) {
      toast.error("You must be logged in to leave a cluster.");
      return;
    }

    try {
      const { error } = await supabase
        .from("cluster_members")
        .delete()
        .eq("cluster_id", clusterToLeave)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Successfully left the cluster");
      fetchUserClusters(); // Re-fetch user clusters to update button state
    } catch (error: any) {
      console.error("Error leaving cluster:", error);
      toast.error(error.message || "Failed to leave cluster");
    } finally {
      setClusterToLeave(null);
      setLeaveDialogOpen(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      case "inactive":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-4 sm:p-6 animate-pulse">
            <div className="h-6 w-3/4 bg-muted rounded mb-4" />
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-20 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl bg-card border border-border">
        <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground">No clusters found</h3>
        <p className="text-muted-foreground mt-2">
          {searchTerm ? "Try adjusting your search or filters" : "Create your first cluster to get started"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clusters.map((cluster) => {
          const canManage = userRole === 'admin' || userRole === 'staff';
          return (
            <Link href={`/dashboard/clusters/${cluster.id}`} key={cluster.id}>
              <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:shadow-md hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 flex flex-col cursor-pointer">
                <div className="p-4 sm:p-6 pb-2 sm:pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">
                      {cluster.name}
                    </h3>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                      cluster.status === 'active' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' :
                      cluster.status === 'inactive' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30' :
                      'bg-gray-500/20 text-gray-600 dark:text-gray-300 border border-gray-500/30'
                    }`}>
                      {cluster.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {cluster.description || "No description"}
                  </p>
                </div>

                <div className="px-4 sm:px-6 flex-grow space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-secondary/50 border border-border text-xs sm:text-sm">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-sky-500 dark:text-sky-400 flex-shrink-0" />
                    <span className="font-medium text-muted-foreground">Staff:</span>
                    <span className="text-foreground truncate">{cluster.staff_manager_name || <span className="text-muted-foreground text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-secondary/50 border border-border text-xs sm:text-sm">
                    <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    <span className="font-medium text-muted-foreground">Lead:</span>
                    <span className="text-foreground truncate">{cluster.lead_name || <span className="text-muted-foreground text-xs">N/A</span>}</span>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-secondary/50 border border-border text-xs sm:text-sm">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                    <span className="font-medium text-muted-foreground">Deputy:</span>
                    <span className="text-foreground truncate">{cluster.deputy_name || <span className="text-muted-foreground text-xs">N/A</span>}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 sm:p-6 pt-2 sm:pt-3 border-t border-border mt-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                    <div className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                      <Users className="h-3 w-3" />
                      <span>{cluster.members_count}</span>
                    </div>
                    <span className="text-muted-foreground hidden xs:inline">Members</span>
                  </div>
                  {showJoinButton && userRole === 'student' ? (
                    // For students, show different buttons based on their cluster status
                    (() => {
                      const userClusterStatus = userClusterStatuses[cluster.id];
                      if (userClusterStatus === 'approved') {
                        return (
                          <div className="flex gap-1">
                            <button
                              className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 transition-all duration-200 hover:scale-105"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/dashboard/clusters/${cluster.id}`;
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            <button
                              className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-all duration-200 hover:scale-105"
                              onClick={(e) => {
                                e.preventDefault();
                                handleLeaveClick(cluster.id);
                              }}
                            >
                              <LogOut className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      } else if (userClusterStatus === 'pending') {
                        return (
                          <button
                            className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 cursor-default"
                            onClick={(e) => {
                              e.preventDefault();
                              toast.info("Your request to join this cluster is pending approval.");
                            }}
                          >
                            <Clock className="h-3 w-3" />
                          </button>
                        );
                      } else {
                        return (
                          <button
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 transition-all duration-200 hover:scale-105"
                            onClick={(e) => {
                              e.preventDefault();
                              handleJoinClick(cluster.id);
                            }}
                          >
                            <UserPlus className="h-3 w-3" />
                          </button>
                        );
                      }
                    })()
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => e.preventDefault()} // Prevent navigation when clicking the dropdown
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-sm font-semibold">Actions</DropdownMenuLabel>
                        {userRole === 'student' && userClusterStatuses[cluster.id] === 'approved' ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation when clicking menu items
                              handleLeaveClick(cluster.id);
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 px-2 text-xs"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Leave Cluster
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault(); // Prevent navigation when clicking menu items
                            handleViewMembers(cluster);
                          }}
                            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 focus:text-sky-700 dark:focus:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/20 h-7 px-2 text-xs"
                          >
                          <Users className="mr-2 h-4 w-4" />
                          View Members
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault(); // Prevent navigation when clicking menu items
                                handleEditCluster(cluster);
                              }}
                              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 h-7 px-2 text-xs"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Cluster
                            </DropdownMenuItem>
                          </>
                        )}
                        {userRole === "admin" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation when clicking menu items
                              handleDeleteClick(cluster.id);
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 h-7 px-2 text-xs"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Cluster
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {selectedCluster && (
        <>
          <EditClusterDialog
            cluster={selectedCluster}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onClusterUpdated={fetchClusters}
          />
          <ClusterMembersDialog
            cluster={selectedCluster}
            open={membersDialogOpen}
            onOpenChange={setMembersDialogOpen}
            onMembersUpdated={fetchClusters}
            userId={userId}
            userRole={userRole}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the cluster and all of its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be removed from this cluster and will lose access to its resources. You can request to join again later.
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
            <AlertDialogAction onClick={confirmJoin} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}