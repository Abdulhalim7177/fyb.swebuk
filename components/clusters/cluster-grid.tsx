"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Crown, Shield, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { getDetailedClusters } from "@/lib/supabase/admin-actions";
import { EditClusterDialog } from "./edit-cluster-dialog";
import { ClusterMembersDialog } from "./cluster-members-dialog";
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
  const [userClusterIds, setUserClusterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<DetailedCluster | null>(null);

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
        .select("cluster_id")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user clusters:", error);
      } else {
        setUserClusterIds(data.map(item => item.cluster_id));
      }
    }
  };

  useEffect(() => {
    fetchClusters();
    if (showJoinButton) {
      fetchUserClusters();
    }
  }, [searchTerm, filterStatus, showJoinButton, userId]);

  const handleDeleteCluster = async (clusterId: string) => {
    if (!confirm("Are you sure you want to delete this cluster? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("clusters")
        .delete()
        .eq("id", clusterId);

      if (error) throw error;

      toast.success("Cluster deleted successfully");
      fetchClusters(); // Re-fetch clusters after deletion
    } catch (error: any) {
      console.error("Error deleting cluster:", error);
      toast.error(error.message || "Failed to delete cluster");
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

  const handleJoinCluster = async (clusterId: string) => {
    if (!userId) {
      toast.error("You must be logged in to join a cluster.");
      return;
    }

    try {
      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: clusterId,
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
            <Card key={cluster.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{cluster.name}</span>
                  <Badge variant={getStatusVariant(cluster.status)}>{cluster.status}</Badge>
                </CardTitle>
                <CardDescription className="line-clamp-2">{cluster.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Staff Manager: {cluster.staff_manager_name || <Badge variant="outline">N/A</Badge>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-muted-foreground" />
                  <span>Lead Student: {cluster.lead_name || <Badge variant="outline">N/A</Badge>}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Deputy Lead: {cluster.deputy_name || <Badge variant="outline">N/A</Badge>}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{cluster.members_count} Members</span>
                </div>
                {showJoinButton && userRole === 'student' ? (
                  <Button
                    size="sm"
                    onClick={() => handleJoinCluster(cluster.id)}
                    disabled={userClusterIds.includes(cluster.id)}
                  >
                    {userClusterIds.includes(cluster.id) ? "Request Sent" : "Join"}
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewMembers(cluster)}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Members
                      </DropdownMenuItem>
                      {canManage && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditCluster(cluster)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Cluster
                          </DropdownMenuItem>
                        </>
                      )}
                      {userRole === "admin" && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteCluster(cluster.id)}
                          className="text-destructive"
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
    </>
  );
}