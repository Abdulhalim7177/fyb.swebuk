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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoreHorizontal, User as UserIcon, GraduationCap, Briefcase, Linkedin, Github, Mail, MapPin, Building2, Award, Book, Clock } from "lucide-react";
import { UserProfile } from "./page";
import { updateUserProfile, deleteUser } from "@/lib/supabase/user-actions";
import { createClient } from "@/lib/supabase/client";

interface UserTableProps {
  profiles: UserProfile[];
  currentUserRole: string;
  onUpdate: () => void;
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

const academicLevelOptions = [
  { value: "student", label: "Student" },
  { value: "level_100", label: "Level 100" },
  { value: "level_200", label: "Level 200" },
  { value: "level_300", label: "Level 300" },
  { value: "level_400", label: "Level 400" },
  { value: "alumni", label: "Alumni" },
];

export function UserTable({ profiles, currentUserRole, onUpdate }: UserTableProps) {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [viewingUserAvatarUrl, setViewingUserAvatarUrl] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    role: "student",
    academicLevel: "student",
    department: "Software Engineering",
    faculty: "Faculty of Computing",
    institution: "Bayero University",
    registrationNumber: "",
    bio: "",
    linkedinUrl: "",
    githubUrl: "",
    specialization: "",
    gpa: "",
    academicStanding: "Good",
    interests: "",
    position: "",
    officeLocation: "",
    officeHours: "",
    departmentRole: "",
    qualifications: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    const isStaff = user.role === "staff" || user.role === "admin";
    setEditFormData({
      fullName: user.full_name || "",
      role: user.role || "student",
      academicLevel: user.academic_level || "student",
      department: user.department || "Software Engineering",
      faculty: user.faculty || "Faculty of Computing",
      institution: user.institution || "Bayero University",
      registrationNumber: user.registration_number || "",
      bio: user.bio || "",
      linkedinUrl: user.linkedin_url || "",
      githubUrl: user.github_url || "",
      specialization: user.specialization || "",
      gpa: user.gpa?.toString() || "",
      academicStanding: user.academic_standing || "Good",
      interests: user.interests || "",
      position: user.position || "",
      officeLocation: user.office_location || "",
      officeHours: user.office_hours || "",
      departmentRole: user.department_role || "",
      qualifications: user.qualifications || "",
    });
  };

  const handleDelete = (user: UserProfile) => {
    setDeletingUser(user);
  };

  const handleView = (user: UserProfile) => {
    setViewingUser(user);

    if (user.avatar_url) {
      const fetchAvatarUrl = async () => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.storage
            .from('avatars')
            .createSignedUrl(user.avatar_url!, 3600);

          if (error) {
            const { data: publicData } = await supabase.storage
              .from('avatars')
              .getPublicUrl(user.avatar_url!);
            setViewingUserAvatarUrl(publicData?.publicUrl?.replace('localhost', '127.0.0.1') || null);
          } else {
            setViewingUserAvatarUrl(data?.signedUrl?.replace('localhost', '127.0.0.1') || null);
          }
        } catch (err) {
          setViewingUserAvatarUrl(null);
        }
      };
      fetchAvatarUrl();
    } else {
      setViewingUserAvatarUrl(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateUserProfile(editingUser.id, {
        full_name: editFormData.fullName,
        role: editFormData.role,
        academic_level: editFormData.academicLevel,
        department: editFormData.department,
        faculty: editFormData.faculty,
        institution: editFormData.institution,
        registration_number: editFormData.registrationNumber,
        bio: editFormData.bio,
        linkedin_url: editFormData.linkedinUrl,
        github_url: editFormData.githubUrl,
        specialization: editFormData.specialization,
        gpa: editFormData.gpa ? parseFloat(editFormData.gpa) : undefined,
        academic_standing: editFormData.academicStanding,
        interests: editFormData.interests,
        position: editFormData.position,
        office_location: editFormData.officeLocation,
        office_hours: editFormData.officeHours,
        department_role: editFormData.departmentRole,
        qualifications: editFormData.qualifications,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

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

    try {
      const result = await deleteUser(deletingUser.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      setDeletingUser(null);
      onUpdate();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  const isStaffUser = editingUser?.role === "staff" || editingUser?.role === "admin";

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Level/Department</TableHead>
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
                  <Badge
                    variant={
                      profile.role === "admin"
                        ? "destructive"
                        : profile.role === "staff"
                        ? "default"
                        : profile.role === "lead"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {profile.role || "student"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span>{profile.academic_level === "student" ? "Student" : profile.academic_level?.replace("level_", "Level ")}</span>
                    {profile.department && <span className="text-muted-foreground"> • {profile.department}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleView(profile)}>View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(profile)}>Edit</DropdownMenuItem>
                      {(currentUserRole === "admin" || profile.role !== "admin") && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(profile)}
                          className="text-red-500"
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => {
        if (!open) {
          setViewingUser(null);
          setViewingUserAvatarUrl(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col items-center gap-4 mb-6">
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
              <div className="flex gap-2">
                <Badge>{viewingUser?.role}</Badge>
                <Badge variant={viewingUser?.email_confirmed_at ? "default" : "outline"}>
                  {viewingUser?.email_confirmed_at ? "Active" : "Pending"}
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="skills">Skills & Bio</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    {viewingUser?.registration_number && (
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Reg No:</span>
                        <span>{viewingUser.registration_number}</span>
                      </div>
                    )}
                    {viewingUser?.bio && (
                      <div>
                        <span className="font-medium block mb-1">Bio</span>
                        <p className="text-sm text-muted-foreground">{viewingUser.bio}</p>
                      </div>
                    )}
                    {viewingUser?.department && (
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Department:</span>
                        <span>{viewingUser.department}</span>
                      </div>
                    )}
                    {viewingUser?.faculty && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Faculty:</span>
                        <span>{viewingUser.faculty}</span>
                      </div>
                    )}
                    {viewingUser?.institution && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Institution:</span>
                        <span>{viewingUser.institution}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="academic" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    {viewingUser?.academic_level && (
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Level:</span>
                        <span>{viewingUser.academic_level === "student" ? "Student" : viewingUser.academic_level.replace("level_", "Level ")}</span>
                      </div>
                    )}
                    {viewingUser?.specialization && (
                      <div className="flex items-center gap-3">
                        <Book className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Specialization:</span>
                        <span>{viewingUser.specialization}</span>
                      </div>
                    )}
                    {viewingUser?.gpa && (
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">GPA:</span>
                        <span>{viewingUser.gpa.toFixed(2)}</span>
                      </div>
                    )}
                    {viewingUser?.academic_standing && (
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Standing:</span>
                        <span>{viewingUser.academic_standing}</span>
                      </div>
                    )}
                    {viewingUser?.interests && (
                      <div>
                        <span className="font-medium block mb-1">Interests</span>
                        <p className="text-sm text-muted-foreground">{viewingUser.interests}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    {viewingUser?.skills && viewingUser.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingUser.skills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills added</p>
                    )}
                    {viewingUser?.achievements && viewingUser.achievements.length > 0 && (
                      <div>
                        <span className="font-medium block mb-1">Achievements</span>
                        <div className="flex flex-wrap gap-2">
                          {viewingUser.achievements.map((achievement, idx) => (
                            <Badge key={idx} variant="outline">{achievement}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Social Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {viewingUser?.linkedin_url && (
                      <a href={viewingUser.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Linkedin className="w-4 h-4" /> LinkedIn Profile
                      </a>
                    )}
                    {viewingUser?.github_url && (
                      <a href={viewingUser.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:underline">
                        <Github className="w-4 h-4" /> GitHub Profile
                      </a>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role permissions.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="role">Role</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFullName">Full Name</Label>
                  <Input
                    id="editFullName"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    value={editingUser?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {!isStaffUser && (
                <div className="space-y-2">
                  <Label htmlFor="editRegNumber">Registration Number</Label>
                  <Input
                    id="editRegNumber"
                    value={editFormData.registrationNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
                    placeholder="e.g., U/21/CS/1234"
                  />
                </div>
              )}

              {isStaffUser && (
                <div className="space-y-2">
                  <Label htmlFor="editPosition">Position/Title</Label>
                  <Input
                    id="editPosition"
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    placeholder="e.g., Senior Lecturer"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="editBio">Bio</Label>
                <Textarea
                  id="editBio"
                  value={editFormData.bio}
                  onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                  placeholder="Tell us about the user..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editDepartment">Department</Label>
                  <Select
                    value={editFormData.department}
                    onValueChange={(value) => setEditFormData({ ...editFormData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentOptions.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editFaculty">Faculty</Label>
                  <Input
                    id="editFaculty"
                    value={editFormData.faculty}
                    onChange={(e) => setEditFormData({ ...editFormData, faculty: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editInstitution">Institution</Label>
                <Input
                  id="editInstitution"
                  value={editFormData.institution}
                  onChange={(e) => setEditFormData({ ...editFormData, institution: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="academic" className="space-y-4 mt-4">
              {!isStaffUser ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="editAcademicLevel">Academic Level</Label>
                    <Select
                      value={editFormData.academicLevel}
                      onValueChange={(value) => setEditFormData({ ...editFormData, academicLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {academicLevelOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editSpecialization">Specialization/Major</Label>
                    <Input
                      id="editSpecialization"
                      value={editFormData.specialization}
                      onChange={(e) => setEditFormData({ ...editFormData, specialization: e.target.value })}
                      placeholder="e.g., Software Engineering"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editGPA">GPA</Label>
                      <Input
                        id="editGPA"
                        type="number"
                        step="0.01"
                        value={editFormData.gpa}
                        onChange={(e) => setEditFormData({ ...editFormData, gpa: e.target.value })}
                        placeholder="e.g., 4.50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editStanding">Academic Standing</Label>
                      <Select
                        value={editFormData.academicStanding}
                        onValueChange={(value) => setEditFormData({ ...editFormData, academicStanding: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Probation">Probation</SelectItem>
                          <SelectItem value="Dean's List">Dean's List</SelectItem>
                          <SelectItem value="Graduated">Graduated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editInterests">Interests</Label>
                    <Textarea
                      id="editInterests"
                      value={editFormData.interests}
                      onChange={(e) => setEditFormData({ ...editFormData, interests: e.target.value })}
                      placeholder="Academic and professional interests..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editOfficeLocation">Office Location</Label>
                      <Input
                        id="editOfficeLocation"
                        value={editFormData.officeLocation}
                        onChange={(e) => setEditFormData({ ...editFormData, officeLocation: e.target.value })}
                        placeholder="e.g., Room 205, Block A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editOfficeHours">Office Hours</Label>
                      <Input
                        id="editOfficeHours"
                        value={editFormData.officeHours}
                        onChange={(e) => setEditFormData({ ...editFormData, officeHours: e.target.value })}
                        placeholder="e.g., Mon-Wed 10am-12pm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDepartmentRole">Department Role</Label>
                    <Input
                      id="editDepartmentRole"
                      value={editFormData.departmentRole}
                      onChange={(e) => setEditFormData({ ...editFormData, departmentRole: e.target.value })}
                      placeholder="e.g., FYP Supervisor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editQualifications">Qualifications</Label>
                    <Input
                      id="editQualifications"
                      value={editFormData.qualifications}
                      onChange={(e) => setEditFormData({ ...editFormData, qualifications: e.target.value })}
                      placeholder="e.g., PhD Computer Science"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="social" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="editLinkedin">LinkedIn URL</Label>
                <Input
                  id="editLinkedin"
                  type="url"
                  value={editFormData.linkedinUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGithub">GitHub URL</Label>
                <Input
                  id="editGithub"
                  type="url"
                  value={editFormData.githubUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                />
              </div>
            </TabsContent>

            <TabsContent value="role" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </TabsContent>
          </Tabs>

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
                  You are deleting another admin user
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
