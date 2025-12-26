"use client";

import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Camera,
  User,
  Building2,
  Linkedin,
  Github,
  GraduationCap,
  Briefcase,
  X,
  Check,
  MapPin,
  Mail,
  Sparkles,
  Crown,
  ShieldCheck,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  role?: string;
  registration_number?: string;
  staff_number?: string;
  academic_level?: string;
  department?: string;
  faculty?: string;
  institution?: string;
  linkedin_url?: string;
  github_url?: string;
  skills?: string[];
  bio?: string;
};

type UserRole = "student" | "staff" | "admin" | "lead" | "deputy";

const roleConfig: Record<UserRole, { label: string; icon: any; color: string; gradient: string }> = {
  student: {
    label: "Student",
    icon: GraduationCap,
    color: "from-violet-500 to-purple-500",
    gradient: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20"
  },
  staff: {
    label: "Staff",
    icon: Briefcase,
    color: "from-blue-500 to-cyan-500",
    gradient: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
  },
  admin: {
    label: "Administrator",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-500",
    gradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
  },
  lead: {
    label: "Cluster Lead",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    gradient: "from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
  },
  deputy: {
    label: "Cluster Deputy",
    icon: Crown,
    color: "from-pink-500 to-rose-500",
    gradient: "from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20"
  },
};

const academicLevelOptions = [
  { value: "student", label: "New Student", color: "bg-slate-100 text-slate-700" },
  { value: "level_100", label: "Level 100 (Freshman)", color: "bg-green-100 text-green-700" },
  { value: "level_200", label: "Level 200 (Sophomore)", color: "bg-teal-100 text-teal-700" },
  { value: "level_300", label: "Level 300 (Junior)", color: "bg-blue-100 text-blue-700" },
  { value: "level_400", label: "Level 400 (Senior)", color: "bg-purple-100 text-purple-700" },
  { value: "alumni", label: "Alumni", color: "bg-amber-100 text-amber-700" },
];

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
  "Mobile Development", "Flutter", "React Native", "Swift", "Kotlin",
  "Cybersecurity", "DevOps", "Testing", "REST APIs", "GraphQL"
];

export default function UpdateProfileForm({
  user,
  profile,
}: {
  user: any;
  profile: Profile;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [academicLevel, setAcademicLevel] = useState(profile.academic_level || "student");
  const [department, setDepartment] = useState(profile.department || "Software Engineering");
  const [faculty, setFaculty] = useState(profile.faculty || "Faculty of Computing");
  const [institution, setInstitution] = useState(profile.institution || "Bayero University");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [bio, setBio] = useState(profile.bio || "");
  const [registrationNumber, setRegistrationNumber] = useState(profile.registration_number || "");
  const [staffNumber, setStaffNumber] = useState(profile.staff_number || "");
  const [newSkill, setNewSkill] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const userRole: UserRole = (profile.role?.toLowerCase() as UserRole) || "student";
  const isStaffOrAdmin = userRole === "staff" || userRole === "admin";
  const isStudent = userRole === "student";
  const roleSettings = roleConfig[userRole] || roleConfig.student;

  // Profile completion calculation
  const getProfileCompletion = () => {
    let completed = 0;
    let total = 5;
    if (fullName) completed++;
    if (avatarUrl) completed++;
    if (bio && bio.length > 10) completed++;
    if (linkedinUrl) completed++;
    if (githubUrl) completed++;
    if (isStaffOrAdmin && staffNumber) { completed++; total++; }
    if (isStudent && registrationNumber) { completed++; total++; }
    if (isStudent && academicLevel && academicLevel !== "student") { completed++; total++; }
    if (skills.length > 0) { completed++; total++; }
    return Math.round((completed / total) * 100);
  };

  const completionPercentage = getProfileCompletion();

  useEffect(() => {
    if (profile.avatar_url && profile.avatar_url.startsWith("http")) {
      setAvatarUrl(profile.avatar_url);
    } else if (profile.avatar_url) {
      const fetchAvatarUrl = async () => {
        try {
          const { data, error } = await supabase.storage
            .from("avatars")
            .createSignedUrl(profile.avatar_url, 3600);

          if (error) {
            try {
              const { data: publicData } = await supabase.storage
                .from("avatars")
                .getPublicUrl(profile.avatar_url);
              const normalizedUrl = publicData?.publicUrl?.replace("localhost", "127.0.0.1") || null;
              setAvatarUrl(normalizedUrl);
            } catch {
              setAvatarUrl(null);
            }
          } else if (data?.signedUrl) {
            const normalizedUrl = data.signedUrl.replace("localhost", "127.0.0.1");
            setAvatarUrl(normalizedUrl);
          } else {
            try {
              const { data: publicData } = await supabase.storage
                .from("avatars")
                .getPublicUrl(profile.avatar_url);
              const normalizedUrl = publicData?.publicUrl?.replace("localhost", "127.0.0.1") || null;
              setAvatarUrl(normalizedUrl);
            } catch {
              setAvatarUrl(null);
            }
          }
        } catch {
          try {
            const { data: publicData } = await supabase.storage
              .from("avatars")
              .getPublicUrl(profile.avatar_url);
            const normalizedUrl = publicData?.publicUrl?.replace("localhost", "127.0.0.1") || null;
            setAvatarUrl(normalizedUrl);
          } catch {
            setAvatarUrl(null);
          }
        }
      };
      fetchAvatarUrl();
    } else {
      setAvatarUrl(null);
    }
  }, [profile.avatar_url, supabase]);

  useEffect(() => {
    setFullName(profile.full_name || "");
    setAcademicLevel(profile.academic_level || "student");
    setDepartment(profile.department || "Software Engineering");
    setFaculty(profile.faculty || "Faculty of Computing");
    setInstitution(profile.institution || "Bayero University");
    setLinkedinUrl(profile.linkedin_url || "");
    setGithubUrl(profile.github_url || "");
    setSkills(profile.skills || []);
    setBio(profile.bio || "");
    setRegistrationNumber(profile.registration_number || "");
    setStaffNumber(profile.staff_number || "");
  }, [profile]);

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error uploading avatar.");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      if (profile.avatar_url) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([profile.avatar_url]);
        if (deleteError) console.error("Error deleting old avatar:", deleteError);
      }

      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      setAvatarUrl(null);
      setAvatarFile(null);
      router.refresh();
      setSuccessMessage("Profile picture removed successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error removing profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      let avatar_url = profile.avatar_url;

      if (avatarFile) {
        if (profile.avatar_url) {
          const { error: deleteError } = await supabase.storage
            .from("avatars")
            .remove([profile.avatar_url]);
          if (deleteError) console.error("Error deleting old avatar:", deleteError);
        }

        const fileExt = avatarFile.name.split(".").pop()?.toLowerCase();
        const fileName = `${user.id}-${Math.random()}`;
        const filePath = fileExt ? `${fileName}.${fileExt}` : fileName;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;
        avatar_url = filePath;
      }

      const updateData: any = {
        full_name: fullName,
        avatar_url,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        skills: skills,
        bio: bio,
      };

      if (isStudent) {
        updateData.academic_level = academicLevel;
        updateData.department = department;
        updateData.faculty = faculty;
        updateData.institution = institution;
        updateData.registration_number = registrationNumber;
        updateData.staff_number = null;
      } else if (isStaffOrAdmin) {
        updateData.academic_level = null;
        updateData.department = department;
        updateData.faculty = faculty;
        updateData.institution = institution;
        updateData.staff_number = staffNumber;
        updateData.registration_number = null;
      }

      await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (avatar_url && avatar_url !== profile.avatar_url) {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("avatars")
          .createSignedUrl(avatar_url, 3600);
        if (!urlError && urlData?.signedUrl) {
          setAvatarUrl(urlData.signedUrl.replace("localhost", "127.0.0.1"));
        } else {
          const { data: publicData } = await supabase.storage
            .from("avatars")
            .getPublicUrl(avatar_url);
          setAvatarUrl(publicData?.publicUrl?.replace("localhost", "127.0.0.1") || avatar_url);
        }
      } else if (!avatar_url && profile.avatar_url) {
        setAvatarUrl(null);
      }

      router.refresh();
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error updating profile.");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const RoleIcon = roleConfig[userRole]?.icon || User;
  const roleLabel = roleConfig[userRole]?.label || "User";

  return (
    <div className="space-y-6">
      {/* Profile Completion Card */}
      <div className={`rounded-2xl p-6 bg-gradient-to-r ${roleSettings.gradient} border border-white/20 shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className={`w-5 h-5 bg-gradient-to-r ${roleSettings.color} text-white p-1 rounded-lg`} />
            <div>
              <p className="text-sm font-semibold text-foreground">Profile Completion</p>
              <p className="text-xs text-muted-foreground">
                {completionPercentage === 100
                  ? "Your profile is complete!"
                  : "Complete your profile to stand out"}
              </p>
            </div>
          </div>
          <div className={`text-3xl font-bold bg-gradient-to-r ${roleSettings.color} bg-clip-text text-transparent`}>
            {completionPercentage}%
          </div>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${roleSettings.color} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="border-2 shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
        <div className={`h-36 bg-gradient-to-r ${roleSettings.color}`} />
        <CardContent className="relative px-8 pb-8 -mt-20">
          <div className="relative inline-block mb-4 group">
            <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
              <AvatarImage src={avatarUrl || undefined} alt={fullName} />
              <AvatarFallback className={`text-3xl bg-gradient-to-br ${roleSettings.color} text-white font-bold`}>
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-1 right-1 p-3 bg-white text-foreground rounded-xl shadow-lg cursor-pointer hover:scale-110 hover:shadow-xl transition-all duration-200"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            {avatarUrl && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={uploading}
                className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-xl shadow-lg cursor-pointer hover:bg-red-600 hover:scale-110 transition-all duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                {fullName || "Your Name"}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                <Badge className={`gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r ${roleSettings.color} text-white font-medium border-0 shadow-md`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {roleLabel}
                </Badge>
                {user.email && (
                  <Badge variant="outline" className="gap-2 px-3.5 py-1.5 rounded-full bg-background/50 backdrop-blur-sm">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {bio && (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed line-clamp-2">{bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-lg border-muted/50">
          <CardContent className="p-8 space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Basic Information</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2.5">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-foreground ml-0.5">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="h-12 text-base border-muted/200 focus-visible:ring-2 focus-visible:ring-offset-0"
                  />
                </div>

                {isStudent ? (
                  <div className="space-y-2.5">
                    <Label htmlFor="registrationNumber" className="text-sm font-semibold text-foreground ml-0.5">
                      Registration Number
                    </Label>
                    <Input
                      id="registrationNumber"
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g., 24/12345"
                      className="h-12 text-base border-muted/200"
                    />
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Label htmlFor="staffNumber" className="text-sm font-semibold text-foreground ml-0.5">
                      Staff Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="staffNumber"
                      type="text"
                      value={staffNumber}
                      onChange={(e) => setStaffNumber(e.target.value)}
                      placeholder="e.g., STF-001"
                      required={!isStudent}
                      className="h-12 text-base border-muted/200"
                    />
                  </div>
                )}

                <div className="space-y-2.5 md:col-span-2">
                  <Label htmlFor="bio" className="text-sm font-semibold text-foreground ml-0.5">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                    className="min-h-[120px] text-base border-muted/200 resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1.5">
                    {bio.length}/500
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-muted/100" />

            {/* Academic/Professional Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {isStudent ? "Academic Information" : "Professional Information"}
                </h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {isStudent && (
                  <div className="space-y-2.5">
                    <Label htmlFor="academicLevel" className="text-sm font-semibold text-foreground ml-0.5">
                      Academic Level
                    </Label>
                    <select
                      id="academicLevel"
                      value={academicLevel}
                      onChange={(e) => setAcademicLevel(e.target.value)}
                      className="h-12 w-full rounded-xl border border-muted/200 bg-background px-4 text-base focus:ring-2 focus:ring-offset-0"
                    >
                      {academicLevelOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2.5">
                  <Label htmlFor="department" className="text-sm font-semibold text-foreground ml-0.5">
                    Department
                  </Label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-12 w-full rounded-xl border border-muted/200 bg-background px-4 text-base focus:ring-2 focus:ring-offset-0"
                  >
                    {departmentOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="faculty" className="text-sm font-semibold text-foreground ml-0.5">Faculty</Label>
                  <Input
                    id="faculty"
                    type="text"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="Enter faculty"
                    className="h-12 text-base border-muted/200"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="institution" className="text-sm font-semibold text-foreground ml-0.5">
                    Institution
                  </Label>
                  <Input
                    id="institution"
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Enter institution"
                    className="h-12 text-base border-muted/200"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-muted/100" />

            {/* Skills Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <GraduationCap className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Skills & Expertise</h3>
                </div>
                <Badge variant="outline" className="px-3.5 py-1.5 rounded-full bg-background/50 backdrop-blur-sm">
                  {skills.length} skill{skills.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Input
                      id="newSkill"
                      type="text"
                      value={newSkill}
                      onChange={(e) => {
                        setNewSkill(e.target.value);
                        setShowSuggestions(e.target.value.length > 0);
                      }}
                      placeholder="Add a skill (e.g. JavaScript, React, Python)"
                      className="h-12 text-base border-muted/200 pr-12"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(newSkill);
                          setShowSuggestions(false);
                        }
                      }}
                      onFocus={() => setShowSuggestions(newSkill.length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addSkill(newSkill);
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {showSuggestions && newSkill && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-background border border-muted/200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto">
                        {suggestedSkills
                          .filter((s) => s.toLowerCase().includes(newSkill.toLowerCase()))
                          .map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                addSkill(suggestion);
                                setShowSuggestions(false);
                              }}
                              className="w-full px-4 py-3 text-left text-base hover:bg-muted/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                            >
                              {suggestion}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r ${roleSettings.gradient} hover:opacity-90 transition-opacity border border-white/20 cursor-default`}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1.5 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-muted/30 border-2 border-dashed border-muted/40">
                    <GraduationCap className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No skills added yet. Add your skills to showcase your expertise.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-muted/100" />

            {/* Social Links Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Social Profiles</h3>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2.5">
                  <Label htmlFor="linkedinUrl" className="text-sm font-semibold text-foreground ml-0.5 flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    LinkedIn Profile URL
                  </Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="h-12 text-base border-muted/200"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="githubUrl" className="text-sm font-semibold text-foreground ml-0.5 flex items-center gap-2">
                    <Github className="w-4 h-4 text-foreground" />
                    GitHub Profile URL
                  </Label>
                  <Input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/your-profile"
                    className="h-12 text-base border-muted/200"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <div className="p-5 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-4 shadow-lg">
            <div className="p-2 bg-red-500 text-white rounded-xl flex-shrink-0">
              <X className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-start gap-4 shadow-lg">
            <div className="p-2 bg-emerald-500 text-white rounded-xl flex-shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className={`w-full h-14 text-base font-semibold bg-gradient-to-r ${roleSettings.color} hover:opacity-90 text-white shadow-xl shadow-black/10 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:scale-[1.01] rounded-2xl`}
          disabled={uploading}
        >
          {uploading ? (
            <span className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving Changes...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Save Profile Changes
              <ArrowUpRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
