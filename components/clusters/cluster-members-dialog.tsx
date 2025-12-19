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
import { MoreHorizontal, UserPlus, UserMinus, Crown, Shield, Users, X } from "lucide-react";
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
  userId?: string;
  userRole?: string;
}

export function ClusterMembersDialog({
  cluster,
  open,
  onOpenChange,
  onMembersUpdated,
  userId,
  userRole,
}: ClusterMembersDialogProps) {
  const [members, setMembers] = useState<ClusterMember[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [availableStaff, setAvailableStaff] = useState<User[]>([]);
  const [pendingStudentAdditions, setPendingStudentAdditions] = useState<User[]>([]);
  const [pendingStaffAdditions, setPendingStaffAdditions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const supabase = createClient();

  const canManage = userRole === 'admin' || 
                    userRole === 'staff' ||
                    (userRole === 'lead' && cluster.lead_id === userId) ||
                    (userRole === 'deputy' && cluster.deputy_id === userId);

  useEffect(() => {
    if (open) {
      fetchMembers();
      if (canManage) {
        fetchAvailableStudents();
        fetchAvailableStaff();
      }
    }
  }, [open, cluster.id, canManage]);

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
      const pendingStudentIds = pendingStudentAdditions.map(s => s.id);

      // Filter out current members and pending additions
      const available = allStudents?.filter(
        student => !currentMemberIds.includes(student.id) && !pendingStudentIds.includes(student.id)
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
      const pendingStaffIds = pendingStaffAdditions.map(s => s.id);

      // Filter out current members and pending additions
      const available = allStaff?.filter(
        staff => !currentMemberIds.includes(staff.id) && !pendingStaffIds.includes(staff.id)
      ) || [];

      setAvailableStaff(available);
    } catch (error) {
      console.error("Error fetching available staff:", error);
    }
  };

  useEffect(() => {
    if (members.length > 0 && canManage) {
      fetchAvailableStudents();
      fetchAvailableStaff();
    }
  }, [members, canManage, pendingStudentAdditions, pendingStaffAdditions]);

  const handleAddPendingStudent = (studentId: string) => {
    const student = availableStudents.find(s => s.id === studentId);
    if (student) {
      setPendingStudentAdditions(prev => [...prev, student]);
      setAvailableStudents(prev => prev.filter(s => s.id !== studentId));
    }
  };

  const handleRemovePendingStudent = (studentId: string) => {
    const student = pendingStudentAdditions.find(s => s.id === studentId);
    if (student) {
      setPendingStudentAdditions(prev => prev.filter(s => s.id !== studentId));
      setAvailableStudents(prev => [...prev, student]);
    }
  };

  const handleAddPendingStaff = (staffId: string) => {
    const staff = availableStaff.find(s => s.id === staffId);
    if (staff) {
      setPendingStaffAdditions(prev => [...prev, staff]);
      setAvailableStaff(prev => prev.filter(s => s.id !== staffId));
    }
  };

  const handleRemovePendingStaff = (staffId: string) => {
    const staff = pendingStaffAdditions.find(s => s.id === staffId);
    if (staff) {
      setPendingStaffAdditions(prev => prev.filter(s => s.id !== staffId));
      setAvailableStaff(prev => [...prev, staff]);
    }
  };

  const handleAddMember = async (userId: string, role: string = "member") => {
    if (!userId) {
      return;
    }

    try {
      const { data: { user } } = await (supabase.auth as any).getUser();
      if (!user) return;

      const { error } = await supabase
        .from("cluster_members")
        .insert({
          cluster_id: cluster.id,
          user_id: userId,
          role: role,
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

      if (error) throw error;

      toast.success(`${role === "member" ? "Member" : "Staff manager"} added successfully!`);
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || `Failed to add ${role === "member" ? "member" : "staff manager"}`);
      throw error; // Re-throw to indicate failure in batch operation
    }
  };

  const handleCommitAdditions = async () => {
    setLoading(true);
    try {
      const addPromises = [];

      for (const student of pendingStudentAdditions) {
        addPromises.push(handleAddMember(student.id, "member"));
      }

      for (const staff of pendingStaffAdditions) {
        addPromises.push(handleAddMember(staff.id, "staff_manager"));
      }

      await Promise.all(addPromises);

      setPendingStudentAdditions([]);
      setPendingStaffAdditions([]);
      fetchMembers();
      onMembersUpdated?.();
    } catch (error) {
      // Error handling is done in handleAddMember, so just log here if needed
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClick = (memberId: string) => {
    setMemberToRemove(memberId);
    setRemoveDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("cluster_members")
        .delete()
        .eq("id", memberToRemove);

      if (error) throw error;

      toast.success("Member removed successfully!");
      fetchMembers();
      onMembersUpdated?.();
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast.error(error.message || "Failed to remove member");
    } finally {
      setLoading(false);
      setMemberToRemove(null);
      setRemoveDialogOpen(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
          {canManage && (
            <>
              <div className="grid gap-4">
                <Label>Add New Member</Label>
                <Combobox
                  options={availableStudents.map((student) => ({
                    value: student.id,
                    label: `${student.full_name} (${student.email})`,
                  }))}
                  value=""
                  onValueChange={handleAddPendingStudent}
                  placeholder="Select a student to add"
                  searchPlaceholder="Search students..."
                  emptyMessage="No available students found."
                  disabled={loading}
                />
                {pendingStudentAdditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pendingStudentAdditions.map((student) => (
                      <Badge key={student.id} variant="secondary" className="flex items-center gap-1">
                        {student.full_name}
                        <button
                          type="button"
                          onClick={() => handleRemovePendingStudent(student.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-4">
                <Label>Add Staff Manager</Label>
                <Combobox
                  options={availableStaff.map((staff) => ({
                    value: staff.id,
                    label: `${staff.full_name} (${staff.email})`,
                  }))}
                  value=""
                  onValueChange={handleAddPendingStaff}
                  placeholder="Select a staff to add"
                  searchPlaceholder="Search staff..."
                  emptyMessage="No available staff found."
                  disabled={loading}
                />
                {pendingStaffAdditions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pendingStaffAdditions.map((staff) => (
                      <Badge key={staff.id} variant="secondary" className="flex items-center gap-1">
                        {staff.full_name}
                        <button
                          type="button"
                          onClick={() => handleRemovePendingStaff(staff.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {(pendingStudentAdditions.length > 0 || pendingStaffAdditions.length > 0) && (
                <Button onClick={handleCommitAdditions} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  {loading ? "Adding..." : `Add ${pendingStudentAdditions.length + pendingStaffAdditions.length} Selected Members`}
                </Button>
              )}
            </>
          )}

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
                      {canManage && <TableHead className="w-[100px]">Actions</TableHead>}
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
                        {canManage && (
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
                                  onClick={() => handleRemoveClick(member.id)}
                                  className="text-destructive"
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove from Cluster
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-2 hover:bg-muted">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the member from the cluster. They will need to request to join again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}