"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { CreateClusterDialog } from "@/components/clusters/create-cluster-dialog";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClusterGrid } from "@/components/clusters/cluster-grid";

async function getUser() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return { user, role: user.user_metadata?.role || "student" };
  }

  return { user, role: profileData.role || 'student' };
}

export default function StaffClustersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, role } = await getUser();
        setUser(user);
        setUserRole(role);
        if (role === "staff") {
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
            Manage clusters you are assigned to and view all other clusters.
          </p>
        </div>
        <CreateClusterDialog onClusterCreated={() => window.location.reload()}>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Create Cluster
          </Button>
        </CreateClusterDialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
          <Input
            placeholder="Search clusters by name, staff, or leaders..."
            className="pl-9 border-blue-200 focus:border-blue-400 focus:ring-blue-100 dark:border-blue-800 dark:focus:border-blue-600 dark:focus:ring-blue-900/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] border-blue-200 focus:border-blue-400 focus:ring-blue-100 dark:border-blue-800 dark:focus:border-blue-600 dark:focus:ring-blue-900/20">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                All Statuses
              </div>
            </SelectItem>
            <SelectItem value="active" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Active
              </div>
            </SelectItem>
            <SelectItem value="inactive" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Inactive
              </div>
            </SelectItem>
            <SelectItem value="archived" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                Archived
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Suspense fallback="Loading clusters...">
        <ClusterGrid
          userRole={userRole || "staff"}
          userId={user?.id}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
        />
      </Suspense>
    </div>
  );
}