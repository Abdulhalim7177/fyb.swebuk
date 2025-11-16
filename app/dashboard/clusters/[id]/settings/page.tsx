"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

export default function ClusterSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cluster, setCluster] = useState<DetailedCluster | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: ""
  });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get user info
        const { user, role } = await getUser();
        setUser(user);
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
        setFormData({
          name: clusterData.name || "",
          description: clusterData.description || "",
          status: clusterData.status || "active"
        });

        // Check if user has permission to manage this cluster
        const hasPermission = role === 'admin' ||
                             role === 'staff' ||
                             clusterData.lead_id === user.id ||
                             clusterData.deputy_id === user.id ||
                             clusterData.staff_manager_id === user.id;

        if (!hasPermission) {
          setError("You don't have permission to manage this cluster");
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

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userRole || !cluster) return;
      
      try {
        setLoadingUsers(true);
        
        const supabase = createClient();
        
        // Fetch all users who could be assigned to leadership positions
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            role
          `)
          .in("role", ["student", "staff"]) // Only students and staff can be leaders
          .neq("id", cluster.lead_id) // Exclude current lead
          .neq("id", cluster.deputy_id) // Exclude current deputy
          .neq("id", cluster.staff_manager_id); // Exclude current staff manager

        if (error) throw error;

        setAllUsers(data || []);
        setAvailableUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [userRole, cluster]);

  const canManage = userRole === 'admin' || 
                   userRole === 'staff' || 
                   cluster?.lead_id === user?.id || 
                   cluster?.deputy_id === user?.id ||
                   cluster?.staff_manager_id === user?.id;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("clusters")
        .update({
          name: formData.name,
          description: formData.description,
          status: formData.status
        })
        .eq("id", clusterId);

      if (error) throw error;

      toast.success("Cluster updated successfully");
      router.push(`/dashboard/clusters/${clusterId}`); // Redirect back to cluster page
    } catch (error: any) {
      console.error("Error updating cluster:", error);
      toast.error("Failed to update cluster: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading cluster settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/30 max-w-md">
          <p className="text-destructive">{error}</p>
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
          <p className="mt-4">Loading cluster settings...</p>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-destructive/10 rounded-lg border border-destructive/30 max-w-md">
          <p className="text-destructive">You don't have permission to manage this cluster</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push(`/dashboard/clusters/${clusterId}`)}
          >
            Back to Cluster
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cluster Settings</h1>
          <p className="text-muted-foreground">
            Manage settings for {cluster.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cluster Information</CardTitle>
          <CardDescription>Update the basic information about this cluster</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Cluster Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this cluster focuses on..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push(`/dashboard/clusters/${clusterId}`)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Leadership Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Leadership</CardTitle>
          <CardDescription>Manage the leadership team for this cluster</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full"></span>
                Lead Student
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm">
                    {cluster.lead_name || "Not assigned"}
                    {cluster.lead_email && <span className="text-muted-foreground block text-xs">{cluster.lead_email}</span>}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full"></span>
                Deputy Lead
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm">
                    {cluster.deputy_name || "Not assigned"}
                    {cluster.deputy_email && <span className="text-muted-foreground block text-xs">{cluster.deputy_email}</span>}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <span className="h-2 w-2 bg-primary rounded-full"></span>
                Staff Manager
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm">
                    {cluster.staff_manager_name || "Not assigned"}
                    {cluster.staff_manager_email && <span className="text-muted-foreground block text-xs">{cluster.staff_manager_email}</span>}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}