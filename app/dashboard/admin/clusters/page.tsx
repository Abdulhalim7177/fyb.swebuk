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

import { ClusterGrid } from "@/components/clusters/cluster-grid"; // Will create this component



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

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Cluster Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage clusters, assign leaders, and oversee student participation.
        </p>
      </div>

      {/* Centered Creation Button */}
      <div className="flex justify-center">
        <CreateClusterDialog onClusterCreated={() => window.location.reload()}>
          <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg px-8 py-2 text-sm md:text-base">
            <Plus className="mr-2 h-4 w-4" />
            Create Cluster
          </Button>
        </CreateClusterDialog>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 sm:flex-initial sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
          <Input
            placeholder="Search clusters by name, staff, or leaders..."
            className="pl-9 pr-4 py-2 w-full sm:w-full md:w-full lg:w-full border-gray-200 focus:border-emerald-500 focus:ring-emerald-100 dark:border-gray-700 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/20 min-w-[200px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px] border-gray-200 focus:border-emerald-500 focus:ring-emerald-100 dark:border-gray-700 dark:focus:border-emerald-400 dark:focus:ring-emerald-900/20">
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



                userRole={userRole || "admin"}



                searchTerm={searchTerm}



                filterStatus={filterStatus}



              />



            </Suspense>

    </div>

  );

}

