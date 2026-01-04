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
import { Card, CardContent } from "@/components/ui/card";
import { ClusterGrid } from "@/components/clusters/cluster-grid";

async function getUserRole() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

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
    return user.user_metadata?.role || "student";
  }

  return profileData.role || 'student';
}

export default function AdminClustersPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/30 max-w-md">
          <p className="text-red-300 font-medium">Access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header - Reimplemented in Sleek Supabase Style */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card to-muted/40 shadow-sm">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <CardContent className="relative p-8 sm:p-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Cluster Management</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base sm:text-lg">
            Manage clusters, assign leaders, and oversee student participation across the institution.
          </p>
          <div className="mt-8">
            <CreateClusterDialog onClusterCreated={() => window.location.reload()}>
              <Button size="lg" className="rounded-xl px-8 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <Plus className="h-5 w-5 mr-2" />
                Create Cluster
              </Button>
            </CreateClusterDialog>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
          <Input
            placeholder="Search clusters by name, staff, or leaders..."
            className="pl-9 pr-4 py-2 w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 text-white">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                All Statuses
              </div>
            </SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                Active
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                Inactive
              </div>
            </SelectItem>
            <SelectItem value="archived">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                Archived
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Suspense fallback={<div className="text-center py-20">Loading clusters...</div>}>
        <ClusterGrid
          userRole={userRole || "admin"}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
        />
      </Suspense>
    </div>
  );
}