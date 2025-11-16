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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox"; // Import Combobox
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface CreateClusterDialogProps {
  children: React.ReactNode;
  onClusterCreated?: () => void;
}

export function CreateClusterDialog({ children, onClusterCreated }: CreateClusterDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [staffManagerId, setStaffManagerId] = useState("");
  const [leadStudentId, setLeadStudentId] = useState("");
  const [deputyLeadId, setDeputyLeadId] = useState("");
  const [additionalMembers, setAdditionalMembers] = useState<string[]>([]);

  const [staff, setStaff] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  const handleAddMember = (userId: string) => {
    if (!additionalMembers.includes(userId)) {
      setAdditionalMembers([...additionalMembers, userId]);
    }
  };

  const handleRemoveMember = (userId: string) => {
    setAdditionalMembers(additionalMembers.filter(id => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create a cluster");
        return;
      }

      // Create cluster
      const { data: cluster, error: clusterError } = await supabase
        .from("clusters")
        .insert({
          name,
          description,
          lead_id: leadStudentId || null,
          deputy_id: deputyLeadId || null,
          staff_manager_id: staffManagerId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (clusterError) throw clusterError;

      // Add cluster members
      const membersToInsert = [];

      // Add staff manager if assigned
      if (staffManagerId) {
        membersToInsert.push({
          cluster_id: cluster.id,
          user_id: staffManagerId,
          role: "staff_manager",
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });
      }

      // Add lead student if assigned
      if (leadStudentId) {
        membersToInsert.push({
          cluster_id: cluster.id,
          user_id: leadStudentId,
          role: "lead",
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });
      }

      // Add deputy lead if assigned
      if (deputyLeadId) {
        membersToInsert.push({
          cluster_id: cluster.id,
          user_id: deputyLeadId,
          role: "deputy",
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });
      }

      // Add additional members
      additionalMembers.forEach(userId => {
        membersToInsert.push({
          cluster_id: cluster.id,
          user_id: userId,
          role: "member",
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });
      });

      if (membersToInsert.length > 0) {
        const { error: membersError } = await supabase
          .from("cluster_members")
          .insert(membersToInsert);

        if (membersError) throw membersError;
      }

      toast.success("Cluster created successfully!");
      setOpen(false);

      // Reset form
      setName("");
      setDescription("");
      setStaffManagerId("");
      setLeadStudentId("");
      setDeputyLeadId("");
      setAdditionalMembers([]);

      onClusterCreated?.();
    } catch (error: any) {
      console.error("Error creating cluster:", error);
      toast.error(error.message || "Failed to create cluster");
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = [...staff, ...students].find(u => u.id === userId);
    return user?.full_name || "Unknown User";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Cluster</DialogTitle>
          <DialogDescription>
            Create a new cluster and assign staff and student leaders.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Cluster Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter cluster name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the cluster's purpose and activities"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Staff Manager</Label>
              <Combobox
                options={staff.filter(user => user.full_name).map((user) => ({ value: user.id, label: `${user.full_name} (${user.role})` }))}
                value={staffManagerId}
                onValueChange={setStaffManagerId}
                placeholder="Select staff manager"
                searchPlaceholder="Search staff..."
                emptyMessage="No staff found."
              />
            </div>

            <div className="grid gap-2">
              <Label>Lead Student</Label>
              <Combobox
                options={students.filter(user => user.full_name).map((user) => ({ value: user.id, label: user.full_name }))}
                value={leadStudentId}
                onValueChange={setLeadStudentId}
                placeholder="Select lead student"
                searchPlaceholder="Search students..."
                emptyMessage="No students found."
              />
            </div>

            <div className="grid gap-2">
              <Label>Deputy Lead Student</Label>
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

            <div className="grid gap-2">
              <Label>Additional Members</Label>
              <Combobox
                options={students
                  .filter(student =>
                    student.id !== leadStudentId &&
                    student.id !== deputyLeadId &&
                    !additionalMembers.includes(student.id) &&
                    student.full_name
                  )
                  .map((user) => ({ value: user.id, label: user.full_name }))}
                value="" // This combobox is for adding, not selecting a single value
                onValueChange={handleAddMember}
                placeholder="Add students to cluster"
                searchPlaceholder="Search students..."
                emptyMessage="No students found."
              />

              {additionalMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {additionalMembers.map((userId) => (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                      {getUserName(userId)}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(userId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Cluster"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}