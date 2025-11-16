"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Crown,
  Shield,
  Calendar,
  FileText,
  Settings,
  Search,
  Plus,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClusterMembersList } from "@/components/clusters/cluster-members-list";
import { ClusterProjectsList } from "@/components/clusters/cluster-projects-list";
import { ClusterEventsList } from "@/components/clusters/cluster-events-list";

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

async function getUser() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return { user, role: user.user_metadata?.role || "student", fullName: user.user_metadata?.full_name || user.email };
  }

  return { user, role: profileData.role || 'student', fullName: profileData.full_name || user.user_metadata?.full_name || user.email };
}

export default function ClusterInfoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cluster, setCluster] = useState<DetailedCluster | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userMembershipStatus, setUserMembershipStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get user info
        const { user, role } = await getUser();
        setUser({ id: user.id, role: role });
        setUserRole(role);

        // Get cluster ID from URL params
        const { id } = await params;
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
        if (user.id) {
          const { data: membershipData, error: membershipError } = await supabase
            .from("cluster_members")
            .select("status")
            .eq("cluster_id", clusterId)
            .eq("user_id", user.id)
            .single();

          if (membershipData) {
            setIsMember(true);
            setUserMembershipStatus(membershipData.status);
          } else {
            setIsMember(false);
            setUserMembershipStatus(null);
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

  const handleJoinCluster = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: clusterId,
          user_id: user.id,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") { // Unique constraint violation
          alert("You have already requested to join this cluster.");
        } else {
          throw error;
        }
      } else {
        alert("Request to join cluster sent! Wait for approval.");
        // Update membership status
        setIsMember(true);
        setUserMembershipStatus("pending");
      }
    } catch (error: any) {
      console.error("Error joining cluster:", error);
      alert("Failed to join cluster: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading cluster information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/30 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive">Cluster Not Found</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push("/dashboard/clusters")}
          >
            Back to Clusters
          </Button>
        </div>
      </div>
    );
  }

  if (!cluster) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading cluster information...</p>
        </div>
      </div>
    );
  }

  const canManage = userRole === 'admin' || 
                   userRole === 'staff' || 
                   cluster.lead_id === user?.id || 
                   cluster.deputy_id === user?.id ||
                   cluster.staff_manager_id === user?.id;

  return (
    <div className="space-y-6">
      {/* Cluster Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{cluster.name}</h1>
            <Badge variant={cluster.status === "active" ? "default" : cluster.status === "inactive" ? "secondary" : "destructive"}>
              {cluster.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{cluster.description || "No description provided."}</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="outline" asChild>
              <a href={`/dashboard/clusters/${cluster.id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </a>
            </Button>
          )}
          {!isMember && userRole === 'student' && (
            <Button onClick={handleJoinCluster}>
              <Plus className="mr-2 h-4 w-4" />
              Join Cluster
            </Button>
          )}
          {isMember && userMembershipStatus === "pending" && (
            <Button variant="outline" disabled>
              Request Sent
            </Button>
          )}
        </div>
      </div>

      {/* Cluster Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cluster.members_count}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(cluster.created_at).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(cluster.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lead</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate max-w-[160px]">
              {cluster.lead_name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {cluster.lead_email || "Not assigned"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Manager</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate max-w-[160px]">
              {cluster.staff_manager_name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {cluster.staff_manager_email || "Not assigned"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cluster Management Info */}
      <Card>
        <CardHeader>
          <CardTitle>Cluster Management</CardTitle>
          <CardDescription>Information about cluster leadership and management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                Lead Student
              </h4>
              <p className="text-sm text-muted-foreground">
                {cluster.lead_name || "Not assigned"}
              </p>
              <p className="text-xs text-muted-foreground">
                {cluster.lead_email || "Email not available"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Deputy Lead
              </h4>
              <p className="text-sm text-muted-foreground">
                {cluster.deputy_name || "Not assigned"}
              </p>
              <p className="text-xs text-muted-foreground">
                {cluster.deputy_email || "Email not available"}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Staff Manager
              </h4>
              <p className="text-sm text-muted-foreground">
                {cluster.staff_manager_name || "Not assigned"}
              </p>
              <p className="text-xs text-muted-foreground">
                {cluster.staff_manager_email || "Email not available"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Members, Projects, Events */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cluster Activities</h2>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              className="w-64"
            />
          </div>
        </div>

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({cluster.members_count})
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-4">
            <ClusterMembersList clusterId={cluster.id} userRole={userRole || "student"} canManage={canManage} />
          </TabsContent>
          <TabsContent value="projects" className="mt-4">
            <ClusterProjectsList clusterId={cluster.id} userRole={userRole || "student"} />
          </TabsContent>
          <TabsContent value="events" className="mt-4">
            <ClusterEventsList clusterId={cluster.id} userRole={userRole || "student"} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}