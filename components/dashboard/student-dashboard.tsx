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
  upcomingEvents: Array<{
    id: string;
    title: string;
    start_date: string;
    cluster_name: string | null;
  }>;
}

export function StudentDashboard({ user, fullName, academicLevel, stats, recentProjects, popularClusters, featuredProjects, memberProjects, upcomingEvents }: StudentDashboardProps) {
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
  
  // Format events for display
  const formattedEvents = upcomingEvents.map(event => {
    const eventDate = new Date(event.start_date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayLabel = eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    let dateLabel = eventDate.getDate().toString();

    if (eventDate.toDateString() === today.toDateString()) {
      dayLabel = "TODAY";
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      dayLabel = "TOM";
    }

    const timeLabel = eventDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      id: event.id,
      day: dayLabel,
      date: dateLabel,
      title: event.title,
      club: event.cluster_name || "General Event",
      time: `${eventDate.toLocaleDateString('en-US', { weekday: 'long' })}, ${timeLabel}`
    };
  });

  const isFypEligible = academicLevel === "level_400" || academicLevel === "400";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-border backdrop-blur-xl p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="relative flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {fullName || user.email}!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Here's what's happening in your development community today.</p>
          </div>
          <Link href="/dashboard/student/profile">
            <button className="self-start md:self-auto px-6 py-2.5 rounded-xl bg-background/50 hover:bg-background/80 border border-border text-foreground font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/10">
              View Profile
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsDisplay.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300 hover:scale-105"
            >
              <div className={`p-3 rounded-xl ${stat.iconBg} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
        {/* Left Column (Clubs & Projects) */}
        <div className="lg:col-span-2 space-y-8 order-2 lg:order-none">
          {/* Popular Development Clubs */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Popular Development Clubs</h2>
              <Link href="/dashboard/clusters" className="text-sm font-medium text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200">
                View All →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {popularClusters.length > 0 ? (
                popularClusters.map((cluster, index) => {
                  const Icon = clusterIcons[index % clusterIcons.length];
                  const colors = colorSchemes[index % colorSchemes.length];
                  return (
                    <div key={cluster.id} className="group relative overflow-hidden rounded-2xl bg-card border border-border text-card-foreground shadow-sm p-6 hover:shadow-md hover:border-primary/50 transition-all duration-300 hover:scale-105">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${colors.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">{cluster.name}</h3>
                          <p className="text-sm text-muted-foreground">{cluster.members_count} members</p>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{cluster.description || "No description available"}</p>
                          <div className="mt-4 flex items-center justify-between gap-2">
                            {cluster.lead_name && (
                              <span className="rounded-full px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 truncate">
                                Lead: {cluster.lead_name}
                              </span>
                            )}
                            <Link href={`/dashboard/clusters/${cluster.id}`}>
                              <button className="px-4 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-sm font-medium transition-all duration-200 hover:scale-105 shrink-0">
                                View
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-12 rounded-2xl bg-card border border-border text-card-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No clusters available yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Projects */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Recent Projects</h2>
              <Link href="/dashboard/projects" className="text-sm font-medium text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200">
                Browse All Projects →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {recentProjects.length > 0 ? (
                recentProjects.map((project, index) => (
                  <div key={project.id} className={`group relative overflow-hidden rounded-2xl bg-card border border-border text-card-foreground shadow-sm p-6 hover:shadow-md hover:border-primary/50 transition-all duration-300 hover:scale-105 ${index === 2 ? "md:col-span-2" : ""}`}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">{project.title}</h3>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${project.type === "cluster" ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20" : "bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20"}`}>
                        {project.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    {project.cluster_name && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Cluster: {project.cluster_name}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {project.tags.map((tag, i) => (
                          <span key={i} className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">{tag}</span>
                        ))}
                        {project.tags.length === 0 && (
                          <span className="text-xs text-muted-foreground">No tags</span>
                        )}
                      </div>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <button className="px-4 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-sm font-medium transition-all duration-200 hover:scale-105">
                          View Project
                        </button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 rounded-2xl bg-card border border-border text-card-foreground">
                  <Code2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Link href="/dashboard/projects">
                    <button className="px-6 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-medium transition-all duration-200 hover:scale-105">
                      Browse Projects
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Featured Projects */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Featured Projects</h2>
              <Link href="/dashboard/projects" className="text-sm font-medium text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200">
                View All →
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              {featuredProjects.length > 0 ? (
                featuredProjects.slice(0, 2).map((project, index) => (
                  <div key={project.id} className="group relative overflow-hidden rounded-2xl bg-card border border-border text-card-foreground shadow-sm p-6 hover:shadow-md hover:border-primary/50 transition-all duration-300 hover:scale-105">
                    <div className="p-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">{project.name}</h3>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${project.type === "cluster" ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20" : "bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20"}`}>
                          {project.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      {project.cluster_name && (
                        <p className="mt-2 text-xs text-muted-foreground">
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
                            <span key={i} className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">{tag}</span>
                          ))}
                          {project.tags?.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{project.tags.length - 2} more</span>
                          )}
                        </div>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <button className="px-4 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-sm font-medium transition-all duration-200 hover:scale-105">
                            View
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 rounded-2xl bg-card border border-border text-card-foreground">
                  <Code2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No featured projects yet</p>
                </div>
              )}
            </div>
          </section>

          {/* My Contributions */}
          {memberProjects.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">My Contributions</h2>
                <Link href="/dashboard/projects?tab=my" className="text-sm font-medium text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200">
                  View All →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                {memberProjects.slice(0, 4).map((project) => (
                  <div key={project.id} className="group relative overflow-hidden rounded-2xl bg-card border border-border text-card-foreground shadow-sm p-6 hover:shadow-md hover:border-primary/50 transition-all duration-300 hover:scale-105">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">{project.name}</h3>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${project.type === "cluster" ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20" : "bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20"}`}>
                        {project.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    {project.cluster_name && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Cluster: {project.cluster_name}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Owner: {project.owner_name}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        {project.tags?.slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">{tag}</span>
                        ))}
                        {project.tags?.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{project.tags.length - 2} more</span>
                        )}
                      </div>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        <button className="px-4 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-sm font-medium transition-all duration-200 hover:scale-105">
                          View
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Upcoming Events) */}
        <aside className="lg:col-span-1 order-1 lg:order-none">
          <div className="sticky top-8 rounded-2xl bg-card border border-border text-card-foreground shadow-sm p-6">
            <h3 className="text-xl font-bold text-foreground mb-6">Upcoming Events</h3>
            <div className="space-y-5">
              {formattedEvents.length > 0 ? (
                formattedEvents.map((event, index) => (
                  <div key={event.id || index} className="flex gap-4 group">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">{event.day}</span>
                      <span className="text-lg font-bold text-foreground">{event.date}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.club}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No upcoming events</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* CTA Banner */}
      <div className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-blue-500/20 border border-border backdrop-blur-xl p-8 md:p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-foreground">
            Ready to start building?
          </h2>
          <p className="mt-2 text-muted-foreground">Join a club, start a project, or contribute to existing repositories.</p>
          <div className="mt-6 flex gap-4 flex-wrap">
            <Link href="/dashboard/projects">
              <button className="px-6 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/10">
                Start a Project
              </button>
            </Link>
            <Link href="/dashboard/clusters">
              <button className="px-6 py-3 rounded-xl bg-background/50 hover:bg-background/80 border border-border text-foreground font-medium transition-all duration-300 hover:scale-105">
                Browse Clubs
              </button>
            </Link>
            {isFypEligible && (
              <Link href="/dashboard/student/fyp">
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-600 dark:text-violet-300 font-medium transition-all duration-300 hover:scale-105">
                  <GraduationCap className="w-5 h-5" />
                  Final Year Project
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}