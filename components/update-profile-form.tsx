"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
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
  ShieldCheck,
  Save,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { Separator } from "./ui/separator";
import { Profile } from "@/lib/supabase/storage-utils";

type UserRole = "student" | "staff" | "admin" | "lead" | "deputy";

const roleConfig: Record<UserRole, { label: string; icon: any; color: string; gradient: string }> = {
  student: {
    label: "Student",
    icon: GraduationCap,
    color: "text-violet-500",
    gradient: "from-violet-500/10 to-purple-500/10 border-violet-200/20"
  },
  staff: {
    label: "Staff",
    icon: Briefcase,
    color: "text-blue-500",
    gradient: "from-blue-500/10 to-cyan-500/10 border-blue-200/20"
  },
  admin: {
    label: "Administrator",
    icon: ShieldCheck,
    color: "text-emerald-500",
    gradient: "from-emerald-500/10 to-teal-500/10 border-emerald-200/20"
  },
  lead: {
    label: "Cluster Lead",
    icon: Sparkles,
    color: "text-amber-500",
    gradient: "from-amber-500/10 to-orange-500/10 border-amber-200/20"
  },
  deputy: {
    label: "Cluster Deputy",
    icon: Sparkles,
    color: "text-pink-500",
    gradient: "from-pink-500/10 to-rose-500/10 border-pink-200/20"
  },
};

const academicLevelOptions = [
  { value: "student", label: "New Student" },
  { value: "level_100", label: "Level 100 (Freshman)" },
  { value: "level_200", label: "Level 200 (Sophomore)" },
  { value: "level_300", label: "Level 300 (Junior)" },
  { value: "level_400", label: "Level 400 (Senior)" },
  { value: "alumni", label: "Alumni" },
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

  // State initialization
  const [formData, setFormData] = useState({
    fullName: profile.full_name || "",
    academicLevel: profile.academic_level || "student",
    department: profile.department || "Software Engineering",
    faculty: profile.faculty || "Faculty of Computing",
    institution: profile.institution || "Bayero University",
    linkedinUrl: profile.linkedin_url || "",
    githubUrl: profile.github_url || "",
    bio: profile.bio || "",
    registrationNumber: profile.registration_number || "",
    staffNumber: profile.staff_number || "",
    // Student-specific fields
    specialization: profile.specialization || "",
    gpa: profile.gpa || null,
    academicStanding: profile.academic_standing || "Good",
    interests: profile.interests || "",
    websiteUrl: profile.website_url || "",
    // Staff-specific fields
    position: profile.position || "",
    officeLocation: profile.office_location || "",
    officeHours: profile.office_hours || "",
    departmentRole: profile.department_role || "",
    qualifications: profile.qualifications || "",
  });

  const [currentCourses, setCurrentCourses] = useState<string[]>(profile.current_courses || []);
  const [newCourse, setNewCourse] = useState("");
  const [achievements, setAchievements] = useState<string[]>(profile.achievements || []);
  const [newAchievement, setNewAchievement] = useState("");
  const [researchInterests, setResearchInterests] = useState<string[]>(profile.research_interests || []);
  const [newResearchInterest, setNewResearchInterest] = useState("");

  const [portfolioItems, setPortfolioItems] = useState<any[]>(profile.portfolio_items || []);
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: "",
    description: "",
    url: "",
    type: "project"
  });

  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, message: string | null }>({ type: null, message: null });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const userRole: UserRole = (profile.role?.toLowerCase() as UserRole) || "student";
  const isStaffOrAdmin = userRole === "staff" || userRole === "admin";
  const isStudent = userRole === "student" || userRole === "lead" || userRole === "deputy";
  const roleSettings = roleConfig[userRole] || roleConfig.student;

  // Handle Avatar URL logic
  useEffect(() => {
    const resolveAvatar = async () => {
       if (profile.avatar_url?.startsWith("http")) {
         setAvatarUrl(profile.avatar_url);
       } else if (profile.avatar_url) {
         const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
         setAvatarUrl(data.publicUrl);
       }
    };
    resolveAvatar();
  }, [profile.avatar_url, supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const addSkill = (skillToAdd: string) => {
    const skill = skillToAdd.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const addCourse = (courseToAdd: string) => {
    const course = courseToAdd.trim();
    if (course && !currentCourses.includes(course)) {
      setCurrentCourses([...currentCourses, course]);
      setNewCourse("");
    }
  };

  const removeCourse = (courseToRemove: string) => {
    setCurrentCourses(currentCourses.filter(c => c !== courseToRemove));
  };

  const addAchievement = (achievementToAdd: string) => {
    const achievement = achievementToAdd.trim();
    if (achievement && !achievements.includes(achievement)) {
      setAchievements([...achievements, achievement]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (achievementToRemove: string) => {
    setAchievements(achievements.filter(a => a !== achievementToRemove));
  };

  const addResearchInterest = (interestToAdd: string) => {
    const interest = interestToAdd.trim();
    if (interest && !researchInterests.includes(interest)) {
      setResearchInterests([...researchInterests, interest]);
      setNewResearchInterest("");
    }
  };

  const removeResearchInterest = (interestToRemove: string) => {
    setResearchInterests(researchInterests.filter(r => r !== interestToRemove));
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title.trim() && newPortfolioItem.description.trim()) {
      const item = {
        id: Date.now().toString(),
        title: newPortfolioItem.title.trim(),
        description: newPortfolioItem.description.trim(),
        url: newPortfolioItem.url.trim(),
        type: newPortfolioItem.type,
        date: new Date().toISOString().split('T')[0]
      };
      setPortfolioItems([...portfolioItems, item]);
      setNewPortfolioItem({
        title: "",
        description: "",
        url: "",
        type: "project"
      });
    }
  };

  const removePortfolioItem = (id: string) => {
    setPortfolioItems(portfolioItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setFeedback({ type: null, message: null });

    try {
      let finalAvatarUrl = profile.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        finalAvatarUrl = fileName;
      }

      const updates: any = {
        full_name: formData.fullName,
        avatar_url: finalAvatarUrl,
        linkedin_url: formData.linkedinUrl,
        github_url: formData.githubUrl,
        skills,
        bio: formData.bio,
        department: formData.department,
        faculty: formData.faculty,
        institution: formData.institution,
        // updated_at: new Date().toISOString(), // This will be handled by the DB trigger
      };

      // Add student-specific fields if they exist in the schema
      if (formData.specialization !== undefined) updates.specialization = formData.specialization;
      if (formData.gpa !== undefined) updates.gpa = formData.gpa;
      if (formData.academicStanding !== undefined) updates.academic_standing = formData.academicStanding;
      if (currentCourses !== undefined) updates.current_courses = currentCourses;
      if (achievements !== undefined) updates.achievements = achievements;
      if (portfolioItems !== undefined) updates.portfolio_items = portfolioItems;
      if (formData.interests !== undefined) updates.interests = formData.interests;
      if (formData.websiteUrl !== undefined) updates.website_url = formData.websiteUrl;

      // Add staff-specific fields if they exist in the schema
      if (formData.position !== undefined) updates.position = formData.position;
      if (formData.officeLocation !== undefined) updates.office_location = formData.officeLocation;
      if (formData.officeHours !== undefined) updates.office_hours = formData.officeHours;
      if (researchInterests !== undefined) updates.research_interests = researchInterests;
      if (formData.departmentRole !== undefined) updates.department_role = formData.departmentRole;
      if (formData.qualifications !== undefined) updates.qualifications = formData.qualifications;

      if (isStudent) {
        updates.academic_level = formData.academicLevel;
        updates.registration_number = formData.registrationNumber;
      } else if (isStaffOrAdmin) {
        updates.staff_number = formData.staffNumber;
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;

      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      router.refresh();
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'An error occurred' });
    } finally {
      setUploading(false);
    }
  };

  const completionRate = [
    formData.fullName,
    avatarUrl,
    formData.bio?.length > 10,
    skills.length > 0,
    formData.linkedinUrl || formData.githubUrl,
    isStudent ? formData.registrationNumber : formData.staffNumber
  ].filter(Boolean).length / 6 * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Profile</h1>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">{formData.fullName || "Your Name"}</h2>
            <div className="flex items-center gap-2">
              <Badge className={`${roleSettings.gradient} ${roleSettings.color} border`}>
                <roleSettings.icon className="w-3 h-3 mr-1" />
                {roleSettings.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-400">
              <span className="text-white font-medium">{Math.round(completionRate)}%</span> complete
            </div>
            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${completionRate === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Avatar & Preview */}
        <div className="lg:col-span-1">
          <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                Profile Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${roleSettings.gradient.split(' ')[0]} ${roleSettings.gradient.split(' ')[1]}`}>
                        <span className="text-2xl font-bold text-white">{formData.fullName?.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-2 right-2 p-2.5 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <h2 className="text-xl font-bold text-white mb-1">{formData.fullName || "Your Name"}</h2>

                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${roleSettings.gradient} ${roleSettings.color} border`}>
                    <roleSettings.icon className="w-3 h-3 mr-1" />
                    {roleSettings.label}
                  </Badge>
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {formData.bio || "No bio provided. Add a short description to let others know about your interests and expertise."}
                </p>

                <div className="flex gap-2">
                  {formData.linkedinUrl && (
                    <a href={formData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-[#0077b5]/20 hover:text-[#0077b5] rounded-xl transition-colors border border-white/5">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {formData.githubUrl && (
                    <a href={formData.githubUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-xl transition-colors border border-white/5">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-slate-300">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={isStudent ? "registrationNumber" : "staffNumber"} className="text-slate-300">
                      {isStudent ? "Registration Number" : "Staff Number"}
                    </Label>
                    <Input
                      id={isStudent ? "registrationNumber" : "staffNumber"}
                      value={isStudent ? formData.registrationNumber : formData.staffNumber}
                      onChange={handleInputChange}
                      placeholder={isStudent ? "e.g., U/21/CS/1234" : "e.g., STF/001"}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us a bit about yourself..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[120px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Academic / Professional Details */}
            <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building2 className="w-5 h-5" />
                  {isStudent ? "Academic Details" : "Professional Details"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isStudent && (
                    <div className="space-y-2">
                      <Label htmlFor="academicLevel" className="text-slate-300">Level</Label>
                      <select
                        id="academicLevel"
                        className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        value={formData.academicLevel}
                        onChange={handleInputChange}
                      >
                        {academicLevelOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-slate-300">Department</Label>
                    <select
                      id="department"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      {departmentOptions.map(d => (
                        <option key={d} value={d} className="bg-slate-800">{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faculty" className="text-slate-300">Faculty</Label>
                    <Input
                      id="faculty"
                      value={formData.faculty}
                      onChange={handleInputChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-slate-300">Institution</Label>
                    <Input
                      id="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Add Skills</Label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => { setNewSkill(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                        placeholder="Add a skill (e.g. React, Python)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Button type="button" onClick={() => addSkill(newSkill)} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {showSuggestions && newSkill && (
                      <div className="absolute top-full left-0 z-10 w-full bg-slate-800 text-white shadow-lg rounded-md border border-white/10 mt-1 p-1 max-h-60 overflow-y-auto">
                        {suggestedSkills
                          .filter(s => s.toLowerCase().includes(newSkill.toLowerCase()))
                          .slice(0, 5)
                          .map(s => (
                            <div
                              key={s}
                              className="px-3 py-2 hover:bg-white/10 rounded-sm cursor-pointer text-sm"
                              onClick={() => { addSkill(s); setShowSuggestions(false); }}
                            >
                              {s}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
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
                  {skills.length === 0 && <span className="text-slate-500 italic">No skills added yet.</span>}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="w-5 h-5" />
                  Social Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="flex items-center gap-2 text-slate-300">
                      <Linkedin className="w-4 h-4 text-[#0077b5]" /> LinkedIn
                    </Label>
                    <Input
                      id="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubUrl" className="flex items-center gap-2 text-slate-300">
                      <Github className="w-4 h-4" /> GitHub
                    </Label>
                    <Input
                      id="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleInputChange}
                      placeholder="https://github.com/..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student-Specific Details */}
            {isStudent && (
              <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <GraduationCap className="w-5 h-5" />
                    Student Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-slate-300">Specialization/Major</Label>
                      <Input
                        id="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        placeholder="e.g., Software Engineering, Data Science"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gpa" className="text-slate-300">GPA (Optional)</Label>
                      <Input
                        id="gpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={formData.gpa || ""}
                        onChange={(e) => setFormData({...formData, gpa: e.target.value ? parseFloat(e.target.value) : null})}
                        placeholder="e.g., 4.50"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academicStanding" className="text-slate-300">Academic Standing</Label>
                    <select
                      id="academicStanding"
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.academicStanding}
                      onChange={handleInputChange}
                    >
                      <option value="Good" className="bg-slate-800">Good</option>
                      <option value="Probation" className="bg-slate-800">Probation</option>
                      <option value="Dean's List" className="bg-slate-800">Dean's List</option>
                      <option value="Graduated" className="bg-slate-800">Graduated</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests" className="text-slate-300">Interests</Label>
                    <Textarea
                      id="interests"
                      value={formData.interests}
                      onChange={handleInputChange}
                      placeholder="What are your academic and professional interests?"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl" className="text-slate-300">Personal Website (Optional)</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleInputChange}
                      placeholder="https://your-website.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Current Courses</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCourse}
                        onChange={(e) => setNewCourse(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCourse(newCourse))}
                        placeholder="Add a course (e.g. Software Engineering, Data Structures)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Button type="button" onClick={() => addCourse(newCourse)} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {currentCourses.map(course => (
                        <Badge key={course} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                          {course}
                          <button
                            type="button"
                            onClick={() => removeCourse(course)}
                            className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {currentCourses.length === 0 && <span className="text-slate-500 italic">No courses added yet.</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Achievements</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newAchievement}
                        onChange={(e) => setNewAchievement(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement(newAchievement))}
                        placeholder="Add an achievement (e.g. Dean's List, Hackathon Winner)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Button type="button" onClick={() => addAchievement(newAchievement)} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {achievements.map(achievement => (
                        <Badge key={achievement} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                          {achievement}
                          <button
                            type="button"
                            onClick={() => removeAchievement(achievement)}
                            className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {achievements.length === 0 && <span className="text-slate-500 italic">No achievements added yet.</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Portfolio Items</Label>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Input
                            value={newPortfolioItem.title}
                            onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})}
                            placeholder="Project title"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <select
                            value={newPortfolioItem.type}
                            onChange={(e) => setNewPortfolioItem({...newPortfolioItem, type: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="project" className="bg-slate-800">Project</option>
                            <option value="certification" className="bg-slate-800">Certification</option>
                            <option value="award" className="bg-slate-800">Award</option>
                            <option value="publication" className="bg-slate-800">Publication</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Textarea
                          value={newPortfolioItem.description}
                          onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})}
                          placeholder="Description"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Input
                          value={newPortfolioItem.url}
                          onChange={(e) => setNewPortfolioItem({...newPortfolioItem, url: e.target.value})}
                          placeholder="URL (optional)"
                          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />
                      </div>

                      <Button type="button" onClick={addPortfolioItem} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Portfolio Item
                      </Button>
                    </div>

                    <div className="space-y-3 mt-4">
                      {portfolioItems.map(item => (
                        <div key={item.id} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white">{item.title}</h4>
                              <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline mt-1 inline-block"
                                >
                                  View Project
                                </a>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="border-white/10 text-slate-400 bg-white/10 text-xs">
                                  {item.type}
                                </Badge>
                                <Badge variant="outline" className="border-white/10 text-slate-400 bg-white/10 text-xs">
                                  {item.date}
                                </Badge>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removePortfolioItem(item.id)}
                              className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {portfolioItems.length === 0 && <span className="text-slate-500 italic">No portfolio items added yet.</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Staff-Specific Details */}
            {isStaffOrAdmin && (
              <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Briefcase className="w-5 h-5" />
                    Staff Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-slate-300">Position/Title</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        placeholder="e.g., Senior Lecturer, Department Head"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="officeLocation" className="text-slate-300">Office Location</Label>
                      <Input
                        id="officeLocation"
                        value={formData.officeLocation}
                        onChange={handleInputChange}
                        placeholder="e.g., Room 205, Block A"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="officeHours" className="text-slate-300">Office Hours</Label>
                      <Input
                        id="officeHours"
                        value={formData.officeHours}
                        onChange={handleInputChange}
                        placeholder="e.g., Mon-Wed 10am-12pm"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="departmentRole" className="text-slate-300">Department Role</Label>
                      <Input
                        id="departmentRole"
                        value={formData.departmentRole}
                        onChange={handleInputChange}
                        placeholder="e.g., FYP Supervisor, Cluster Manager"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualifications" className="text-slate-300">Qualifications</Label>
                      <Input
                        id="qualifications"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        placeholder="e.g., PhD Computer Science"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="text-slate-300">Personal Website (Optional)</Label>
                      <Input
                        id="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={handleInputChange}
                        placeholder="https://your-website.com"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Research Interests</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newResearchInterest}
                        onChange={(e) => setNewResearchInterest(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResearchInterest(newResearchInterest))}
                        placeholder="Add a research interest (e.g. AI, Cybersecurity)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      />
                      <Button type="button" onClick={() => addResearchInterest(newResearchInterest)} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {researchInterests.map(interest => (
                        <Badge key={interest} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                          {interest}
                          <button
                            type="button"
                            onClick={() => removeResearchInterest(interest)}
                            className="ml-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {researchInterests.length === 0 && <span className="text-slate-500 italic">No research interests added yet.</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              {feedback.message && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {feedback.message}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
                disabled={uploading}
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                {uploading ? "Saving Changes..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}