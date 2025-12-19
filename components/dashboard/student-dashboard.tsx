import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users2, Code2, CalendarCheck, GitCommit, Palette, Brain, Server, CloudCog, Users, GraduationCap } from "lucide-react";
import Link from "next/link";

interface StudentDashboardProps {
  user: any;
  fullName?: string;
  academicLevel?: string;
  stats: {
    myClubs: number;
    activeProjects: number;
    upcomingEvents: number;
    contributions: number;
  };
  recentProjects: Array<{
    id: string;
    title: string;
    description: string;
    tags: string[];
    type: string;
    cluster_name: string | null;
  }>;
  popularClusters: Array<{
    id: string;
    name: string;
    description: string;
    members_count: number;
    lead_name: string | null;
    staff_manager_name: string | null;
  }>;
  featuredProjects: Array<any>;
  memberProjects: Array<any>;
}

export function StudentDashboard({ user, fullName, academicLevel, stats, recentProjects, popularClusters, featuredProjects, memberProjects }: StudentDashboardProps) {
  const statsDisplay = [
    { title: "My Clubs", value: stats.myClubs.toString(), icon: Users2, iconBg: "bg-primary/10 text-primary" },
    { title: "Active Projects", value: stats.activeProjects.toString(), icon: Code2, iconBg: "bg-green-500/10 text-green-500" },
    { title: "Upcoming Events", value: stats.upcomingEvents.toString(), icon: CalendarCheck, iconBg: "bg-purple-500/10 text-purple-500" },
    { title: "Contributions", value: stats.contributions.toString(), icon: GitCommit, iconBg: "bg-orange-500/10 text-orange-500" },
  ];

  // Icon mapping for cluster display
  const clusterIcons = [Palette, Brain, Server, CloudCog];
  const colorSchemes = [
    { iconBg: "bg-primary/10 text-primary", tagBg: "bg-primary/10 text-primary" },
    { iconBg: "bg-green-500/10 text-green-500", tagBg: "bg-green-500/10 text-green-500" },
    { iconBg: "bg-purple-500/10 text-purple-500", tagBg: "bg-purple-500/10 text-purple-500" },
    { iconBg: "bg-orange-500/10 text-orange-500", tagBg: "bg-orange-500/10 text-orange-500" },
  ];
  
  const events = [
      { day: "TOM", date: "25", title: "React Workshop", club: "Frontend Club", time: "Tomorrow, 2:00 PM" },
      { day: "FRI", date: "27", title: "ML Model Deployment", club: "AI/ML Club", time: "Friday, 5:00 PM" },
      { day: "MON", date: "30", title: "API Design Patterns", club: "Backend Club", time: "Next Monday, 3:00 PM" },
  ];

  const isFypEligible = academicLevel === "level_400" || academicLevel === "400";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Welcome back, {fullName || user.email}!</h1>
            <p className="text-sm text-primary-foreground/80">Here's what's happening in your development community today.</p>
          </div>
          <Button variant="secondary" asChild className="self-start md:self-auto">
            <Link href="/dashboard/student/profile">View Profile</Link>
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-semibold">{stat.value}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
        {/* Left Column (Clubs & Projects) */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-none">
          {/* Popular Development Clubs */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Popular Development Clubs</h2>
              <Link href="/dashboard/clusters" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {popularClusters.length > 0 ? (
                popularClusters.map((cluster, index) => {
                  const Icon = clusterIcons[index % clusterIcons.length];
                  const colors = colorSchemes[index % colorSchemes.length];
                  return (
                    <Card key={cluster.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colors.iconBg}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{cluster.name}</h3>
                            <p className="text-sm text-muted-foreground">{cluster.members_count} members</p>
                            <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{cluster.description || "No description available"}</p>
                            <div className="mt-4 flex items-center justify-between gap-2">
                              {cluster.lead_name && (
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium truncate ${colors.tagBg}`}>
                                  Lead: {cluster.lead_name}
                                </span>
                              )}
                              <Button variant="outline" size="sm" asChild className="border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500 shrink-0">
                                <Link href={`/dashboard/clusters/${cluster.id}`}>View</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No clusters available yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Projects */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Link href="/dashboard/projects" className="text-sm font-medium text-primary hover:underline">Browse All Projects</Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {recentProjects.length > 0 ? (
                recentProjects.map((project, index) => (
                  <Card key={project.id} className={index === 2 ? "md:col-span-2" : ""}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <Badge variant={project.type === "cluster" ? "default" : "secondary"} className="shrink-0">
                          {project.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      {project.cluster_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cluster: {project.cluster_name}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center flex-wrap gap-2">
                          {project.tags.map((tag, i) => (
                            <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{tag}</span>
                          ))}
                          {project.tags.length === 0 && (
                            <span className="text-xs text-muted-foreground">No tags</span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild className="border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-500">
                          <Link href={`/dashboard/projects/${project.id}`}>View Project</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Code2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                  <Link href="/dashboard/projects">
                    <Button variant="outline" size="sm" className="mt-4">
                      Browse Projects
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Featured Projects */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Featured Projects</h2>
              <Link href="/dashboard/projects" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {featuredProjects.length > 0 ? (
                featuredProjects.slice(0, 4).map((project, index) => (
                  <Card key={project.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <Badge variant={project.type === "cluster" ? "default" : "secondary"} className="shrink-0">
                          {project.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      {project.cluster_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cluster: {project.cluster_name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{project.members_count} members</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center flex-wrap gap-2">
                          {project.tags?.slice(0, 2).map((tag: string, i: number) => (
                            <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{tag}</span>
                          ))}
                          {project.tags?.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{project.tags.length - 2} more</span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild className="border-indigo-500 text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-500">
                          <Link href={`/dashboard/projects/${project.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Code2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No featured projects yet</p>
                </div>
              )}
            </div>
          </section>

          {/* My Contributions */}
          {memberProjects.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Contributions</h2>
                <Link href="/dashboard/projects?tab=my" className="text-sm font-medium text-primary hover:underline">View All</Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                {memberProjects.slice(0, 4).map((project) => (
                  <Card key={project.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <Badge variant={project.type === "cluster" ? "default" : "secondary"} className="shrink-0">
                          {project.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      {project.cluster_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cluster: {project.cluster_name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Owner: {project.owner_name}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center flex-wrap gap-2">
                          {project.tags?.slice(0, 2).map((tag: string, i: number) => (
                            <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{tag}</span>
                          ))}
                          {project.tags?.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{project.tags.length - 2} more</span>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild className="border-purple-500 text-purple-500 hover:bg-purple-500/10 hover:text-purple-500">
                          <Link href={`/dashboard/projects/${project.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Upcoming Events) */}
        <aside className="lg:col-span-1 order-1 lg:order-none">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {events.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-xs font-medium">{event.day}</span>
                    <span className="text-lg font-bold">{event.date}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.club}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* CTA Banner */}
      <div className="mt-8 rounded-xl bg-primary p-6 text-primary-foreground md:p-8">
        <h2 className="text-2xl font-semibold">Ready to start building?</h2>
        <p className="mt-1 text-primary-foreground/80">Join a club, start a project, or contribute to existing repositories.</p>
        <div className="mt-4 flex gap-4 flex-wrap">
          <Button variant="secondary" asChild>
            <Link href="/dashboard/projects">Start a Project</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/clusters">Browse Clubs</Link>
          </Button>
          {isFypEligible && (
            <Button variant="outline" asChild className="bg-white/10 hover:bg-white/20 border-white/20 text-white">
              <Link href="/dashboard/student/fyp">
                <GraduationCap className="w-4 h-4 mr-2" />
                Final Year Project
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}