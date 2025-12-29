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
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createUser } from "@/lib/supabase/user-actions";

interface CreateUserDialogProps {
  onCreate: () => void;
  currentUserRole?: string;
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

const suggestedSkills = [
  "JavaScript", "TypeScript", "Python", "Java", "React", "Next.js", "Node.js",
  "HTML", "CSS", "Tailwind CSS", "Vue.js", "Angular", "PHP", "Laravel",
  "PostgreSQL", "MongoDB", "MySQL", "Docker", "Git", "AWS", "Azure",
  "Machine Learning", "AI", "Data Analysis", "UI/UX Design", "Figma",
];

export function CreateUserDialog({ onCreate, currentUserRole }: CreateUserDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "student",
    academicLevel: "student",
    department: "Software Engineering",
    faculty: "Faculty of Computing",
    institution: "Bayero University",
    linkedinUrl: "",
    githubUrl: "",
    registrationNumber: "",
    bio: "",
    skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState("");
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
      setFormData({ ...formData, skills: [...formData.skills, trimmedSkill] });
      setNewSkill("");
      setShowSkillSuggestions(false);
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createUser(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role,
        formData.academicLevel,
        formData.department,
        formData.faculty,
        formData.institution,
        formData.linkedinUrl,
        formData.githubUrl,
        formData.registrationNumber,
        undefined,
        formData.bio,
        formData.skills
      );

      if (result.success) {
        setFormData({
          email: "",
          password: "",
          fullName: "",
          role: "student",
          academicLevel: "student",
          department: "Software Engineering",
          faculty: "Faculty of Computing",
          institution: "Bayero University",
          linkedinUrl: "",
          githubUrl: "",
          registrationNumber: "",
          bio: "",
          skills: [],
        });
        setIsDialogOpen(false);
        onCreate();
      } else {
        throw new Error(result.error);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Create New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account with specified role and permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
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
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  {currentUserRole === "admin" && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="academicLevel">Academic Level</Label>
              <Select
                value={formData.academicLevel}
                onValueChange={(value) => setFormData({ ...formData, academicLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
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
            <div className="grid gap-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                type="text"
                placeholder="e.g., U/21/CS/1234"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
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
              <Label htmlFor="faculty">Faculty</Label>
              <Input
                id="faculty"
                type="text"
                placeholder="e.g., Faculty of Computing"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                type="text"
                placeholder="e.g., Bayero University"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about the user..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Skills</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => { setNewSkill(e.target.value); setShowSkillSuggestions(true); }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                    placeholder="Add a skill"
                  />
                  <Button type="button" onClick={() => addSkill(newSkill)} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {showSkillSuggestions && newSkill && (
                  <div className="absolute top-full left-0 z-10 w-full bg-background shadow-lg rounded-md border mt-1 p-1 max-h-40 overflow-y-auto">
                    {suggestedSkills
                      .filter(s => s.toLowerCase().includes(newSkill.toLowerCase()))
                      .slice(0, 5)
                      .map(s => (
                        <div
                          key={s}
                          className="px-3 py-2 hover:bg-accent rounded-sm cursor-pointer text-sm"
                          onClick={() => addSkill(s)}
                        >
                          {s}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="px-2 py-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input
                id="githubUrl"
                type="url"
                placeholder="https://github.com/username"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
