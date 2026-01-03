"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, User, Building2, Linkedin, Github, Loader2, Save, CheckCircle, AlertCircle } from "lucide-react";
import { updateUserProfile, ProfileUpdateData } from "@/lib/supabase/user-actions";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  academic_level: string | null;
  department: string | null;
  faculty: string | null;
  institution: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  avatar_url: string | null;
  registration_number: string | null;
  staff_number: string | null;
  bio: string | null;
  skills: string[] | null;
  specialization: string | null;
  gpa: number | null;
  academic_standing: string | null;
  current_courses: string[] | null;
  achievements: string[] | null;
  portfolio_items: any[] | null;
  interests: string | null;
  website_url: string | null;
  position: string | null;
  office_location: string | null;
  office_hours: string | null;
  research_interests: string[] | null;
  department_role: string | null;
  qualifications: string | null;
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

type UserRole = "student" | "staff" | "admin" | "lead" | "deputy";

export default function UpdateUserRoleForm({
  profile,
}: {
  profile: Profile;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<ProfileUpdateData>({
    full_name: profile.full_name || "",
    role: profile.role,
    academic_level: profile.academic_level || "student",
    department: profile.department || "Software Engineering",
    faculty: profile.faculty || "Faculty of Computing",
    institution: profile.institution || "Bayero University",
    linkedin_url: profile.linkedin_url || "",
    github_url: profile.github_url || "",
    bio: profile.bio || "",
    registration_number: profile.registration_number || "",
    staff_number: profile.staff_number || "",
    skills: profile.skills || [],
    specialization: profile.specialization || "",
    gpa: profile.gpa || null,
    academic_standing: profile.academic_standing || "Good",
    interests: profile.interests || "",
    website_url: profile.website_url || "",
    position: profile.position || "",
    office_location: profile.office_location || "",
    office_hours: profile.office_hours || "",
    research_interests: profile.research_interests || [],
    department_role: profile.department_role || "",
    qualifications: profile.qualifications || "",
  });

  const [currentCourses, setCurrentCourses] = useState<string[]>(profile.current_courses || []);
  const [achievements, setAchievements] = useState<string[]>(profile.achievements || []);
  const [researchInterests, setResearchInterests] = useState<string[]>(profile.research_interests || []);

  const [newCourse, setNewCourse] = useState("");
  const [newAchievement, setNewAchievement] = useState("");
  const [newResearchInterest, setNewResearchInterest] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string | null }>({ type: null, message: null });

  const userRole: UserRole = (profile.role?.toLowerCase() as UserRole) || "student";
  const isStaffOrAdmin = userRole === "staff" || userRole === "admin";
  const isStudent = userRole === "student" || userRole === "lead" || userRole === "deputy";

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.skills?.includes(trimmedSkill)) {
      setFormData({ ...formData, skills: [...(formData.skills || []), trimmedSkill] });
      setNewSkill("");
      setShowSkillSuggestions(false);
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills?.filter(s => s !== skill) || [] });
  };

  const addCourse = (course: string) => {
    const trimmedCourse = course.trim();
    if (trimmedCourse && !currentCourses.includes(trimmedCourse)) {
      setCurrentCourses([...currentCourses, trimmedCourse]);
      setNewCourse("");
    }
  };

  const removeCourse = (course: string) => {
    setCurrentCourses(currentCourses.filter(c => c !== course));
  };

  const addAchievement = (achievement: string) => {
    const trimmedAchievement = achievement.trim();
    if (trimmedAchievement && !achievements.includes(trimmedAchievement)) {
      setAchievements([...achievements, trimmedAchievement]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (achievement: string) => {
    setAchievements(achievements.filter(a => a !== achievement));
  };

  const addResearchInterest = (interest: string) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !researchInterests.includes(trimmedInterest)) {
      setResearchInterests([...researchInterests, trimmedInterest]);
      setNewResearchInterest("");
    }
  };

  const removeResearchInterest = (interest: string) => {
    setResearchInterests(researchInterests.filter(r => r !== interest));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback({ type: null, message: null });

    try {
      const updates: ProfileUpdateData = {
        ...formData,
        current_courses: currentCourses,
        achievements: achievements,
        research_interests: researchInterests,
      };

      console.log("Submitting profile update for user:", profile.id);
      const result = await updateUserProfile(profile.id, updates);
      console.log("Update result:", result);

      if (result.success) {
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        setTimeout(() => {
          router.push("/dashboard/admin/users");
          router.refresh();
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: result.error || 'Failed to update profile' });
      }
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'An error occurred while updating the profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
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
                  <SelectItem value="deputy">Deputy</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={isStudent ? "registration_number" : "staff_number"}>
                {isStudent ? "Registration Number" : "Staff Number"}
              </Label>
              <Input
                id={isStudent ? "registration_number" : "staff_number"}
                value={isStudent ? formData.registration_number : formData.staff_number}
                onChange={(e) => setFormData({ ...formData, [isStudent ? "registration_number" : "staff_number"]: e.target.value })}
                placeholder={isStudent ? "e.g., U/21/CS/1234" : "e.g., STF/001"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about the user..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic/Professional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {isStudent ? "Academic Details" : "Professional Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isStudent && (
              <div className="space-y-2">
                <Label htmlFor="academic_level">Academic Level</Label>
                <Select
                  value={formData.academic_level}
                  onValueChange={(value) => setFormData({ ...formData, academic_level: value })}
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
            )}

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="faculty">Faculty</Label>
              <Input
                id="faculty"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Skills
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Add Skills</Label>
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
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills?.map(skill => (
              <Badge key={skill} variant="secondary" className="px-3 py-1">
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
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student-Specific Details */}
      {isStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Student Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization/Major</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Software Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (Optional)</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.gpa || ""}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="e.g., 4.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_standing">Academic Standing</Label>
                <Select
                  value={formData.academic_standing}
                  onValueChange={(value) => setFormData({ ...formData, academic_standing: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select standing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Probation">Probation</SelectItem>
                    <SelectItem value="Dean's List">Dean's List</SelectItem>
                    <SelectItem value="Graduated">Graduated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Personal Website</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests</Label>
              <Textarea
                id="interests"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="What are their academic and professional interests?"
              />
            </div>

            <div className="space-y-2">
              <Label>Current Courses</Label>
              <div className="flex gap-2">
                <Input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCourse(newCourse))}
                  placeholder="Add a course"
                />
                <Button type="button" onClick={() => addCourse(newCourse)} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {currentCourses.map(course => (
                  <Badge key={course} variant="secondary" className="px-3 py-1">
                    {course}
                    <button type="button" onClick={() => removeCourse(course)} className="ml-2 hover:bg-slate-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Achievements</Label>
              <div className="flex gap-2">
                <Input
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement(newAchievement))}
                  placeholder="Add an achievement"
                />
                <Button type="button" onClick={() => addAchievement(newAchievement)} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {achievements.map(achievement => (
                  <Badge key={achievement} variant="secondary" className="px-3 py-1">
                    {achievement}
                    <button type="button" onClick={() => removeAchievement(achievement)} className="ml-2 hover:bg-slate-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff-Specific Details */}
      {isStaffOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Staff Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position/Title</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Senior Lecturer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_location">Office Location</Label>
                <Input
                  id="office_location"
                  value={formData.office_location}
                  onChange={(e) => setFormData({ ...formData, office_location: e.target.value })}
                  placeholder="e.g., Room 205, Block A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="office_hours">Office Hours</Label>
                <Input
                  id="office_hours"
                  value={formData.office_hours}
                  onChange={(e) => setFormData({ ...formData, office_hours: e.target.value })}
                  placeholder="e.g., Mon-Wed 10am-12pm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department_role">Department Role</Label>
                <Input
                  id="department_role"
                  value={formData.department_role}
                  onChange={(e) => setFormData({ ...formData, department_role: e.target.value })}
                  placeholder="e.g., FYP Supervisor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Input
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="e.g., PhD Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">Personal Website</Label>
                <Input
                  id="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Research Interests</Label>
              <div className="flex gap-2">
                <Input
                  value={newResearchInterest}
                  onChange={(e) => setNewResearchInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResearchInterest(newResearchInterest))}
                  placeholder="Add a research interest"
                />
                <Button type="button" onClick={() => addResearchInterest(newResearchInterest)} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {researchInterests.map(interest => (
                  <Badge key={interest} variant="secondary" className="px-3 py-1">
                    {interest}
                    <button type="button" onClick={() => removeResearchInterest(interest)} className="ml-2 hover:bg-slate-200 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback & Submit */}
      <div className="space-y-4">
        {feedback.message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {feedback.message}
          </div>
        )}

        <Button type="submit" size="lg" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}
