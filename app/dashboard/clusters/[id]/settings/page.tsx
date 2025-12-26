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
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Users, Check, X, Settings, Trash2, AlertTriangle, Search, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  // Leadership management states
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showDeputyDialog, setShowDeputyDialog] = useState(false);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState("");
  const [selectedDeputy, setSelectedDeputy] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [updatingRole, setUpdatingRole] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

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
        const { data: allUsersData, error: allUsersError } = await supabase
          .from("public_profiles_with_email")
          .select("id, full_name, email, role")
          .in("role", ["student", "staff"]); // Only students and staff can be leaders

        if (allUsersError) throw allUsersError;

        // Fetch only cluster members
        const { data: clusterMembersData, error: clusterMembersError } = await supabase
          .from("cluster_members")
          .select("user_id")
          .eq("cluster_id", cluster.id)
          .eq("status", "approved"); // Only approved members

        if (clusterMembersError) throw clusterMembersError;

        // Get the list of user IDs who are cluster members
        const clusterMemberIds = clusterMembersData.map(member => member.user_id);

        // Filter to only include cluster members
        const clusterMembers = allUsersData?.filter(user => clusterMemberIds.includes(user.id)) || [];

        // Filter out current leaders on the client side
        const filteredUsers = clusterMembers.filter(
          (user) =>
            user.id !== cluster.lead_id &&
            user.id !== cluster.deputy_id &&
            user.id !== cluster.staff_manager_id
        );

        setAllUsers(allUsersData || []);
        setAvailableUsers(filteredUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [userRole, cluster]);

  useEffect(() => {
    // Filter to find users who are NOT already cluster members and match the search query
    // This should include both students and staff who are not in the cluster
    const filtered = allUsers.filter(user =>
      (user.role === 'student' || user.role === 'staff') && // Include both students and staff
      !availableUsers.some(availableUser => availableUser.id === user.id) && // Not already a member
      user.id !== cluster?.lead_id && // Not current lead
      user.id !== cluster?.deputy_id && // Not current deputy
      user.id !== cluster?.staff_manager_id && // Not current staff manager
      (user.full_name.toLowerCase().includes(userSearchQuery.toLowerCase()) || // Name matches
       user.email.toLowerCase().includes(userSearchQuery.toLowerCase())) // Or email matches
    );

    setFilteredUsers(filtered);
  }, [allUsers, availableUsers, userSearchQuery, cluster?.id, cluster?.lead_id, cluster?.deputy_id, cluster?.staff_manager_id]);

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

  // Leadership management functions
  const handleLeadershipChange = async (role: string, newUserId: string) => {
    if (role === 'lead' && !['admin', 'staff'].includes(userRole || '')) {
      toast.error("You don't have permission to assign a lead student.");
      return;
    }
    if (!cluster || !user) return;

    try {
      setUpdatingRole(role);
      const supabase = createClient();

      // Update cluster table
      const updateData: any = {};
      if (role === 'lead') updateData.lead_id = newUserId || null;
      if (role === 'deputy') updateData.deputy_id = newUserId || null;
      if (role === 'staff') updateData.staff_manager_id = newUserId || null;

      const { error: clusterError } = await supabase
        .from("clusters")
        .update(updateData)
        .eq("id", cluster.id);

      if (clusterError) throw clusterError;

      // Update cluster_members table
      if (newUserId) {
        // Add new person to role
        const { error: memberError } = await supabase
          .from("cluster_members")
          .upsert({
            cluster_id: cluster.id,
            user_id: newUserId,
            role: role === 'staff' ? 'staff_manager' : role,
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: user.id
          }, {
            onConflict: "cluster_id, user_id"
          });

        if (memberError) throw memberError;
      }

      // If changing role, remove old person from leadership role
      const oldUserId = role === 'lead' ? cluster.lead_id :
                        role === 'deputy' ? cluster.deputy_id :
                        cluster.staff_manager_id;

      if (oldUserId && oldUserId !== newUserId) {
        const { error: removeError } = await supabase
          .from("cluster_members")
          .delete()
          .eq("cluster_id", cluster.id)
          .eq("user_id", oldUserId);

        if (removeError) throw removeError;
      }

      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} updated successfully`);

      // Update local state
      setCluster(prev => prev ? {
        ...prev,
        lead_id: role === 'lead' ? (newUserId || null) : prev.lead_id,
        lead_name: role === 'lead' ? (allUsers.find(u => u.id === newUserId)?.full_name || null) : prev.lead_name,
        lead_email: role === 'lead' ? (allUsers.find(u => u.id === newUserId)?.email || null) : prev.lead_email,
        deputy_id: role === 'deputy' ? (newUserId || null) : prev.deputy_id,
        deputy_name: role === 'deputy' ? (allUsers.find(u => u.id === newUserId)?.full_name || null) : prev.deputy_name,
        deputy_email: role === 'deputy' ? (allUsers.find(u => u.id === newUserId)?.email || null) : prev.deputy_email,
        staff_manager_id: role === 'staff' ? (newUserId || null) : prev.staff_manager_id,
        staff_manager_name: role === 'staff' ? (allUsers.find(u => u.id === newUserId)?.full_name || null) : prev.staff_manager_name,
        staff_manager_email: role === 'staff' ? (allUsers.find(u => u.id === newUserId)?.email || null) : prev.staff_manager_email,
      } : null);

      // Close dialog and reset
      if (role === 'lead') { setShowLeadDialog(false); setSelectedLead(""); }
      if (role === 'deputy') { setShowDeputyDialog(false); setSelectedDeputy(""); }
      if (role === 'staff') { setShowStaffDialog(false); setSelectedStaff(""); }

    } catch (error: any) {
      console.error(`Error updating ${role}:`, error);
      toast.error(`Failed to update ${role}: ${error.message}`);
    } finally {
      setUpdatingRole("");
    }
  };

  // Member management functions
  const handleAddMember = async (userId: string) => {
    if (!cluster || !user) return;

    try {
      setUpdatingRole(userId);
      const supabase = createClient();

      // Add user to cluster as a regular member
      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: cluster.id,
          user_id: userId,
          role: "member", // Default role for regular members
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id
        });

      if (error) throw error;

      toast.success("Member added successfully");

      // Refresh the members list
      const { data: clusterMembersData, error: clusterMembersError } = await supabase
        .from("cluster_members")
        .select("user_id")
        .eq("cluster_id", cluster.id)
        .eq("status", "approved");

      if (clusterMembersError) throw clusterMembersError;

      // Get the list of user IDs who are cluster members
      const clusterMemberIds = clusterMembersData.map(member => member.user_id);

      // Filter to only include cluster members
      const clusterMembers = allUsers?.filter(user => clusterMemberIds.includes(user.id)) || [];

      // Filter out current leaders on the client side
      const filteredUsers = clusterMembers.filter(
        (user) =>
          user.id !== cluster.lead_id &&
          user.id !== cluster.deputy_id &&
          user.id !== cluster.staff_manager_id
      );

      setAvailableUsers(filteredUsers);

      // Reset the search query and close the search dropdown
      setUserSearchQuery("");
      setUserSearchOpen(false);
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member: " + error.message);
    } finally {
      setUpdatingRole("");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!cluster || !user) return;

    try {
      setUpdatingRole(userId);
      const supabase = createClient();

      // Remove user from cluster
      const { error } = await supabase
        .from("cluster_members")
        .delete()
        .eq("cluster_id", cluster.id)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Member removed successfully");

      // Refresh the members list
      const { data: clusterMembersData, error: clusterMembersError } = await supabase
        .from("cluster_members")
        .select("user_id")
        .eq("cluster_id", cluster.id)
        .eq("status", "approved");

      if (clusterMembersError) throw clusterMembersError;

      // Get the list of user IDs who are cluster members
      const clusterMemberIds = clusterMembersData.map(member => member.user_id);

      // Filter to only include cluster members
      const clusterMembers = allUsers?.filter(user => clusterMemberIds.includes(user.id)) || [];

      // Filter out current leaders on the client side
      const filteredUsers = clusterMembers.filter(
        (user) =>
          user.id !== cluster.lead_id &&
          user.id !== cluster.deputy_id &&
          user.id !== cluster.staff_manager_id
      );

      setAvailableUsers(filteredUsers);
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member: " + error.message);
    } finally {
      setUpdatingRole("");
    }
  };

  const handleDeleteCluster = async () => {
    if (!cluster || !user || userRole !== 'admin') {
      toast.error("Only admins can delete clusters");
      return;
    }

    try {
      setDeleting(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("clusters")
        .delete()
        .eq("id", cluster.id);

      if (error) throw error;

      toast.success("Cluster deleted successfully");
      router.push("/dashboard/clusters");
    } catch (error: any) {
      console.error("Error deleting cluster:", error);
      toast.error("Failed to delete cluster: " + error.message);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cluster) {
      toast.error("Cluster data not available");
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("clusters")
        .update({
          name: formData.name,
          description: formData.description,
          status: formData.status
        })
        .eq("id", cluster.id);

      if (error) throw error;

      toast.success("Cluster updated successfully");
      router.push(`/dashboard/clusters/${cluster.id}`); // Redirect back to cluster page
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
            onClick={() => router.push(`/dashboard/clusters/${params.id}`)}
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
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Settings className="h-5 w-5" />
            </div>
            Cluster Settings
          </h1>
          <p className="text-muted-foreground">
            Manage settings and leadership for {cluster.name}
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
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">Cluster Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border-2 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this cluster focuses on..."
                className="border-2 focus:border-primary focus:ring-primary/20 resize-none"
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-semibold text-foreground">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger className="border-2 focus:border-primary focus:ring-primary/20">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Inactive
                  </SelectItem>
                  <SelectItem value="archived" className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    Archived
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/clusters/${cluster.id}`)}
                className="border-2 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Leadership Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Leadership Management
          </CardTitle>
          <CardDescription>Assign and manage leadership roles for this cluster</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3 p-4 rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
              <h4 className="font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Lead Student
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm">
                    {cluster.lead_name || "Not assigned"}
                    {cluster.lead_email && <span className="text-muted-foreground block text-xs">{cluster.lead_email}</span>}
                  </p>
                </div>
                {(userRole === 'admin' || userRole === 'staff') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowLeadDialog(true); }}
                    className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20"
                  >
                    {cluster.lead_name ? "Change" : "Assign"}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Deputy Lead
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm">
                    {cluster.deputy_name || "Not assigned"}
                    {cluster.deputy_email && <span className="text-muted-foreground block text-xs">{cluster.deputy_email}</span>}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowDeputyDialog(true); }}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/20"
                >
                  {cluster.deputy_name ? "Change" : "Assign"}
                </Button>
              </div>
            </div>
            <div className="space-y-3 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/10">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Staff Manager
              </h4>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm">
                    {cluster.staff_manager_name || "Not assigned"}
                    {cluster.staff_manager_email && <span className="text-muted-foreground block text-xs">{cluster.staff_manager_email}</span>}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowStaffDialog(true); }}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/20"
                >
                  {cluster.staff_manager_name ? "Change" : "Assign"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leadership Assignment Dialogs */}
      {/* Lead Student Dialog */}
      {showLeadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border-2 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Assign Lead Student
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLeadDialog(false)}
                className="hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Lead Student</Label>
                <Select value={selectedLead} onValueChange={setSelectedLead}>
                  <SelectTrigger className="border-amber-200 focus:border-amber-400 focus:ring-amber-100">
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter(user => user.role === 'student')
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLeadDialog(false)}
                className="border-2 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleLeadershipChange('lead', selectedLead)}
                disabled={!selectedLead || updatingRole === 'lead'}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {updatingRole === 'lead' ? 'Assigning...' : 'Assign Lead'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deputy Lead Dialog */}
      {showDeputyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border-2 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Assign Deputy Lead
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeputyDialog(false)}
                className="hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Deputy Lead</Label>
                <Select value={selectedDeputy} onValueChange={setSelectedDeputy}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400 focus:ring-purple-100">
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter(user => user.role === 'student')
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeputyDialog(false)}
                className="border-2 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleLeadershipChange('deputy', selectedDeputy)}
                disabled={!selectedDeputy || updatingRole === 'deputy'}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {updatingRole === 'deputy' ? 'Assigning...' : 'Assign Deputy'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Manager Dialog */}
      {showStaffDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border-2 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Assign Staff Manager
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStaffDialog(false)}
                className="hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Staff Manager</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-100">
                    <SelectValue placeholder="Choose a staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers
                      .filter(user => user.role === 'staff')
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStaffDialog(false)}
                className="border-2 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleLeadershipChange('staff', selectedStaff)}
                disabled={!selectedStaff || updatingRole === 'staff'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updatingRole === 'staff' ? 'Assigning...' : 'Assign Staff'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Member Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Member Management
              </CardTitle>
              <CardDescription>Add or remove members from this cluster</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="member-toggle" className="text-sm font-medium">Show Members</Label>
              <Switch
                id="member-toggle"
                checked={showMemberManagement}
                onCheckedChange={setShowMemberManagement}
              />
            </div>
          </div>
        </CardHeader>
        {showMemberManagement && (
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Add New Members</h3>

              {/* Search for users to add */}
              <div className="flex gap-2">
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-muted-foreground"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search for users to add...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px]" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by name or email..."
                        value={userSearchQuery}
                        onValueChange={setUserSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {filteredUsers.map(user => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              onSelect={(value) => {
                                const userToAdd = allUsers.find(u => u.id === value);
                                if (userToAdd) {
                                  handleAddMember(userToAdd.id);
                                }
                                setUserSearchOpen(false);
                                setUserSearchQuery("");
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              <span>{user.full_name}</span>
                              <span className="text-muted-foreground text-xs ml-2">
                                ({user.email})
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-lg font-semibold mb-4">Cluster Members ({availableUsers.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No members in this cluster</p>
                ) : (
                  availableUsers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role === 'student' && (
                          <Badge variant="secondary">Student</Badge>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={updatingRole === member.id}
                        >
                          {updatingRole === member.id ? 'Removing...' : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delete Cluster Section - Admin Only */}
      {userRole === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Cluster
            </CardTitle>
            <CardDescription>
              <span className="text-destructive font-semibold">Danger Zone:</span> This action cannot be undone. All members, projects, and events associated with this cluster will be permanently deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">
                  <strong>Warning:</strong> You are about to delete this cluster and all its data. This action is irreversible.
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  This will permanently delete:
                  <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                    <li>All cluster members</li>
                    <li>All cluster projects</li>
                    <li>All cluster events</li>
                    <li>Cluster settings and history</li>
                  </ul>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete This Cluster
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Cluster Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete "{cluster?.name || 'this cluster'}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All members, projects, and events associated with this cluster will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCluster}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Cluster'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}