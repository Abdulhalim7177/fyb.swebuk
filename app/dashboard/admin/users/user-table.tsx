"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  email_confirmed_at: string | null;
}

interface UserTableProps {
  profiles: UserProfile[];
  currentUserRole: string;
  onUpdate: () => void;
}

export function UserTable({ profiles, currentUserRole, onUpdate }: UserTableProps) {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    role: "student",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.full_name || "",
      role: user.role || "student",
    });
  };

  const handleDelete = (user: UserProfile) => {
    setDeletingUser(user);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editFormData.fullName,
          role: editFormData.role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      setEditingUser(null);
      onUpdate();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deletingUser.id);

      if (profileError) throw profileError;

      setDeletingUser(null);
      onUpdate();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  {profile.full_name || "N/A"}
                </TableCell>
                <TableCell>{profile.email || "N/A"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      profile.role === "admin"
                        ? "destructive"
                        : profile.role === "staff"
                        ? "default"
                        : profile.role === "lead"
                        ? "secondary"
                        : profile.role === "deputy"
                        ? "outline"
                        : "outline"
                    }
                  >
                    {profile.role || "student"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {profile.email_confirmed_at ? "Active" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(profile.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(profile)}
                    >
                      Edit
                    </Button>
                    {(currentUserRole === "admin" || profile.role !== "admin") && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(profile)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFullName" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="editFullName"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="col-span-3"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="editEmail"
                  value={editingUser?.email || ""}
                  disabled
                  className="col-span-3 bg-muted"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editRole" className="text-right">
                  Role
                </Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="deputy">Deputy</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    {currentUserRole === "admin" && (
                      <SelectItem value="admin">Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{deletingUser?.full_name || "N/A"}</p>
              <p className="text-sm text-muted-foreground mt-1">{deletingUser?.email}</p>
              <p className="text-sm text-muted-foreground">Role: {deletingUser?.role}</p>
              {currentUserRole === "admin" && deletingUser?.role === "admin" && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ You are deleting another admin user
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}