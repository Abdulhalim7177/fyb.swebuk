"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, MoreHorizontal, User, FileText, Calendar, GitBranch, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RequestItem {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  approved_at: string | null;
  full_name: string;
  email: string;
  academic_level: string;
  type: 'member';
}

interface ClusterRequestsListProps {
  clusterId: string;
  userRole: string;
  canManage: boolean;
}

export function ClusterRequestsList({ clusterId, userRole, canManage }: ClusterRequestsListProps) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);

        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // First, fetch the cluster members with pending status
        let clusterMembersData: any[] = [];
        let clusterMembersError: any = null;

        try {
          const response = await supabase
            .from("cluster_members")
            .select(`
              id,
              user_id,
              role,
              status,
              joined_at,
              approved_at
            `)
            .eq("cluster_id", clusterId)
            .eq("status", "pending")
            .order("joined_at", { ascending: false });

          clusterMembersData = response.data;
          clusterMembersError = response.error;
        } catch (err) {
          console.error("Exception during cluster members fetch:", err);
          clusterMembersError = err;
        }

        if (clusterMembersError) {
          console.error("Error fetching cluster members:", clusterMembersError);
          console.error("Error details:", {
            message: clusterMembersError.message,
            code: clusterMembersError.code,
            details: clusterMembersError.details
          });
          toast.error("Failed to load pending requests");
          return;
        }

        // If we have cluster members, now fetch the profile data
        if (clusterMembersData && clusterMembersData.length > 0) {
          // Extract user IDs to fetch profiles
          const userIds = clusterMembersData.map(member => member.user_id);

          let profileData: any[] = [];
          let profileError: any = null;

          try {
            const profileResponse = await supabase
              .from("public_profiles_with_email")
              .select("id, full_name, email, academic_level")
              .in("id", userIds);

            profileData = profileResponse.data;
            profileError = profileResponse.error;
          } catch (err) {
            console.error("Exception during profile fetch:", err);
            profileError = err;
          }

          if (profileError) {
            console.error("Error fetching profile data:", profileError);
            console.error("Error details:", {
              message: profileError.message,
              code: profileError.code,
              details: profileError.details
            });
            // Still set the requests with placeholder data
            setRequests(
              clusterMembersData.map((member: any) => ({
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                status: member.status,
                joined_at: member.joined_at,
                approved_at: member.approved_at,
                full_name: 'User Not Found',
                email: 'N/A',
                academic_level: 'N/A',
                type: 'member'
              }))
            );
            return;
          }

          // Combine the cluster member data with profile data
          const combinedRequests = clusterMembersData.map((member: any) => {
            const profile = profileData?.find(p => p.id === member.user_id);
            return {
              id: member.id,
              user_id: member.user_id,
              role: member.role,
              status: member.status,
              joined_at: member.joined_at,
              approved_at: member.approved_at,
              full_name: profile?.full_name || 'User Not Found',
              email: profile?.email || 'N/A',
              academic_level: profile?.academic_level || 'N/A',
              type: 'member'
            };
          });

          setRequests(combinedRequests);
        } else {
          // No pending requests found
          setRequests([]);
        }
      } catch (error: any) {
        console.error("Error fetching pending requests:", error);
        toast.error("Failed to load pending requests");
      } finally {
        setLoading(false);
      }
    };

    if (clusterId) {
      fetchRequests();
    }
  }, [clusterId]);

  const handleApproveRequest = async (requestId: string) => {
    if (!['admin', 'staff', 'lead'].includes(userRole)) {
      toast.error("You don't have permission to approve requests.");
      return;
    }
    try {
      console.log("Attempting to approve request with ID:", requestId);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const { error, status } = await supabase
        .from("cluster_members")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq("id", requestId);

      console.log("Update operation result:", { error, status });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success("Request approved successfully");
      // Refresh the requests list
      const updatedRequests = requests.filter(req => req.id !== requestId);
      setRequests(updatedRequests);
      console.log("Approved request removed from UI");
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request: " + error.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!['admin', 'staff', 'lead'].includes(userRole)) {
      toast.error("You don't have permission to reject requests.");
      return;
    }
    try {
      const { error } = await supabase
        .from("cluster_members")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Request rejected");
      // Refresh the requests list
      const updatedRequests = requests.filter(req => req.id !== requestId);
      setRequests(updatedRequests);
    } catch (error: any) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      console.log("Attempting to cancel request with ID:", requestId);

      // Since users may not have permission to delete, update status to rejected instead
      const { error, status } = await supabase
        .from("cluster_members")
        .update({ status: "rejected" })
        .eq("id", requestId)
        .eq("user_id", currentUserId); // Ensure user can only update their own request

      console.log("Update operation result:", { error, status });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success("Request cancelled successfully");
      // Remove the request from the list
      const updatedRequests = requests.filter(req => req.id !== requestId);
      setRequests(updatedRequests);
      console.log("Request removed from UI");
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      toast.error("Failed to cancel request: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b bg-muted/30">
        <h3 className="text-lg font-semibold">Cluster Requests</h3>
        <p className="text-sm text-muted-foreground">Pending requests awaiting approval</p>
      </div>
      <div className="divide-y">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No pending requests in this cluster.
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-medium">{request.full_name}</span>
                  <span className="text-xs text-muted-foreground">{request.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{request.academic_level || "N/A"}</Badge>
                  <Badge variant="secondary">
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canManage ? (
                  // Show approve/reject buttons for managers
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  // For non-managers, show cancel button for their own request
                  // (They only see their own pending requests based on filtering)
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelRequest(request.id)}
                  >
                    Cancel Request
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}