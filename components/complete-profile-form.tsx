"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { X, Plus } from "lucide-react";

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  academic_level?: string;
  department?: string;
  faculty?: string;
  institution?: string;
  linkedin_url?: string;
  github_url?: string;
  registration_number?: string;
  bio?: string;
  skills?: string[];
};

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

export default function CompleteProfileForm() {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [academicLevel, setAcademicLevel] = useState("student");
  const [department, setDepartment] = useState("Software Engineering");
  const [faculty, setFaculty] = useState("Faculty of Computing");
  const [institution, setInstitution] = useState("Bayero University");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSkill = (skillToAdd: string) => {
    const skill = skillToAdd.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill("");
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setUploading(true);
      setError(null);

      const {
        data: { user },
      } = await (supabase.auth as any).getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      const updates = {
        full_name: fullName,
        academic_level: academicLevel,
        department: department,
        faculty: faculty,
        institution: institution,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        registration_number: registrationNumber,
        bio: bio,
        skills: skills,
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      router.push("/dashboard/student");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error updating profile."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            type="text"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="e.g., U/21/CS/1234"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="academicLevel">Academic Level</Label>
          <select
            id="academicLevel"
            value={academicLevel}
            onChange={(e) => setAcademicLevel(e.target.value)}
            className="border rounded-md px-3 py-2 w-full bg-background"
          >
            <option value="student">Student</option>
            <option value="level_100">Level 100</option>
            <option value="level_200">Level 200</option>
            <option value="level_300">Level 300</option>
            <option value="level_400">Level 400</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border rounded-md px-3 py-2 w-full bg-background"
          >
            {departmentOptions.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="faculty">Faculty</Label>
          <Input
            id="faculty"
            type="text"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself..."
            className="min-h-[100px]"
          />
        </div>

        {/* Skills Section */}
        <div className="grid gap-2">
          <Label>Skills</Label>
          <div className="relative">
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => { setNewSkill(e.target.value); setShowSuggestions(true); }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                placeholder="Add a skill (e.g. React, Python)"
              />
              <Button type="button" onClick={() => addSkill(newSkill)} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {showSuggestions && newSkill && (
              <div className="absolute top-full left-0 z-10 w-full bg-background shadow-lg rounded-md border mt-1 p-1 max-h-60 overflow-y-auto">
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
            {skills.map(skill => (
              <Badge key={skill} variant="secondary" className="px-3 py-1 rounded-full">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
          <Input
            id="linkedinUrl"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/your-profile"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="githubUrl">GitHub Profile URL</Label>
          <Input
            id="githubUrl"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/your-profile"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" disabled={uploading}>
          {uploading ? "Saving..." : "Complete Profile"}
        </Button>
      </form>
    </div>
  );
}
