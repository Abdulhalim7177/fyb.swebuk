"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { CreateClusterDialog } from "@/components/clusters/create-cluster-dialog";
import { ClusterTable } from "@/components/clusters/cluster-table";
import { createClient } from "@/lib/supabase/client";
import { ClusterCount, ActiveMembersCount, PendingRequestsCount, StaffManagedCount } from "@/components/clusters/cluster-stats";

async function getUserRole() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Fetch role from profiles table instead of user metadata
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    // Fallback to user metadata if profile is not found
    return user.user_metadata?.role || "student";
  }

  return profileData.role || 'student';
}

export default function StaffClustersPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role);
        if (role === "admin" || role === "staff") {
          setAuthorized(true);
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Access denied</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cluster Management</h1>
          <p className="text-muted-foreground">
            Manage clusters, assign leaders, and oversee student participation.
          </p>
        </div>
        <CreateClusterDialog onClusterCreated={() => window.location.reload()}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Cluster
          </Button>
        </CreateClusterDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clusters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="Loading...">
                <ClusterCount />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="Loading...">
                <ActiveMembersCount />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="Loading...">
                <PendingRequestsCount />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Managed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Suspense fallback="Loading...">
                <MyManagedCount userId={user?.id || ""} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clusters</CardTitle>
          <CardDescription>
            View and manage all clusters in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback="Loading clusters...">
            <ClusterTable
              userRole={userRole || "staff"}
              onClusterUpdated={() => window.location.reload()}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

