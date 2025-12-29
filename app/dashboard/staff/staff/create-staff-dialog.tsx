"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building2, Linkedin, Github, User } from "lucide-react";
import { createStaffMember } from "@/lib/supabase/user-actions";

interface CreateStaffDialogProps {
  onCreate: () => void;
  currentUserRole: string;
}

const departmentOptions = [
  "Software Engineering",
  "Computer Science",
  "Information Technology",
  "Cybersecurity",
  "Data Science",
  "Artificial Intelligence",
  "Computer Engineering",
  "Other",
];

export function CreateStaffDialog({ onCreate, currentUserRole }: CreateStaffDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "staff",
    position: "",
    department: "Software Engineering",
    officeLocation: "",
    officeHours: "",
    departmentRole: "",
    qualifications: "",
    linkedinUrl: "",
    githubUrl: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createStaffMember(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role,
        formData.position,
        formData.department,
        formData.officeLocation,
        formData.officeHours,
        formData.departmentRole,
        formData.qualifications,
        formData.linkedinUrl,
        formData.githubUrl,
        formData.bio
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to create staff member");
      }

      setFormData({
        email: "",
        password: "",
        fullName: "",
        role: "staff",
        position: "",
        department: "Software Engineering",
        officeLocation: "",
        officeHours: "",
        departmentRole: "",
        qualifications: "",
        linkedinUrl: "",
        githubUrl: "",
        bio: "",
      });
      setOpen(false);
      onCreate();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create staff member");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Staff Member</DialogTitle>
          <DialogDescription>
            Add a new staff member to the system with their professional details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  {currentUserRole === "admin" && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Position/Title</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Senior Lecturer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="departmentRole">Department Role</Label>
              <Input
                id="departmentRole"
                value={formData.departmentRole}
                onChange={(e) => setFormData({ ...formData, departmentRole: e.target.value })}
                placeholder="e.g., FYP Supervisor"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="officeLocation">Office Location</Label>
              <Input
                id="officeLocation"
                value={formData.officeLocation}
                onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                placeholder="e.g., Room 205, Block A"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="officeHours">Office Hours</Label>
              <Input
                id="officeHours"
                value={formData.officeHours}
                onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                placeholder="e.g., Mon-Wed 10am-12pm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Input
                id="qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                placeholder="e.g., PhD Computer Science"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about the staff member..."
                className="min-h-[80px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input
                id="githubUrl"
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Staff"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
