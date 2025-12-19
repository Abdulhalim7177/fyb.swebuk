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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectGrid } from "@/components/projects/project-grid";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Search, FolderGit2, User } from "lucide-react";

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

interface Cluster {
  id: string;
  name: string;
}

export default function AllProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCluster, setFilterCluster] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user, role } = await getUser();
        setUser(user);
        setUserRole(role);

        // Fetch clusters for filter
        const supabase = createClient();
        const { data: clustersData } = await supabase
          .from("clusters")
          .select("id, name")
          .eq("status", "active")
          .order("name");

        setClusters(clustersData || []);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle URL tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "personal" || tab === "cluster" || tab === "all") {
      setActiveTab(tab);
    }
  }, []);

  const handleProjectCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Browse and manage projects across the community.
          </p>
        </div>
        {user && userRole && (
          <CreateProjectDialog
            userRole={userRole}
            userId={user.id}
            onProjectCreated={handleProjectCreated}
          />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Projects
          </TabsTrigger>
          <TabsTrigger value="cluster" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Cluster Projects
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" />
            All Projects
          </TabsTrigger>
        </TabsList>

        {/* Personal Projects Tab */}
        <TabsContent value="personal" className="space-y-4 mt-6">
          <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
          <Input
            placeholder="Search by name, description, user, email, or level..."
            className="pl-9 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] border-purple-200 focus:border-purple-500 focus:ring-purple-100">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="personal">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Personal
              </span>
            </SelectItem>
            <SelectItem value="cluster">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Cluster
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] border-green-200 focus:border-green-500 focus:ring-green-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Active
              </span>
            </SelectItem>
            <SelectItem value="completed">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Completed
              </span>
            </SelectItem>
            <SelectItem value="on_hold">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                On Hold
              </span>
            </SelectItem>
            <SelectItem value="archived">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                Archived
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCluster} onValueChange={setFilterCluster}>
          <SelectTrigger className="w-[180px] border-cyan-200 focus:border-cyan-500 focus:ring-cyan-100">
            <SelectValue placeholder="Cluster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clusters</SelectItem>
            {clusters.map((cluster) => (
              <SelectItem key={cluster.id} value={cluster.id}>
                {cluster.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVisibility} onValueChange={setFilterVisibility}>
          <SelectTrigger className="w-[160px] border-amber-200 focus:border-amber-500 focus:ring-amber-100">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="public">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Public
              </span>
            </SelectItem>
            <SelectItem value="private">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Private
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

          <Suspense fallback="Loading projects...">
            <ProjectGrid
              key={`personal-${refreshKey}`}
              searchTerm={searchTerm}
              filterType="personal"
              filterStatus={filterStatus}
              filterCluster={filterCluster}
              filterVisibility={filterVisibility}
              userId={user?.id}
              showMyProjects={true}
            />
          </Suspense>
        </TabsContent>

        {/* Cluster Projects Tab */}
        <TabsContent value="cluster" className="space-y-4 mt-6">
          <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
          <Input
            placeholder="Search by name, description, user, email, or level..."
            className="pl-9 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] border-green-200 focus:border-green-500 focus:ring-green-100">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Active
              </span>
            </SelectItem>
            <SelectItem value="completed">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Completed
              </span>
            </SelectItem>
            <SelectItem value="on_hold">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                On Hold
              </span>
            </SelectItem>
            <SelectItem value="archived">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                Archived
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCluster} onValueChange={setFilterCluster}>
          <SelectTrigger className="w-[180px] border-cyan-200 focus:border-cyan-500 focus:ring-cyan-100">
            <SelectValue placeholder="Cluster" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clusters</SelectItem>
            {clusters.map((cluster) => (
              <SelectItem key={cluster.id} value={cluster.id}>
                {cluster.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterVisibility} onValueChange={setFilterVisibility}>
          <SelectTrigger className="w-[160px] border-amber-200 focus:border-amber-500 focus:ring-amber-100">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="public">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Public
              </span>
            </SelectItem>
            <SelectItem value="private">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Private
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

          <Suspense fallback="Loading projects...">
            <ProjectGrid
              key={`cluster-${refreshKey}`}
              searchTerm={searchTerm}
              filterType="cluster"
              filterStatus={filterStatus}
              filterCluster={filterCluster}
              filterVisibility={filterVisibility}
              userId={user?.id}
              showMyProjects={true}
            />
          </Suspense>
        </TabsContent>

        {/* All Projects Tab */}
        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-600" />
              <Input
                placeholder="Search by name, description, user, email, or level..."
                className="pl-9 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px] border-purple-200 focus:border-purple-500 focus:ring-purple-100">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="personal">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Personal
                  </span>
                </SelectItem>
                <SelectItem value="cluster">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Cluster
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] border-green-200 focus:border-green-500 focus:ring-green-100">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Active
                  </span>
                </SelectItem>
                <SelectItem value="completed">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Completed
                  </span>
                </SelectItem>
                <SelectItem value="on_hold">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    On Hold
                  </span>
                </SelectItem>
                <SelectItem value="archived">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    Archived
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCluster} onValueChange={setFilterCluster}>
              <SelectTrigger className="w-[180px] border-cyan-200 focus:border-cyan-500 focus:ring-cyan-100">
                <SelectValue placeholder="Cluster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clusters</SelectItem>
                {clusters.map((cluster) => (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    {cluster.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterVisibility} onValueChange={setFilterVisibility}>
              <SelectTrigger className="w-[160px] border-amber-200 focus:border-amber-500 focus:ring-amber-100">
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Public
                  </span>
                </SelectItem>
                <SelectItem value="private">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Private
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Suspense fallback="Loading projects...">
            <ProjectGrid
              key={refreshKey}
              searchTerm={searchTerm}
              filterType={filterType}
              filterStatus={filterStatus}
              filterCluster={filterCluster}
              filterVisibility={filterVisibility}
              userId={user?.id}
              showMyProjects={false}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
