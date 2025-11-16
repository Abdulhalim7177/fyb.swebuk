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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox"; // Import Combobox
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Edit, Users, Crown, Shield } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
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

interface EditClusterDialogProps {
  cluster: DetailedCluster;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClusterUpdated?: () => void;
}

export function EditClusterDialog({
  cluster,
  open,
  onOpenChange,
  onClusterUpdated,
}: EditClusterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(cluster.name);
  const [description, setDescription] = useState(cluster.description || "");
  const [staffManagerId, setStaffManagerId] = useState(cluster.staff_manager_id || "");
  const [leadStudentId, setLeadStudentId] = useState(cluster.lead_id || "");
  const [deputyLeadId, setDeputyLeadId] = useState(cluster.deputy_id || "");

  const [staff, setStaff] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    setName(cluster.name);
    setDescription(cluster.description || "");
    setStaffManagerId(cluster.staff_manager_id || "");
    setLeadStudentId(cluster.lead_id || "");
    setDeputyLeadId(cluster.deputy_id || "");
  }, [cluster]);

  const fetchUsers = async () => {
    try {
      // Fetch staff and admin users
      const { data: staffData } = await supabase
        .from("public_profiles_with_email")
        .select("id, full_name, email, role")
        .in("role", ["staff", "admin"])
        .order("full_name");

      // Fetch student users
      const { data: studentData } = await supabase
        .from("public_profiles_with_email")
        .select("id, full_name, email, role")
        .eq("role", "student")
        .order("full_name");

      setStaff(staffData || []);
      setStudents(studentData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to update a cluster");
        return;
      }

      // Update cluster
      const { error: clusterError } = await supabase
        .from("clusters")
        .update({
          name,
          description,
          lead_id: leadStudentId || null,
          deputy_id: deputyLeadId || null,
          staff_manager_id: staffManagerId || null,
        })
        .eq("id", cluster.id);

      if (clusterError) throw clusterError;

      // Update cluster members table
      const { data: existingMembers } = await supabase
        .from("cluster_members")
        .select("user_id, role")
        .eq("cluster_id", cluster.id)
        .in("role", ["lead", "deputy", "staff_manager"]);

      const existingMemberMap = new Map(
        existingMembers?.map(member => [member.user_id, member.role]) || []
      );

      // Handle staff manager
      if (staffManagerId) {
        if (existingMemberMap.has(staffManagerId) && existingMemberMap.get(staffManagerId) === "staff_manager") {
          // Already exists as staff manager
        } else {
          // Remove old role if exists
          if (existingMemberMap.has(staffManagerId)) {
            await supabase
              .from("cluster_members")
              .delete()
              .eq("cluster_id", cluster.id)
              .eq("user_id", staffManagerId);
          }
          // Add as staff manager
          await supabase
            .from("cluster_members")
            .upsert({
              cluster_id: cluster.id,
              user_id: staffManagerId,
              role: "staff_manager",
              status: "approved",
              approved_at: new Date().toISOString(),
              approved_by: user.id,
            });
        }
      }

      // Handle lead student
      if (leadStudentId) {
        if (existingMemberMap.has(leadStudentId) && existingMemberMap.get(leadStudentId) === "lead") {
          // Already exists as lead
        } else {
          // Remove old role if exists
          if (existingMemberMap.has(leadStudentId)) {
            await supabase
              .from("cluster_members")
              .delete()
              .eq("cluster_id", cluster.id)
              .eq("user_id", leadStudentId);
          }
          // Add as lead
          await supabase
            .from("cluster_members")
            .upsert({
              cluster_id: cluster.id,
              user_id: leadStudentId,
              role: "lead",
              status: "approved",
              approved_at: new Date().toISOString(),
              approved_by: user.id,
            });
        }
      }

      // Handle deputy lead
      if (deputyLeadId) {
        if (existingMemberMap.has(deputyLeadId) && existingMemberMap.get(deputyLeadId) === "deputy") {
          // Already exists as deputy
        } else {
          // Remove old role if exists
          if (existingMemberMap.has(deputyLeadId)) {
            await supabase
              .from("cluster_members")
              .delete()
              .eq("cluster_id", cluster.id)
              .eq("user_id", deputyLeadId);
          }
          // Add as deputy
          await supabase
            .from("cluster_members")
            .upsert({
              cluster_id: cluster.id,
              user_id: deputyLeadId,
              role: "deputy",
              status: "approved",
              approved_at: new Date().toISOString(),
              approved_by: user.id,
            });
        }
      }

      toast.success("Cluster updated successfully!");
      onOpenChange(false);
      onClusterUpdated?.();
    } catch (error: any) {
      console.error("Error updating cluster:", error);
      toast.error(error.message || "Failed to update cluster");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <Edit className="h-5 w-5" />
            </div>
            Edit Cluster
          </DialogTitle>
          <DialogDescription className="text-base">
            Update cluster information and leadership assignments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-6">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground">Cluster Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter cluster name"
                className="border-2 focus:border-primary focus:ring-primary/20"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the cluster's purpose and activities..."
                rows={3}
                className="border-2 focus:border-primary focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid gap-3">
              <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield className="h-4 w-4 text-blue-500" />
                Staff Manager
              </Label>
              <Combobox
                options={staff.filter(user => user.full_name).map((user) => ({ value: user.id, label: `${user.full_name} (${user.role})` }))}
                value={staffManagerId}
                onValueChange={setStaffManagerId}
                placeholder="Select staff manager"
                searchPlaceholder="Search staff..."
                emptyMessage="No staff found."
              />
            </div>

            <div className="grid gap-3">
              <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Crown className="h-4 w-4 text-amber-500" />
                Lead Student
              </Label>
              <Combobox
                options={students.filter(user => user.full_name).map((user) => ({ value: user.id, label: user.full_name }))}
                value={leadStudentId}
                onValueChange={setLeadStudentId}
                placeholder="Select lead student"
                searchPlaceholder="Search students..."
                emptyMessage="No students found."
              />
            </div>

            <div className="grid gap-3">
              <Label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users className="h-4 w-4 text-purple-500" />
                Deputy Lead Student
              </Label>
              <Combobox
                options={students
                  .filter(student => student.id !== leadStudentId && student.full_name)
                  .map((user) => ({ value: user.id, label: user.full_name }))}
                value={deputyLeadId}
                onValueChange={setDeputyLeadId}
                placeholder="Select deputy lead (optional)"
                searchPlaceholder="Search students..."
                emptyMessage="No students found."
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-2 hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
            >
              {loading ? "Updating..." : "Update Cluster"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}