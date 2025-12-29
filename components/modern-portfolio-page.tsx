"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  Check,
  Share,
  BookOpen,
  Plus,
  ArrowUpRight,
  Search,
  Tags,
  Globe,
  Award,
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
  specialization?: string;
  gpa?: number;
  academic_standing?: string;
  current_courses?: string[];
  achievements?: string[];
  portfolio_items?: any[];
  interests?: string;
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

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

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
      className="w-full"
    >
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Portfolio Overview
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, <span className="text-foreground font-medium">{profile.full_name?.split(' ')[0]}</span>
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary whitespace-nowrap"
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
              className="border-border text-foreground hover:bg-secondary whitespace-nowrap"
              onClick={handleViewPublicProfile}
            >
              <User className="w-4 h-4 mr-2" />
              View Public
            </Button>

            {onEditProfile && (
              <Button onClick={onEditProfile} className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-sm p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 mb-2">
            <FolderOpen className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-foreground">{projectCount}</span>
          <span className="text-sm text-muted-foreground">Projects</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-sm p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 mb-2">
            <Code2 className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-foreground">{skillCount}</span>
          <span className="text-sm text-muted-foreground">Skills</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-sm p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 mb-2">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-foreground">8</span>
          <span className="text-sm text-muted-foreground">Collaborations</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-sm p-5 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 mb-2">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-foreground">{memberSince}</span>
          <span className="text-sm text-muted-foreground">Member Since</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="md:border md:border-border md:bg-card/50 md:backdrop-blur-md border border-border/40 bg-transparent shadow-none overflow-hidden h-full sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <User className="w-5 h-5" />
                Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-background shadow-xl">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${roleSettings.gradient.split(' ')[0]} ${roleSettings.gradient.split(' ')[1]}`}>
                        <span className="text-2xl font-bold text-foreground">{getInitials(profile.full_name || 'User')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-background border border-border z-20`}>
                    <roleSettings.icon className="w-4 h-4 text-foreground" />
                  </div>
                </div>

                <h2 className="text-xl font-bold text-foreground mb-1">
                  {profile.full_name}
                </h2>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge className={`${roleSettings.gradient} ${roleSettings.color} border bg-transparent`}>
                    <roleSettings.icon className="w-3 h-3 mr-1" />
                    {roleSettings.label}
                  </Badge>
                  
                  {(isStudent || userRole === "lead" || userRole === "deputy") && profile.academic_level && (
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {formatAcademicLevel(profile.academic_level)}
                    </Badge>
                  )}
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {profile.bio || "No bio provided."}
                </p>

                <div className="flex gap-2">
                  {profile.email && (
                    <a href={`mailto:${profile.email}`} className="p-2 bg-secondary/50 hover:bg-secondary hover:text-foreground rounded-xl transition-colors border border-border">
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-secondary/50 hover:bg-secondary hover:text-foreground rounded-xl transition-colors border border-border">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-secondary/50 hover:bg-secondary hover:text-foreground rounded-xl transition-colors border border-border">
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {profile.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-secondary/50 hover:bg-secondary hover:text-foreground rounded-xl transition-colors border border-border">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/30 text-muted-foreground flex-shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-muted-foreground text-sm">Academic Level</h3>
                    <p className="text-foreground">
                      {(isStudent || userRole === "lead" || userRole === "deputy") ? formatAcademicLevel(profile.academic_level) : "Professional"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/30 text-muted-foreground flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-muted-foreground text-sm">Department</h3>
                    <p className="text-foreground">{profile.department || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/30 text-muted-foreground flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-muted-foreground text-sm">Institution</h3>
                    <p className="text-foreground">{profile.institution || "N/A"}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Student-Specific Details */}
              {(userRole === "student" || userRole === "lead" || userRole === "deputy") && (
                <>
                  {profile.specialization && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-muted-foreground text-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Specialization
                      </h3>
                      <p className="text-foreground">{profile.specialization}</p>
                    </div>
                  )}

                  {profile.achievements && profile.achievements.length > 0 && (
                    <div>
                      <h3 className="font-medium text-muted-foreground text-sm mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Achievements
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.achievements.slice(0, 5).map((achievement, index) => (
                          <Badge key={index} variant="secondary" className="px-2 py-1 rounded-full bg-secondary/30 border border-border text-foreground text-xs">
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <Separator className="bg-border" />

              <div>
                <h3 className="font-medium text-muted-foreground text-sm mb-3 flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills && profile.skills.length > 0 ? (
                    profile.skills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1 rounded-full bg-secondary/30 border border-border text-foreground">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No skills added yet.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Projects */}
        <div className="lg:col-span-2">
          <Card className="md:border md:border-border md:bg-card/50 md:backdrop-blur-md border border-border/40 bg-transparent shadow-none overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FolderOpen className="w-5 h-5" />
                  My Projects
                </CardTitle>
                
                <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      className="w-full pl-10 pr-4 py-2 bg-background/50 border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className={`${activeFilter === "all" ? "bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"} px-3`}
                  onClick={() => setActiveFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={activeFilter === "personal" ? "secondary" : "outline"}
                  size="sm"
                  className={`${activeFilter === "personal" ? "bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"} px-3`}
                  onClick={() => setActiveFilter("personal")}
                >
                  Personal
                </Button>
                <Button
                  variant={activeFilter === "cluster" ? "secondary" : "outline"}
                  size="sm"
                  className={`${activeFilter === "cluster" ? "bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-secondary"} px-3`}
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
                      <Card className="h-full border border-border bg-card hover:shadow-md hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-foreground mb-1 truncate">{project.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`border-border ${project.visibility === 'public' ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground bg-secondary'}`}>
                                  {project.visibility}
                                </Badge>
                                <Badge variant="outline" className="border-border text-muted-foreground bg-secondary">
                                  {project.type}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Code2 className="w-5 h-5" />
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pb-4">
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 h-10">
                            {project.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            {project.project_tags?.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md flex items-center gap-1">
                                <Tags className="w-3 h-3" />
                                {tag.tag}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="flex justify-between pt-2 border-t border-border/50">
                          <div className="flex gap-2">
                            {project.repository_url && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                <Github className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {project.demo_url && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                <Globe className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto hover:bg-transparent">
                            View Details <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Projects Found</h3>
                  <p className="text-muted-foreground mb-6">
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
