"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
};

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Update the user's profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          academic_level: academicLevel,
          department: department,
          faculty: faculty,
          institution: institution,
          linkedin_url: linkedinUrl,
          github_url: githubUrl
        })
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
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
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