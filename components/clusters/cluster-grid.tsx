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
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading clusters...</div>;
  }

  if (clusters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No clusters found. Create your first cluster to get started.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {clusters.map((cluster) => {
          const canManage = userRole === 'admin' || userRole === 'staff';
          return (
            <Link href={`/dashboard/clusters/${cluster.id}`} key={cluster.id}>
              <Card className="flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20 group">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate hover:underline group-hover:text-primary transition-colors">
                      {cluster.name}
                    </span>
                    <Badge className={`${getStatusColor(cluster.status)} font-semibold`}>
                      {cluster.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                    {cluster.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium">Staff Manager:</span>
                    <span>{cluster.staff_manager_name || <Badge variant="outline" className="text-xs">N/A</Badge>}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium">Lead Student:</span>
                    <span>{cluster.lead_name || <Badge variant="outline" className="text-xs">N/A</Badge>}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium">Deputy Lead:</span>
                    <span>{cluster.deputy_name || <Badge variant="outline" className="text-xs">N/A</Badge>}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-3 border-t bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                      <Users className="h-3 w-3" />
                      <span>{cluster.members_count}</span>
                    </div>
                    <span className="text-muted-foreground">Members</span>
                  </div>
                  {showJoinButton && userRole === 'student' ? (
                    // For students, show different buttons based on their cluster status
                    (() => {
                      const userClusterStatus = userClusterStatuses[cluster.id];
                      if (userClusterStatus === 'approved') {
                        return (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = `/dashboard/clusters/${cluster.id}`;
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.preventDefault();
                                handleLeaveClick(cluster.id);
                              }}
                            >
                              <LogOut className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      } else if (userClusterStatus === 'pending') {
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20 cursor-default h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              toast.info("Your request to join this cluster is pending approval.");
                            }}
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                        );
                      } else {
                        return (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              handleJoinClick(cluster.id);
                            }}
                          >
                            <UserPlus className="h-3 w-3" />
                          </Button>
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
                            className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
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
                          className="text-blue-600 dark:text-blue-400 focus:text-blue-700 dark:focus:text-blue-300"
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
                              className="text-amber-600 dark:text-amber-400 focus:text-amber-700 dark:focus:text-amber-300"
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
                            className="text-destructive focus:text-destructive/80"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Cluster
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardFooter>
              </Card>
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
            <AlertDialogAction onClick={confirmJoin}>
              Send Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}