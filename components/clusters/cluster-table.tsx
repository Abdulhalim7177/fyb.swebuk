"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Edit, Trash2, Users, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { EditClusterDialog } from "./edit-cluster-dialog";
import { ClusterMembersDialog } from "./cluster-members-dialog";

interface Cluster {
  id: string;
  name: string;
  description: string;
  lead_id: string | null;
  deputy_id: string | null;
  staff_manager_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  lead?: {
    full_name: string;
    email: string;
  };
  deputy?: {
    full_name: string;
    email: string;
  };
  staff_manager?: {
    full_name: string;
    email: string;
  };
  _count?: {
    members: number;
  };
}

interface ClusterTableProps {
  userRole: string;
  onClusterUpdated?: () => void;
}

export function ClusterTable({ userRole, onClusterUpdated }: ClusterTableProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterToDelete, setClusterToDelete] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    try {
      const supabase = createClient();
      const { data: clusters, error } = await supabase
        .from("clusters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch leadership information separately
      const clustersWithLeaders = await Promise.all(
        (clusters || []).map(async (cluster) => {
          const [lead, deputy, staffManager] = await Promise.all([
            cluster.lead_id ? supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", cluster.lead_id)
              .single()
              .then(({ data }) => data || null) : Promise.resolve(null),
            cluster.deputy_id ? supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", cluster.deputy_id)
              .single()
              .then(({ data }) => data || null) : Promise.resolve(null),
            cluster.staff_manager_id ? supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", cluster.staff_manager_id)
              .single()
              .then(({ data }) => data || null) : Promise.resolve(null),
          ]);

          const [memberCount] = await Promise.all([
            supabase
              .from("cluster_members")
              .select("*", { count: "exact", head: true })
              .eq("cluster_id", cluster.id)
              .eq("status", "approved"),
          ]);

          return {
            ...cluster,
            lead,
            deputy,
            staff_manager: staffManager,
            _count: {
              members: memberCount[0]?.count || 0,
            },
          };
        })
      );

      setClusters(clustersWithLeaders);
    } catch (error) {
      console.error("Error fetching clusters:", error);
      toast.error("Failed to load clusters");
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

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
      fetchClusters();
      onClusterUpdated?.();
    } catch (error: any) {
      console.error("Error deleting cluster:", error);
      toast.error(error.message || "Failed to delete cluster");
    } finally {
      setClusterToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditCluster = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setEditDialogOpen(true);
  };

  const handleViewMembers = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    setMembersDialogOpen(true);
  };

  const getMemberCount = (cluster: Cluster) => {
    return cluster.cluster_members?.length || 0;
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Staff Manager</TableHead>
              <TableHead>Lead Student</TableHead>
              <TableHead>Deputy Lead</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clusters.map((cluster) => (
              <TableRow key={cluster.id}>
                <TableCell className="font-medium">{cluster.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {cluster.description || "No description"}
                </TableCell>
                <TableCell>
                  {cluster.staff_manager ? (
                    <div>
                      <div className="font-medium">{cluster.staff_manager.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {cluster.staff_manager.email}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline">Not assigned</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {cluster.lead ? (
                    <div>
                      <div className="font-medium">{cluster.lead.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {cluster.lead.email}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline">Not assigned</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {cluster.deputy ? (
                    <div>
                      <div className="font-medium">{cluster.deputy.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {cluster.deputy.email}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline">Not assigned</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{getMemberCount(cluster)}</span>
                  </div>
                </TableCell>
                <TableCell>
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
                      {(userRole === "admin" || userRole === "staff") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditCluster(cluster)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Cluster
                          </DropdownMenuItem>
                          {userRole === "admin" && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(cluster.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Cluster
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedCluster && (
        <>
          <EditClusterDialog
            cluster={selectedCluster}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onClusterUpdated={() => {
              fetchClusters();
              onClusterUpdated?.();
            }}
          />
          <ClusterMembersDialog
            cluster={selectedCluster}
            open={membersDialogOpen}
            onOpenChange={setMembersDialogOpen}
            onMembersUpdated={() => {
              fetchClusters();
              onClusterUpdated?.();
            }}
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
    </>
  );
}