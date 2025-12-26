import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Plus,
  FolderOpen,
  User,
  Briefcase,
  Code2,
  Globe,
  Calendar,
  Star,
  TrendingUp,
  ShieldCheck,
  Layers,
  Github,
  Linkedin,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

export default async function PortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return <div>User profile not found.</div>;
  }

  // Fetch user projects - both personal projects they created and projects they're members of
  // First, get projects where user is owner
  const { data: ownedProjects, error: ownedProjectsError } = await supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      type,
      visibility,
      status,
      created_at,
      updated_at,
      owner_id,
      cluster_id,
      repository_url,
      demo_url,
      project_tags (tag)
    `)
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  // Then, get projects where user is a member
  // First, get the project IDs from project_members
  const { data: memberProjectIds, error: memberProjectsError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("status", "approved");

  // Then fetch the actual project details
  const projectIds = memberProjectIds?.map((mp: any) => mp.project_id) || [];
  let memberProjects: any[] = [];

  if (projectIds.length > 0) {
    const { data: projectsData } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        type,
        visibility,
        status,
        created_at,
        updated_at,
        owner_id,
        cluster_id,
        repository_url,
        demo_url,
        project_tags (tag)
      `)
      .in("id", projectIds)
      .order("updated_at", { ascending: false });
    memberProjects = projectsData || [];
  }

  // Combine both arrays and remove duplicates
  let allProjects = [];
  if (ownedProjects) allProjects = [...ownedProjects];
  if (memberProjects) {
    // Filter out projects that are already in ownedProjects to avoid duplicates
    const uniqueMemberProjects = memberProjects.filter(memberProj =>
      !ownedProjects?.some(ownedProj => ownedProj.id === memberProj.id)
    );
    allProjects = [...allProjects, ...uniqueMemberProjects];
  }

  // Handle errors - memberProjectsError is acceptable (user just might not be a member)
  if (ownedProjectsError) {
    console.error('Error fetching owned projects:', ownedProjectsError);
  }

  // Format academic level for display
  const formatAcademicLevel = (level: string | undefined) => {
    if (!level) return "Professional";
    switch(level) {
      case 'level_100': return 'Level 100';
      case 'level_200': return 'Level 200';
      case 'level_300': return 'Level 300';
      case 'level_400': return 'Level 400';
      case 'alumni': return 'Alumni';
      default: return level.charAt(0).toUpperCase() + level.slice(1);
    }
  };

  const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
    student: { label: "Student", color: "from-violet-500 to-purple-500", icon: GraduationCap },
    staff: { label: "Staff", color: "from-blue-500 to-cyan-500", icon: Briefcase },
    admin: { label: "Administrator", color: "from-emerald-500 to-teal-500", icon: ShieldCheck },
    lead: { label: "Cluster Lead", color: "from-amber-500 to-orange-500", icon: Star },
    deputy: { label: "Cluster Deputy", color: "from-pink-500 to-rose-500", icon: TrendingUp },
  };

  const userRole = profileData.role?.toLowerCase() || "student";
  const roleSettings = roleConfig[userRole] || roleConfig.student;
  const isStudent = userRole === "student";

  // Count stats
  const projectCount = allProjects.length || 0;
  const skillCount = profileData.skills?.length || 0;
  const hasSocialLinks = !!(profileData.linkedin_url && profileData.github_url);

  return (
    <div className="flex-1 w-full flex flex-col items-center min-h-screen bg-gradient-to-br from-background via-slate-50/20 to-background dark:via-slate-900/20">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-gradient-to-r ${roleSettings.color} rounded-2xl shadow-lg`}>
                <Code2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Portfolio</h1>
                <p className="text-white/70 text-sm mt-1">
                  Showcase your work, skills, and achievements
                </p>
              </div>
            </div>
            <Button asChild variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
              <Link href={`/dashboard/${userRole}/profile`}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 border border-violet-200/50 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-violet-500 rounded-xl">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-violet-100 text-violet-700">
                  Total
                </Badge>
              </div>
              <p className="text-4xl font-bold text-foreground">{projectCount}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-200/50 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-blue-500 rounded-xl">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-700">
                  Expertise
                </Badge>
              </div>
              <p className="text-4xl font-bold text-foreground">{skillCount}</p>
              <p className="text-sm text-muted-foreground">Skills</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-200/50 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-emerald-500 rounded-xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700">
                  Member
                </Badge>
              </div>
              <p className="text-4xl font-bold text-foreground">Since 2024</p>
              <p className="text-sm text-muted-foreground">Joined</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200/50 hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-amber-500 rounded-xl">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-700">
                  {hasSocialLinks ? "Add Links" : "Connected"}
                </Badge>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {profileData.linkedin_url || profileData.github_url ? "2" : "0"}
              </p>
              <p className="text-sm text-muted-foreground">Social Links</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <section className="w-full mb-8">
          <Card className="border-2 shadow-2xl overflow-hidden hover:shadow-3xl transition-shadow duration-300">
            <div className={`h-2 bg-gradient-to-r ${roleSettings.color}`} />
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                    <User className="w-14 h-14 text-slate-400 dark:text-slate-600" />
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {profileData.full_name || user.email}
                    </h2>
                    <div className="flex items-center gap-2.5 mt-2">
                      <Badge className={`gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${roleSettings.color} text-white font-medium shadow-md border-0`}>
                        <roleSettings.icon className="w-4 h-4" />
                        {roleSettings.label}
                      </Badge>
                      {isStudent && profileData.academic_level && profileData.academic_level !== "student" && (
                        <Badge variant="outline" className="px-3 py-1 rounded-full">
                          {formatAcademicLevel(profileData.academic_level)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {profileData.bio || (
                      <span className="text-muted-foreground/60 italic">
                        No bio provided yet. Tell the community about yourself!
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.linkedin_url && (
                      <Link
                        href={profileData.linkedin_url}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                      >
                        <Linkedin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium">LinkedIn</span>
                        <ExternalLink className="w-3 h-3 text-blue-600/60 dark:text-blue-400/60" />
                      </Link>
                    )}
                    {profileData.github_url && (
                      <Link
                        href={profileData.github_url}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-xl transition-colors"
                      >
                        <Github className="w-4 h-4 text-foreground" />
                        <span className="text-sm font-medium">GitHub</span>
                        <ExternalLink className="w-3 h-3 text-muted-foreground/60" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Student-specific fields */}
              {isStudent && profileData.registration_number && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">REGISTRATION NUMBER</p>
                  <p className="text-lg font-semibold text-foreground tracking-wider">
                    {profileData.registration_number}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Skills Section */}
        <section className="w-full mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 rounded-xl">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Skills & Expertise</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/${userRole}/profile`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Skills
              </Link>
            </Button>
          </div>

          {profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0 ? (
            <Card className="shadow-lg border-muted/50">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill: string, index: number) => (
                    <Badge
                      key={index}
                      className="gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-800 dark:text-violet-200 hover:from-violet-200 dark:hover:from-violet-800/60 transition-colors border border-violet-200/50"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-muted/40">
              <CardContent className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                  <Layers className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Skills Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add your technical skills to showcase your expertise to the community
                </p>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/dashboard/${userRole}/profile`}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Skill
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Projects Section */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl">
                <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Portfolio Projects</h2>
            </div>
            <Button asChild className={`shadow-lg`}>
              <Link href="/dashboard/projects?tab=personal">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Link>
            </Button>
          </div>

          {allProjects && allProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {allProjects.map((project: any) => (
                <Card key={project.id} className="group h-full border-2 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {project.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          project.visibility === 'public'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {project.visibility || 'private'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">
                      {project.description?.substring(0, 120)}
                      {project.description?.length > 120 && "..."}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.project_tags && project.project_tags.length > 0 ? (
                        project.project_tags.map((tagObj: any, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-2.5 py-1 text-xs rounded-lg"
                          >
                            {tagObj.tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/60">No tags</span>
                      )}
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/projects/${project.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {project.repository_url && (
                        <Button size="sm" variant="ghost" asChild className="h-9">
                          <Link href={project.repository_url} target="_blank" rel="noopener noreferrer">
                            <Github className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      )}
                      {project.demo_url && (
                        <Button size="sm" variant="ghost" asChild className="h-9">
                          <Link href={project.demo_url} target="_blank" rel="noopener noreferrer">
                            <Globe className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-muted/40">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/30 mb-5">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">No Projects Yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Start showcasing your work by creating your first project or joining existing ones
                </p>
                <Button asChild size="lg" className={`shadow-lg bg-gradient-to-r ${roleSettings.color}`}>
                  <Link href="/dashboard/projects?tab=personal">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
