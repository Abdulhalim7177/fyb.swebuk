"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Code2,
  ExternalLink,
  Github,
  Linkedin,
  MapPin,
  Mail,
  Edit3,
  User,
  Building2,
  Calendar,
  Star,
  Users,
  FolderOpen,
  MessageCircle,
  Settings,
  Copy,
  Check,
  Download,
  Share2,
  Heart,
  Eye,
  Plus,
  ArrowUpRight,
  Filter,
  Search,
  Tags,
  Globe,
  GitBranch,
  Lock,
  EyeIcon,
  EyeOff,
  TrendingUp,
  Award,
  Activity,
  Layers,
  Zap,
  Share,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

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
  email?: string;
  created_at?: string;
  // Student-specific fields
  specialization?: string;
  gpa?: number;
  academic_standing?: string;
  current_courses?: string[];
  achievements?: string[];
  portfolio_items?: any[];
  interests?: string;
  // Staff-specific fields
  position?: string;
  office_location?: string;
  office_hours?: string;
  research_interests?: string[];
  department_role?: string;
  staff_profile?: any;
  qualifications?: string;
  website_url?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  cluster_id?: string;
  repository_url?: string;
  demo_url?: string;
  project_tags?: { tag: string }[];
};

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

const academicLevelOptions: Record<string, string> = {
  "student": "New Student",
  "level_100": "Level 100 (Freshman)",
  "level_200": "Level 200 (Sophomore)",
  "level_300": "Level 300 (Junior)",
  "level_400": "Level 400 (Senior)",
  "alumni": "Alumni",
};

export default function ModernPortfolioPage({
  profile,
  projects,
  onEditProfile,
}: {
  profile: Profile;
  projects: Project[];
  onEditProfile?: () => void;
}) {
  const router = useRouter();

  const userRole: UserRole = (profile.role?.toLowerCase() as UserRole) || "student";
  const roleSettings = roleConfig[userRole] || roleConfig.student;
  const isStudent = userRole === "student";

  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPortfolioLink = () => {
    const portfolioUrl = `${window.location.origin}/portfolio/${profile.id}`;
    navigator.clipboard.writeText(portfolioUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleViewPublicProfile = () => {
    router.push(`/portfolio/${profile.id}`);
  };

  const formatAcademicLevel = (level: string | undefined) => {
    if (!level) return "Professional";
    return academicLevelOptions[level] || level.charAt(0).toUpperCase() + level.slice(1);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const joinDate = profile.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear();

  // Filter projects based on active filter and search term
  const filteredProjects = projects.filter(project => {
    const matchesFilter = activeFilter === "all" || 
                          (activeFilter === "personal" && project.type === "personal") || 
                          (activeFilter === "cluster" && project.type === "cluster");
    
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const projectCount = projects.length;
  const skillCount = profile.skills?.length || 0;
  const memberSince = joinDate;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Portfolio Overview
            </h1>
            <p className="text-slate-400 mt-2">
              Welcome back, <span className="text-white font-medium">{profile.full_name?.split(' ')[0]}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleCopyPortfolioLink}
            >
              {linkCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleViewPublicProfile}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Public
            </Button>

            {onEditProfile && (
              <Button onClick={onEditProfile} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 mb-2">
            <FolderOpen className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">{projectCount}</span>
          <span className="text-sm text-slate-400">Projects</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 mb-2">
            <Code2 className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">{skillCount}</span>
          <span className="text-sm text-slate-400">Skills</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 mb-2">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">8</span>
          <span className="text-sm text-slate-400">Collaborations</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 mb-2">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">{memberSince}</span>
          <span className="text-sm text-slate-400">Member Since</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${roleSettings.gradient.split(' ')[0]} ${roleSettings.gradient.split(' ')[1]}`}>
                        <span className="text-2xl font-bold text-white">{getInitials(profile.full_name || 'User')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md z-20`}>
                    <roleSettings.icon className="w-4 h-4 text-white" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                  {profile.full_name}
                </h2>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge className={`${roleSettings.gradient} ${roleSettings.color} border`}>
                    <roleSettings.icon className="w-3 h-3 mr-1" />
                    {roleSettings.label}
                  </Badge>
                  
                  {(isStudent || userRole === "lead" || userRole === "deputy") && profile.academic_level && (
                    <Badge variant="outline" className="border-white/20 text-slate-300">
                      {formatAcademicLevel(profile.academic_level)}
                    </Badge>
                  )}
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {profile.bio || "No bio provided. Add a short description to let others know about your interests and expertise."}
                </p>

                <div className="flex gap-2">
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-xl transition-colors border border-white/5">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-[#0077b5]/20 hover:text-[#0077b5] rounded-xl transition-colors border border-white/5">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-xl transition-colors border border-white/5">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-xl transition-colors border border-white/5">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300 text-sm">Academic Level</h3>
                    <p className="text-white">
                      {(isStudent || userRole === "lead" || userRole === "deputy") ? formatAcademicLevel(profile.academic_level) : "Professional"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300 text-sm">Department</h3>
                    <p className="text-white">{profile.department || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300 text-sm">Institution</h3>
                    <p className="text-white">{profile.institution || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300 text-sm">Member Since</h3>
                    <p className="text-white">{memberSince}</p>
                  </div>
                </div>

                {profile.email && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300 text-sm">Email</h3>
                      <a
                        href={`mailto:${profile.email}`}
                        className="text-primary hover:underline break-all"
                      >
                        {profile.email}
                      </a>
                    </div>
                  </div>
                )}

                {profile.website_url && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300 text-sm">Website</h3>
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {profile.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-white/10" />

              {/* Student-Specific Details */}
              {(userRole === "student" || userRole === "lead" || userRole === "deputy") && (
                <>
                  {profile.specialization && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-300 text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Specialization
                      </h3>
                      <p className="text-white">{profile.specialization}</p>
                    </div>
                  )}

                  {profile.gpa && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-300 text-sm flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        GPA
                      </h3>
                      <p className="text-white">{profile.gpa.toFixed(2)}</p>
                    </div>
                  )}

                  {profile.achievements && profile.achievements.length > 0 && (
                    <div>
                      <h3 className="font-medium text-slate-300 text-sm mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Achievements
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.achievements.slice(0, 5).map((achievement, index) => (
                          <Badge key={index} variant="secondary" className="px-2 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs">
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                      {profile.achievements.length > 5 && (
                        <p className="text-xs text-slate-500 mt-2">+{profile.achievements.length - 5} more</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Staff-Specific Details */}
              {(userRole === "staff" || userRole === "admin") && (
                <>
                  {profile.position && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-300 text-sm flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Position
                      </h3>
                      <p className="text-white">{profile.position}</p>
                    </div>
                  )}

                  {profile.qualifications && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-slate-300 text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Qualifications
                      </h3>
                      <p className="text-white">{profile.qualifications}</p>
                    </div>
                  )}

                  {profile.research_interests && profile.research_interests.length > 0 && (
                    <div>
                      <h3 className="font-medium text-slate-300 text-sm mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Research Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.research_interests.slice(0, 5).map((interest, index) => (
                          <Badge key={index} variant="secondary" className="px-2 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                      {profile.research_interests.length > 5 && (
                        <p className="text-xs text-slate-500 mt-2">+{profile.research_interests.length - 5} more</p>
                      )}
                    </div>
                  )}
                </>
              )}

              <Separator className="bg-white/10" />

              <div>
                <h3 className="font-medium text-slate-300 text-sm mb-3 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-500 text-sm italic">No skills added yet.</span>
                  )}
                </div>
                {profile.skills && profile.skills.length > 6 && (
                  <p className="text-xs text-slate-500 mt-2">+{profile.skills.length - 6} more skills</p>
                )}

                {(userRole === "student" || userRole === "lead" || userRole === "deputy") && profile.portfolio_items && profile.portfolio_items.length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-300 text-sm mb-3 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Portfolio Items
                    </h3>
                    <div className="space-y-3">
                      {profile.portfolio_items.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-white text-sm">{item.title}</h4>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs"
                              >
                                View
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="border-white/10 text-slate-400 bg-white/10 text-xs">
                              {item.type}
                            </Badge>
                            {item.date && (
                              <Badge variant="outline" className="border-white/10 text-slate-400 bg-white/10 text-xs">
                                {item.date}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Projects */}
        <div className="lg:col-span-2">
          <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FolderOpen className="w-5 h-5" />
                  My Projects
                </CardTitle>
                
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex gap-2 mb-6 flex-wrap">
                <Button
                  variant={activeFilter === "all" ? "secondary" : "outline"}
                  size="sm"
                  className={`${activeFilter === "all" ? "bg-primary text-primary-foreground" : "border-white/20 text-white hover:bg-white/10"} px-3`}
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={activeFilter === "personal" ? "secondary" : "outline"}
                  size="sm"
                  className={`${activeFilter === "personal" ? "bg-primary text-primary-foreground" : "border-white/20 text-white hover:bg-white/10"} px-3`}
                  onClick={() => setActiveFilter("personal")}
                >
                  Personal
                </Button>
                <Button
                  variant={activeFilter === "cluster" ? "secondary" : "outline"}
                  size="sm"
                  className={`${activeFilter === "cluster" ? "bg-primary text-primary-foreground" : "border-white/20 text-white hover:bg-white/10"} px-3`}
                  onClick={() => setActiveFilter("cluster")}
                >
                  Cluster
                </Button>
              </div>
              
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="h-full border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-white mb-1">{project.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`border-white/10 ${project.visibility === 'public' ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-400/10'}`}>
                                  {project.visibility}
                                </Badge>
                                <Badge variant="outline" className="border-white/10 text-slate-400 bg-white/10">
                                  {project.type}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 text-indigo-400">
                              <Code2 className="w-5 h-5" />
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-4">
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {project.project_tags?.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-md flex items-center gap-1">
                                <Tags className="w-3 h-3" />
                                {tag.tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="flex justify-between pt-0">
                          <div className="flex gap-2">
                            {project.repository_url && (
                              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                <Github className="w-4 h-4 mr-2" />
                                Code
                              </Button>
                            )}
                            
                            {project.demo_url && (
                              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                <Globe className="w-4 h-4 mr-2" />
                                Demo
                              </Button>
                            )}
                          </div>
                          
                          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10">
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No Projects Found</h3>
                  <p className="text-slate-400 mb-6">
                    {searchTerm 
                      ? "No projects match your search. Try different keywords." 
                      : "You haven't created or joined any projects yet."}
                  </p>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}