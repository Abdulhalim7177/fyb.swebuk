"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal, UserPlus, UserMinus, Crown, Shield, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface ClusterMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  approved_at?: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  user_role: string;
}

interface DetailedCluster {
  id: string;
  name: string;
  description: string;
  created_at: string;
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

interface ClusterMembersDialogProps {
  cluster: DetailedCluster;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersUpdated?: () => void;
}

export function ClusterMembersDialog({
  cluster,
  open,
  onOpenChange,
  onMembersUpdated,
}: ClusterMembersDialogProps) {
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchMembers();
      fetchAvailableStudents();
      fetchAvailableStaff();
    }
  }, [open, cluster.id]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("detailed_cluster_members")
        .select(`*`)
        .eq("cluster_id", cluster.id)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error instanceof Error ? error.message : error);
      toast.error("Failed to load cluster members");
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      // Get all students
      const { data: allStudents } = await supabase
        .from("public_profiles_with_email")
        .select("id, full_name, email, role, avatar_url")
        .eq("role", "student")
        .order("full_name");

      // Get current member IDs
      const currentMemberIds = members ? members.map(member => member.user_id) : [];

      // Filter out current members
      const available = allStudents?.filter(
        student => !currentMemberIds.includes(student.id)
      ) || [];

      setAvailableStudents(available);
    } catch (error) {
      console.error("Error fetching available students:", error);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      // Get all staff
      const { data: allStaff } = await supabase
        .from("public_profiles_with_email")
        .select("id, full_name, email, role, avatar_url")
        .in("role", ["staff", "admin"])
        .order("full_name");

      // Get current member IDs
      const currentMemberIds = members ? members.map(member => member.user_id) : [];

      // Filter out current members
      const available = allStaff?.filter(
        staff => !currentMemberIds.includes(staff.id)
      ) || [];

      setAvailableStaff(available);
    } catch (error) {
      console.error("Error fetching available staff:", error);
    }
  };

  useEffect(() => {
    if (members.length > 0) {
      fetchAvailableStudents();
      fetchAvailableStaff();
    }
  }, [members]);

  const handleAddMember = async (userId: string) => {
    if (!userId) {
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: cluster.id,
          user_id: userId,
          role: "member",
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

      if (error) throw error;

      toast.success("Member added successfully!");
      fetchMembers();
      onMembersUpdated?.();
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (userId: string) => {
    if (!userId) {
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: cluster.id,
          user_id: userId,
          role: "staff_manager",
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

      if (error) throw error;

      toast.success("Staff manager added successfully!");
      fetchMembers();
      onMembersUpdated?.();
    } catch (error: any) {
      console.error("Error adding staff manager:", error);
      toast.error(error.message || "Failed to add staff manager");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the cluster?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("cluster_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member removed successfully!");
      fetchMembers();
      onMembersUpdated?.();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Failed to remove member");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("cluster_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member role updated successfully!");
      fetchMembers();
      onMembersUpdated?.();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Failed to update member role");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "lead":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "deputy":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "staff_manager":
        return <Shield className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "lead":
        return "default";
      case "deputy":
        return "secondary";
      case "staff_manager":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Cluster Members</DialogTitle>
          <DialogDescription>
            Add, remove, or manage roles for members of {cluster.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new member */}
          <div className="grid gap-4">
            <Label>Add New Member</Label>
            <Combobox
              options={availableStudents.map((student) => ({
                value: student.id,
                label: `${student.full_name} (${student.email})`,
              }))}
              value=""
              onValueChange={handleAddMember}
              placeholder="Select a student to add"
              searchPlaceholder="Search students..."
              emptyMessage="No available students found."
              disabled={loading}
            />
          </div>
          <div className="grid gap-4">
            <Label>Add Staff Manager</Label>
            <Combobox
              options={availableStaff.map((staff) => ({
                value: staff.id,
                label: `${staff.full_name} (${staff.email})`,
              }))}
              value=""
              onValueChange={handleAddStaff}
              placeholder="Select a staff to add"
              searchPlaceholder="Search staff..."
              emptyMessage="No available staff found."
              disabled={loading}
            />
          </div>

          {/* Members list */}
          <div className="space-y-4">
            <Label>Current Members ({members.length})</Label>
            {loadingMembers ? (
              <div className="text-center py-4">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No members in this cluster yet.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={member.avatar_url || ""}
                                alt={member.full_name}
                              />
                              <AvatarFallback>
                                {member.full_name
                                  ? member.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                  : "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.full_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {member.role.replace("_", " ")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.status === "approved" ? "default" : "secondary"}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(member.joined_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, "member")}
                                disabled={member.role === "member"}
                              >
                                Set as Member
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, "deputy")}
                                disabled={member.role === "deputy"}
                              >
                                Set as Deputy Lead
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateRole(member.id, "lead")}
                                disabled={member.role === "lead"}
                              >
                                Set as Lead
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-destructive"
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove from Cluster
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}