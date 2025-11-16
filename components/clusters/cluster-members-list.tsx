"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ClusterMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  approved_at: string | null;
  full_name: string;
  email: string;
  academic_level: string;
  user_role: string;
  avatar_url?: string;
}

interface ClusterMembersListProps {
  clusterId: string;
  userRole: string;
  canManage: boolean;
}

export function ClusterMembersList({ clusterId, userRole, canManage }: ClusterMembersListProps) {
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);

        // Fetch cluster members using the detailed_cluster_members view (similar to cluster-members-dialog.tsx)
        const { data, error } = await supabase
          .from("detailed_cluster_members")
          .select("*")
          .eq("cluster_id", clusterId)
          .order("joined_at", { ascending: false });

        if (error) {
          console.error("Error fetching cluster members:", error);
          toast.error("Failed to load cluster members");
          return;
        }

        if (data) {
          setMembers(
            data.map((member: any) => ({
              id: member.id,
              user_id: member.user_id,
              role: member.role,
              status: member.status,
              joined_at: member.joined_at,
              approved_at: member.approved_at,
              full_name: member.full_name || 'User Not Found',
              email: member.email || 'N/A',
              academic_level: member.academic_level || 'N/A',
              user_role: member.user_role,
              avatar_url: member.avatar_url
            }))
          );
        }
      } catch (error: any) {
        console.error("Error fetching cluster members:", error);
        toast.error("Failed to load cluster members");
      } finally {
        setLoading(false);
      }
    };

    if (clusterId) {
      fetchMembers();
    }
  }, [clusterId]);

  const handleApproveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("cluster_members")
        .update({
          status: "approved",
          approved_at: new Date().toISOString()
        })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member approved successfully");
      // Refresh the members list
      const updatedMembers = members.map(member =>
        member.id === memberId ? { ...member, status: "approved", approved_at: new Date().toISOString() } : member
      );
      setMembers(updatedMembers);
    } catch (error: any) {
      console.error("Error approving member:", error);
      toast.error("Failed to approve member");
    }
  };

  const handleRejectMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("cluster_members")
        .update({ status: "rejected" })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member request rejected");
      // Refresh the members list
      const updatedMembers = members.map(member =>
        member.id === memberId ? { ...member, status: "rejected" } : member
      );
      setMembers(updatedMembers);
    } catch (error: any) {
      console.error("Error rejecting member:", error);
      toast.error("Failed to reject member");
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
        <h3 className="text-lg font-semibold">Cluster Members</h3>
        <p className="text-sm text-muted-foreground">List of all members in this cluster</p>
      </div>
      <div className="divide-y">
        {members.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No members in this cluster yet.
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="font-medium">{member.full_name}</span>
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{member.academic_level || "N/A"}</Badge>
                  <Badge variant={member.status === "approved" ? "default" :
                                member.status === "pending" ? "secondary" : "destructive"}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {canManage && member.status === "pending" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproveMember(member.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {canManage && member.status === "approved" && (
                <Badge variant="default">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</Badge>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}