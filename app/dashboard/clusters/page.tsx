"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Search } from "lucide-react";

async function getUser() {
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
    return { user, role: user.user_metadata?.role || "student" };
  }

  return { user, role: profileData.role || 'student' };
}

export default function AllClustersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, role } = await getUser();
        setUser(user);
        setUserRole(role);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Clusters</h1>
          <p className="text-muted-foreground">
            Browse and join clusters to get involved in the community.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
          <Input
            placeholder="Search clusters by name, staff, or leaders..."
            className="pl-9 border-gray-200 focus:border-emerald-500 focus:ring-emerald-100 dark:border-gray-700 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px] border-gray-200 focus:border-emerald-500 focus:ring-emerald-100 dark:border-gray-700 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/20">
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
                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                Active
              </div>
            </SelectItem>
            <SelectItem value="inactive" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Suspense fallback="Loading clusters...">
        <ClusterGrid
          userRole={userRole || "student"}
          userId={user?.id}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          showJoinButton={true}
        />
      </Suspense>
    </div>
  );
}