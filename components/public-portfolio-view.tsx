"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Mail,
  Linkedin,
  Github,
  Code2,
  ExternalLink,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Globe,
  Calendar,
  User,
  FolderOpen,
  Users,
  Tags,
  ArrowUpRight,
} from "lucide-react";
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

const roleConfig: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  student: {
    label: "Student",
    icon: GraduationCap,
    color: "text-violet-500",
  },
  staff: {
    label: "Staff",
    icon: Briefcase,
    color: "text-blue-500",
  },
  admin: {
    label: "Administrator",
    icon: ShieldCheck,
    color: "text-emerald-500",
  },
  lead: {
    label: "Cluster Lead",
    icon: Sparkles,
    color: "text-amber-500",
  },
  deputy: {
    label: "Cluster Deputy",
    icon: Sparkles,
    color: "text-pink-500",
  },
};

const academicLevelOptions: Record<string, string> = {
  student: "New Student",
  level_100: "Level 100 (Freshman)",
  level_200: "Level 200 (Sophomore)",
  level_300: "Level 300 (Junior)",
  level_400: "Level 400 (Senior)",
  alumni: "Alumni",
};

export default function PublicPortfolioView({
  profile,
  projects,
  isOwnProfile,
  currentUserId,
}: {
  profile: Profile;
  projects: Project[];
  isOwnProfile: boolean;
  currentUserId?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "skills">(
    "overview"
  );

  const userRole = (profile.role?.toLowerCase() as keyof typeof roleConfig) || "student";
  const roleSettings = roleConfig[userRole] || roleConfig.student;
  const isStudent = userRole === "student";

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

  const joinDate = profile.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black text-white">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col max-w-[1280px] flex-1">
            {/* Header with Navigation */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-white/10 px-10 py-3">
              <div className="flex items-center gap-4 text-white cursor-pointer" onClick={() => router.push("/")}>
                <div className="size-8">
                  <svg
                    fill="none"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  Swebuk
                </h2>
              </div>
              <div className="flex gap-2">
                {currentUserId ? (
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </header>

            <main className="flex-1 px-10 py-5">
              {/* Profile Header */}
              <div className="flex p-4">
                <div className="flex w-full flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                  <div className="flex gap-4">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32"
                      style={{
                        backgroundImage: profile.avatar_url
                          ? `url(${profile.avatar_url})`
                          : "none",
                        backgroundColor: !profile.avatar_url
                          ? "#1a1a1a"
                          : undefined,
                      }}
                    >
                      {!profile.avatar_url && (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold">
                          {getInitials(profile.full_name || "User")}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                          {profile.full_name}
                        </p>
                        <Badge className="bg-white/10 text-white border-white/20">
                          <roleSettings.icon className="w-3 h-3 mr-1" />
                          {roleSettings.label}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-base font-normal leading-normal">
                        {isStudent
                          ? formatAcademicLevel(profile.academic_level)
                          : "Professional"}
                        {profile.department && ` - ${profile.department}`}
                      </p>
                      <p className="text-slate-400 text-base font-normal leading-normal">
                        {profile.institution || ""}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {profile.email && (
                          <a href={`mailto:${profile.email}`} className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-lg transition-colors border border-white/10">
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                        {profile.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-[#0077b5]/20 hover:text-[#0077b5] rounded-lg transition-colors border border-white/10">
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {profile.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-lg transition-colors border border-white/10">
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {profile.website_url && (
                          <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/20 hover:text-white rounded-lg transition-colors border border-white/10">
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <Button
                      onClick={() =>
                        router.push(
                          `/dashboard/${profile.role?.toLowerCase() || "student"}/profile`
                        )
                      }
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 w-full max-w-[480px] sm:w-auto"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="pb-3">
                <div className="flex border-b border-white/10 px-4 gap-8">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex flex-col items-center justify-center border-b-[3px] ${
                      activeTab === "overview"
                        ? "border-b-primary text-white"
                        : "border-b-transparent text-slate-400"
                    } pb-[13px] pt-4`}
                  >
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                      Overview
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("projects")}
                    className={`flex flex-col items-center justify-center border-b-[3px] ${
                      activeTab === "projects"
                        ? "border-b-primary text-white"
                        : "border-b-transparent text-slate-400"
                    } pb-[13px] pt-4`}
                  >
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                      Projects
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("skills")}
                    className={`flex flex-col items-center justify-center border-b-[3px] ${
                      activeTab === "skills"
                        ? "border-b-primary text-white"
                        : "border-b-transparent text-slate-400"
                    } pb-[13px] pt-4`}
                  >
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                      Skills
                    </p>
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
                {/* Left Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-8">
                  {/* About Me */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h2 className="text-white text-lg font-bold pb-3 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      About Me
                    </h2>
                    <p className="text-white text-base font-normal leading-normal">
                      {profile.bio ||
                        "No bio provided yet. This user hasn't added a description about themselves."}
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <h2 className="text-white text-lg font-bold pb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Contact Information
                    </h2>
                    <div className="flex flex-col gap-4 text-white">
                      {profile.email && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-300 text-sm">Email</h3>
                            <a
                              href={`mailto:${profile.email}`}
                              className="text-primary hover:underline text-sm break-all"
                            >
                              {profile.email}
                            </a>
                          </div>
                        </div>
                      )}
                      {profile.linkedin_url && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                            <Linkedin className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-300 text-sm">LinkedIn</h3>
                            <a
                              className="text-primary hover:underline text-sm"
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Profile
                            </a>
                          </div>
                        </div>
                      )}
                      {profile.github_url && (
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/10 text-slate-300 flex-shrink-0">
                            <Github className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-300 text-sm">GitHub</h3>
                            <a
                              className="text-primary hover:underline text-sm"
                              href={profile.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Profile
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
                              className="text-primary hover:underline text-sm break-all"
                              href={profile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {profile.website_url.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills */}
                  {activeTab !== "projects" && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                      <h2 className="text-white text-lg font-bold pb-4 flex items-center gap-2">
                        <Code2 className="w-5 h-5" />
                        Skills
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills && profile.skills.length > 0 ? (
                          profile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-white/10 text-white text-sm font-medium px-3 py-1 rounded-full border border-white/20"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm italic">
                            No skills added yet.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Content Area - Portfolio/Projects */}
                <div className="lg:col-span-2">
                  <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3 pt-1 flex items-center gap-2">
                    <FolderOpen className="w-6 h-6" />
                    My Projects
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <div
                          key={project.id}
                          className="bg-white/5 border border-white/10 rounded-lg overflow-hidden group hover:bg-white/10 transition-colors"
                        >
                          <div className="h-40 bg-white/5 flex items-center justify-center">
                            <Code2 className="w-16 h-16 text-slate-400" />
                          </div>
                          <div className="p-6">
                            <h3 className="text-white text-lg font-bold">
                              {project.name}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1 mb-3 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.project_tags?.slice(0, 3).map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-md flex items-center gap-1"
                                >
                                  <Tags className="w-3 h-3" />
                                  {tag.tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex gap-2">
                                {project.repository_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                    onClick={() => window.open(project.repository_url, "_blank")}
                                  >
                                    <Github className="w-4 h-4 mr-2" />
                                    Code
                                  </Button>
                                )}
                                {project.demo_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                    onClick={() => window.open(project.demo_url, "_blank")}
                                  >
                                    <Globe className="w-4 h-4 mr-2" />
                                    Demo
                                  </Button>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-slate-400 hover:text-white hover:bg-white/10"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden group md:col-span-2">
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <FolderOpen className="w-8 h-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">
                            No Public Projects Yet
                          </h3>
                          <p className="text-slate-400 text-sm">
                            This user hasn't added any public projects to showcase yet.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
