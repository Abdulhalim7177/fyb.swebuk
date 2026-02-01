"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { StudentClusterView } from "@/components/clusters/student-cluster-view";
import { StaffClusterView } from "@/components/clusters/staff-cluster-view";
import { AdminClusterView } from "@/components/clusters/admin-cluster-view";

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
  full_name?: string;
  avatar_url?: string | null;
}

async function getUser() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return { 
      user, 
      role: user.user_metadata?.role || "student", 
      fullName: user.user_metadata?.full_name || user.email,
      avatarUrl: user.user_metadata?.avatar_url 
    };
  }

  return { 
    user, 
    role: profileData.role || 'student', 
    fullName: profileData.full_name || user.user_metadata?.full_name || user.email,
    avatarUrl: profileData.avatar_url
  };
}

export default function ClusterInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [cluster, setCluster] = useState<DetailedCluster | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userMembershipStatus, setUserMembershipStatus] = useState<string | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paramsResolved, setParamsResolved] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get user info
        const { user, role, fullName, avatarUrl } = await getUser();
        setUser({ 
          id: user.id, 
          role: role, 
          full_name: fullName, 
          avatar_url: avatarUrl 
        });
        setUserRole(role);

        // Get cluster ID from URL params
        const { id } = await params;
        setParamsResolved({ id });
        const clusterId = id;

        // Fetch cluster info
        const supabase = createClient();
        const { data: clusterData, error: clusterError } = await supabase
          .from("detailed_clusters")
          .select("*")
          .eq("id", clusterId)
          .single();

        if (clusterError || !clusterData) {
          setError("Cluster not found");
          return;
        }

        setCluster(clusterData);

        // Check if user is a member of this cluster
        // Only consider approved memberships - pending requests should not count as membership
        if (user.id) {
          // Check for approved membership
          const { data: membershipData, error: membershipError } = await supabase
            .from("cluster_members")
            .select("status")
            .eq("cluster_id", clusterId)
            .eq("user_id", user.id)
            .eq("status", "approved")
            .maybeSingle();

          // Check for pending request
          const { data: pendingData } = await supabase
            .from("cluster_members")
            .select("status")
            .eq("cluster_id", clusterId)
            .eq("user_id", user.id)
            .eq("status", "pending")
            .maybeSingle();

          if (membershipData && membershipData.status === "approved") {
            setIsMember(true);
            setUserMembershipStatus(membershipData.status);
            setHasPendingRequest(false);
          } else if (pendingData && pendingData.status === "pending") {
            setIsMember(false); // Not a member yet
            setUserMembershipStatus("pending");
            setHasPendingRequest(true);
          } else {
            setIsMember(false);
            setUserMembershipStatus(null);
            setHasPendingRequest(false);
          }
        }
      } catch (err) {
        console.error("Error fetching cluster data:", err);
        setError("Failed to load cluster information");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleJoin = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: cluster!.id,
          user_id: user.id,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          toast.error("You have already requested to join this cluster.");
        } else {
          throw error;
        }
      } else {
        toast.success("Request to join cluster sent! Wait for approval.");
        // Update membership status - user has pending request but is not yet a member
        setIsMember(false); // Not a member yet (only approved members see Requests tab)
        setUserMembershipStatus("pending");
        setHasPendingRequest(true);
      }
    } catch (error: any) {
      console.error("Error joining cluster:", error);
      toast.error("Failed to join cluster: " + error.message);
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cluster_members")
        .delete()
        .eq("cluster_id", cluster!.id)
        .eq("user_id", user.id)
        .select();

      if (error) throw error;

      const message = userMembershipStatus === "pending" ? "Request cancelled successfully" : "Successfully left the cluster";
      toast.success(message);
      // Update membership status - this will also hide the Requests tab
      setIsMember(false);
      setUserMembershipStatus(null);
      setHasPendingRequest(false);
    } catch (error: any) {
      console.error("Error leaving cluster:", error);
      toast.error("Failed to leave cluster: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500"></div>
          <p className="text-slate-400">Loading cluster information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">Cluster Not Found</h3>
          <p className="text-slate-400 mt-2">{error}</p>
          <button
            className="mt-4 px-6 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-medium transition-all duration-300 hover:scale-105"
            onClick={() => router.push("/dashboard/clusters")}
          >
            Back to Clusters
          </button>
        </div>
      </div>
    );
  }

  if (!cluster || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500"></div>
          <p className="text-slate-400">Loading cluster information...</p>
        </div>
      </div>
    );
  }

  // Determine if user can manage this cluster (only admins, cluster leads, deputy leads, and assigned staff managers)
  const canManage = userRole === 'admin' ||
                   cluster.lead_id === user.id ||
                   cluster.deputy_id === user.id ||
                   cluster.staff_manager_id === user.id;

  // Determine if user can manage projects specifically (only admins and staff managers)
  const canManageProjects = userRole === 'admin' ||
                           cluster.staff_manager_id === user.id;

  // Render different views based on role
  if (userRole === 'admin') {
    return (
      <AdminClusterView
        cluster={cluster}
        user={user}
        isMember={isMember}
        hasPendingRequest={hasPendingRequest}
        userMembershipStatus={userMembershipStatus}
        canManage={canManage}
        canManageProjects={canManageProjects}
        onJoin={handleJoin}
        onLeave={handleLeave}
      />
    );
  }

  if (userRole === 'staff') {
    return (
      <StaffClusterView
        cluster={cluster}
        user={user}
        isMember={isMember}
        hasPendingRequest={hasPendingRequest}
        userMembershipStatus={userMembershipStatus}
        canManage={canManage}
        canManageProjects={canManageProjects}
        onJoin={handleJoin}
        onLeave={handleLeave}
      />
    );
  }

  // Default to student view for lead, deputy, and student roles
  return (
    <StudentClusterView
      cluster={cluster}
      user={user}
      isMember={isMember}
      hasPendingRequest={hasPendingRequest}
      userMembershipStatus={userMembershipStatus}
      canManageProjects={canManageProjects}
      onJoin={handleJoin}
      onLeave={handleLeave}
    />
  );
}
