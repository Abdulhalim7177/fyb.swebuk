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
  Award,
  Book,
  Clock,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

type Profile = {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  role?: string;
  registration_number?: string | null;
  staff_number?: string | null;
  academic_level?: string | null;
  department?: string | null;
  faculty?: string | null;
  institution?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  skills?: string[] | null;
  bio?: string | null;
  email?: string;
  created_at?: string;
  website_url?: string | null;
  // Student-specific fields
  specialization?: string | null;
  gpa?: number | null;
  academic_standing?: string | null;
  current_courses?: string[] | null;
  achievements?: string[] | null;
  portfolio_items?: any[] | null;
  interests?: string | null;
  // Staff-specific fields
  position?: string | null;
  office_location?: string | null;
  office_hours?: string | null;
  research_interests?: string[] | null;
  department_role?: string | null;
  staff_profile?: any | null;
  qualifications?: string | null;
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

export default function ModernProfileDisplay({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit?: () => void;
}) {
  const userRole: UserRole = (profile.role?.toLowerCase() as UserRole) || "student";
  const roleSettings = roleConfig[userRole] || roleConfig.student;
  const isStudent = userRole === "student";
  
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      {/* Profile Header */}
      <div className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${roleSettings.gradient.split(' ')[0]} ${roleSettings.gradient.split(' ')[1]}`}>
                  <span className="text-4xl font-bold text-white">{getInitials(profile.full_name || 'User')}</span>
                </div>
              )}
            </div>
            
            <div className={`absolute -bottom-2 -right-2 p-2 rounded-full bg-black/50 border border-white/10 backdrop-blur-md z-20`}>
              <roleSettings.icon className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {profile.full_name}
            </h1>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
              <Badge className={`${roleSettings.gradient} ${roleSettings.color} border`}>
                <roleSettings.icon className="w-4 h-4 mr-1" />
                {roleSettings.label}
              </Badge>
              
              {(isStudent || userRole === "lead" || userRole === "deputy") && profile.academic_level && (
                <Badge variant="outline" className="border-white/20 text-slate-300">
                  {formatAcademicLevel(profile.academic_level)}
                </Badge>
              )}
              
              {profile.registration_number && (
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {profile.registration_number}
                </Badge>
              )}
            </div>
            
            <p className="text-slate-300 mb-4 max-w-2xl">
              {profile.bio || "No bio provided. Add a short description to let others know about your interests and expertise."}
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {profile.linkedin_url && (
                <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
              )}
              
              {profile.github_url && (
                <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </a>
                </Button>
              )}
              
              {onEdit && (
                <Button onClick={onEdit} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 mb-2">
            <FolderOpen className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">12</span>
          <span className="text-sm text-slate-400">Projects</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 mb-2">
            <Code2 className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">{profile.skills?.length || 0}</span>
          <span className="text-sm text-slate-400">Skills</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 mb-2">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">8</span>
          <span className="text-sm text-slate-400">Collaborations</span>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex flex-col items-center text-center"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 mb-2">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-white">{joinDate}</span>
          <span className="text-sm text-slate-400">Member Since</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300">Academic Details</h3>
                    <p className="text-white">
                      {(isStudent || userRole === "lead" || userRole === "deputy") ? formatAcademicLevel(profile.academic_level) : "Professional"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300">Department</h3>
                    <p className="text-white">{profile.department || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-300">Institution</h3>
                    <p className="text-white">{profile.institution || "N/A"}</p>
                  </div>
                </div>

                {profile.email && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-300">Email</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-white truncate">{profile.email}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(profile.email!)}
                          className="h-8 w-8 flex-shrink-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {profile.registration_number && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-300">Registration Number</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-white">{profile.registration_number}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopy(profile.registration_number!)}
                          className="h-8 w-8 flex-shrink-0"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Code2 className="w-5 h-5" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge
                        variant="secondary"
                        className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-slate-200 hover:bg-white/20 transition-all cursor-pointer"
                      >
                        {skill}
                      </Badge>
                    </motion.div>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No skills added yet.</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student-Specific Details */}
          {(userRole === "student" || userRole === "lead" || userRole === "deputy") && (
            <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <GraduationCap className="w-5 h-5" />
                  Academic Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.specialization && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Specialization</h3>
                      <p className="text-white">{profile.specialization}</p>
                    </div>
                  </div>
                )}

                {profile.gpa && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">GPA</h3>
                      <p className="text-white">{profile.gpa.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {profile.academic_standing && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Academic Standing</h3>
                      <p className="text-white">{profile.academic_standing}</p>
                    </div>
                  </div>
                )}

                {profile.current_courses && profile.current_courses.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <Book className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Current Courses</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.current_courses.map((course, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                            {course}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {profile.achievements && profile.achievements.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Achievements</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.achievements.map((achievement, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                            {achievement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {profile.portfolio_items && profile.portfolio_items.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Portfolio</h3>
                      <div className="space-y-3 mt-2">
                        {profile.portfolio_items.map((item: any, index: number) => (
                          <div key={index} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-white">{item.title}</h4>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline text-sm"
                                >
                                  View
                                </a>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{item.description}</p>
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
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Staff-Specific Details */}
          {(userRole === "staff" || userRole === "admin") && (
            <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Briefcase className="w-5 h-5" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.position && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Position</h3>
                      <p className="text-white">{profile.position}</p>
                    </div>
                  </div>
                )}

                {profile.qualifications && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Qualifications</h3>
                      <p className="text-white">{profile.qualifications}</p>
                    </div>
                  </div>
                )}

                {profile.office_location && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Office Location</h3>
                      <p className="text-white">{profile.office_location}</p>
                    </div>
                  </div>
                )}

                {profile.office_hours && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Office Hours</h3>
                      <p className="text-white">{profile.office_hours}</p>
                    </div>
                  </div>
                )}

                {profile.department_role && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Department Role</h3>
                      <p className="text-white">{profile.department_role}</p>
                    </div>
                  </div>
                )}

                {profile.research_interests && profile.research_interests.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/10 text-slate-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-300">Research Interests</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.research_interests.map((interest, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageCircle className="w-5 h-5" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.linkedin_url && (
                  <Button asChild variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                
                {profile.github_url && (
                  <Button asChild variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                )}
                
                {profile.email && (
                  <Button asChild variant="outline" className="w-full justify-start border-white/20 text-white hover:bg-white/10">
                    <a href={`mailto:${profile.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="border-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Settings className="w-5 h-5" />
                Profile Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <Download className="w-4 h-4 mr-2" />
                Download Resume
              </Button>
              
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
              
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                <Heart className="w-4 h-4 mr-2" />
                Follow
              </Button>
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Added new project</p>
                    <p className="text-white text-sm">Portfolio Website Redesign</p>
                    <p className="text-slate-500 text-xs">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-violet-500/10 text-violet-500">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Updated skills</p>
                    <p className="text-white text-sm">Added React, TypeScript, Next.js</p>
                    <p className="text-slate-500 text-xs">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}