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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, User as UserIcon } from "lucide-react";
import { UserProfile } from "./page"; // Import the shared interface
import { updateUserProfile, deleteUser } from "@/lib/supabase/admin-actions";
import { createClient } from "@/lib/supabase/client";

interface StaffTableProps {
  profiles: UserProfile[];
  currentUserRole: string;
  onUpdate: () => void;
}

export function StaffTable({ profiles, currentUserRole, onUpdate }: StaffTableProps) {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [viewingUserAvatarUrl, setViewingUserAvatarUrl] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    role: "staff",
    academicLevel: "student",
    department: "Software Engineering",
    faculty: "Faculty of Computing",
    institution: "Bayero University",
    linkedinUrl: "",
    githubUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.full_name || "",
      role: user.role || "staff",
      academicLevel: user.academic_level || "student",
      department: user.department || "Software Engineering",
      faculty: user.faculty || "Faculty of Computing",
      institution: user.institution || "Bayero University",
      linkedinUrl: user.linkedin_url || "",
      githubUrl: user.github_url || "",
    });
  };

  const handleDelete = (user: UserProfile) => {
    setDeletingUser(user);
  };

  const handleView = (user: UserProfile) => {
    setViewingUser(user);

    // Fetch the signed URL for the user's avatar if it exists
    if (user.avatar_url) {
      const fetchAvatarUrl = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.storage
            .from('avatars')
            .createSignedUrl(user.avatar_url!, 3600); // 1 hour expiry

          if (error) {
            console.error('Error creating signed URL for avatar:', error);
            // Fallback to getPublicUrl if createSignedUrl fails
            const { data: publicData } = await supabase.storage
              .from('avatars')
              .getPublicUrl(user.avatar_url!);
            // Normalize hostname for consistency
            setViewingUserAvatarUrl(publicData?.publicUrl?.replace('localhost', '127.0.0.1') || null);
          } else {
            // Normalize hostname for consistency
            setViewingUserAvatarUrl(data?.signedUrl?.replace('localhost', '127.0.0.1') || null);
          }
        } catch (err: any) {
          console.error('Unexpected error getting avatar URL:', err);
          // Check if it's a timeout or network error and handle appropriately
          if (err?.message?.includes('timeout') || err?.status === 500) {
            console.warn('Storage timeout or server error - using fallback avatar');
          }
          setViewingUserAvatarUrl(null);
        }
      };

      fetchAvatarUrl();
    } else {
      // If no avatar_url, set to null
      setViewingUserAvatarUrl(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateUserProfile(
        editingUser.id,
        editFormData.fullName,
        editFormData.role,
        editFormData.academicLevel,
        editFormData.department,
        editFormData.faculty,
        editFormData.institution,
        editFormData.linkedinUrl,
        editFormData.githubUrl
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      setEditingUser(null);
      onUpdate(); // This will trigger router.refresh() in the parent
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

    try {
      const result = await deleteUser(deletingUser.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      setDeletingUser(null);
      onUpdate(); // This will trigger router.refresh() in the parent
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles?.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Avatar>
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
                    <AvatarFallback>
                      {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <UserIcon size={16} />}
                    </AvatarFallback>
                  </Avatar>
                  {profile.full_name || "N/A"}
                </TableCell>
                <TableCell>{profile.email || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={profile.email_confirmed_at ? "default" : "outline"}>
                    {profile.email_confirmed_at ? "Active" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleView(profile)}>View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(profile)}>Edit</DropdownMenuItem>
                      {/* Admins can delete any staff members, staff can delete other staff but not admins */}
                      {currentUserRole === "admin" ||
                       (currentUserRole === "staff" && profile.role !== "admin") ? (
                        <DropdownMenuItem
                          onClick={() => handleDelete(profile)}
                          className="text-red-500"
                        >
                          Delete
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Staff Member Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => {
        if (!open) {
          setViewingUser(null);
          setViewingUserAvatarUrl(null); // Reset avatar URL when dialog is closed
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Staff Member Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={viewingUserAvatarUrl || undefined} alt={viewingUser?.full_name || ""} />
              <AvatarFallback className="text-3xl">
                {viewingUser?.full_name ? viewingUser.full_name.charAt(0).toUpperCase() : <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-xl font-bold">{viewingUser?.full_name}</p>
              <p className="text-sm text-muted-foreground">{viewingUser?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">Staff</Badge>
              <Badge variant={
                viewingUser?.academic_level === 'level_400' || viewingUser?.academic_level === 'alumni'
                  ? 'destructive'
                  : 'default'
              }>
                {viewingUser?.academic_level === 'level_100' && 'Level 100'}
                {viewingUser?.academic_level === 'level_200' && 'Level 200'}
                {viewingUser?.academic_level === 'level_300' && 'Level 300'}
                {viewingUser?.academic_level === 'level_400' && 'Level 400'}
                {viewingUser?.academic_level === 'alumni' && 'Alumni'}
                {(viewingUser?.academic_level === 'student' || !viewingUser?.academic_level) && 'Student'}
              </Badge>
              <Badge variant={viewingUser?.email_confirmed_at ? "default" : "outline"}>
                {viewingUser?.email_confirmed_at ? "Active" : "Pending"}
              </Badge>
            </div>
            <div className="w-full space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <p className="font-medium">Department:</p>
                <p>{viewingUser?.department || "Not specified"}</p>
                <p className="font-medium">Faculty:</p>
                <p>{viewingUser?.faculty || "Not specified"}</p>
                <p className="font-medium">Institution:</p>
                <p>{viewingUser?.institution || "Not specified"}</p>
                <p className="font-medium">LinkedIn:</p>
                <p className="truncate">
                  {viewingUser?.linkedin_url ?
                    <a href={viewingUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {viewingUser.linkedin_url.replace('https://', '')}
                    </a> : "Not specified"}
                </p>
                <p className="font-medium">GitHub:</p>
                <p className="truncate">
                  {viewingUser?.github_url ?
                    <a href={viewingUser.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {viewingUser.github_url.replace('https://', '')}
                    </a> : "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Member Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff information and role permissions.
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
                    {/* Staff can only manage other staff members, so only show relevant roles */}
                    {/* For now, keep this to staff to maintain role consistency */}
                    <SelectItem value="staff">Staff</SelectItem>
                    {/* Admins may change the role to other types if needed */}
                    {currentUserRole === "admin" && (
                      <>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="deputy">Deputy</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editAcademicLevel" className="text-right">
                  Academic Level
                </Label>
                <Select
                  value={editFormData.academicLevel}
                  onValueChange={(value) => setEditFormData({ ...editFormData, academicLevel: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select academic level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="level_100">Level 100</SelectItem>
                    <SelectItem value="level_200">Level 200</SelectItem>
                    <SelectItem value="level_300">Level 300</SelectItem>
                    <SelectItem value="level_400">Level 400</SelectItem>
                    <SelectItem value="alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editDepartment" className="text-right">
                  Department
                </Label>
                <Input
                  id="editDepartment"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g. Software Engineering"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editFaculty" className="text-right">
                  Faculty
                </Label>
                <Input
                  id="editFaculty"
                  value={editFormData.faculty}
                  onChange={(e) => setEditFormData({ ...editFormData, faculty: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g. Faculty of Computing"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editInstitution" className="text-right">
                  Institution
                </Label>
                <Input
                  id="editInstitution"
                  value={editFormData.institution}
                  onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g. Bayero University"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLinkedinUrl" className="text-right">
                  LinkedIn URL
                </Label>
                <Input
                  id="editLinkedinUrl"
                  value={editFormData.linkedinUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                  className="col-span-3"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editGithubUrl" className="text-right">
                  GitHub URL
                </Label>
                <Input
                  id="editGithubUrl"
                  value={editFormData.githubUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
                  className="col-span-3"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                className="border-2 hover:bg-muted"
                onClick={() => setEditingUser(null)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Member Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Staff Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium">{deletingUser?.full_name || "N/A"}</p>
              <p className="text-sm text-muted-foreground mt-1">{deletingUser?.email}</p>
              <p className="text-sm text-muted-foreground">Role: {deletingUser?.role}</p>
              {deletingUser?.role === "admin" && currentUserRole !== "admin" && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ You are deleting an admin user (only admins should do this)
                </p>
              )}
              {deletingUser?.role !== "admin" && currentUserRole === "staff" && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ You are performing an administrative action
                </p>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              className="border-2 hover:bg-muted"
              onClick={() => setDeletingUser(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Staff Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
