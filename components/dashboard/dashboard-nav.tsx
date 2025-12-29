"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  ShieldCheck,
  UserCog,
  Users2,
  CalendarCog,
  FolderCheck,
  GitPullRequest,
  PieChart,
  BarChart3,
  ChevronDown,
  BookOpen,
  PenSquare,
  GraduationCap,
  Briefcase,
  Layers,
  MessageSquare,
  Globe,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserClusters } from "@/lib/supabase/user-actions";

interface DashboardNavProps {
  userId: string;
  userProfileRole: string;
  userAcademicLevel?: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export function DashboardNav({ 
  userId, 
  userProfileRole, 
  userAcademicLevel, 
  isSidebarOpen, 
  setIsSidebarOpen 
}: DashboardNavProps) {
  const pathname = usePathname();
  const userRole = userProfileRole || "student";
  const [userClusters, setUserClusters] = useState<any[]>([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  // Check if user is Level 400 for FYP access
  const isLevel400 = userAcademicLevel === "400" || userAcademicLevel === "level_400";

  useEffect(() => {
    if (userRole === "student" && userId) {
      const fetchClusters = async () => {
        const clusters = await getUserClusters(userId);
        setUserClusters(clusters);
      };
      fetchClusters();
    }
  }, [userId, userRole]);

  const getNavSections = () => {
    // Common colors
    const colors = {
      dashboard: "text-sky-500",
      profile: "text-violet-500",
      portfolio: "text-pink-500",
      fyp: "text-emerald-500",
      clubs: "text-amber-500",
      blog: "text-orange-500",
      events: "text-rose-500",
      projects: "text-blue-500",
      users: "text-indigo-500",
      staff: "text-purple-500",
      settings: "text-slate-500",
      analytics: "text-teal-500",
      repo: "text-gray-500",
    };

    const mainNavItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: colors.dashboard },
      { href: `/dashboard/student/profile`, label: "My Profile", icon: Users, color: colors.profile },
      { href: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase, color: colors.portfolio },
    ];

    if (isLevel400) {
      mainNavItems.push({
        href: "/dashboard/student/fyp",
        label: "Final Year Project",
        icon: GraduationCap,
        color: colors.fyp,
      });
    }

    const studentNav = {
      "Main": mainNavItems,
      "Community": [
        { href: "/dashboard/clusters", label: "All Clubs", icon: Users2, color: colors.clubs },
        { href: "/blog", label: "Community Blog", icon: BookOpen, color: colors.blog },
        { href: "/events", label: "Browse Events", icon: Calendar, color: colors.events },
      ],
      "My Content": [
        { href: "/dashboard/blog", label: "My Blog Posts", icon: PenSquare, color: colors.blog },
        { href: "/dashboard/student/events", label: "My Events", icon: CalendarCog, color: colors.events },
      ],
      "Projects": [
        { href: "/dashboard/projects?tab=personal", label: "My Personal Projects", icon: FolderCheck, color: colors.projects, isDropdownItem: true },
        { href: "/dashboard/projects?tab=cluster", label: "My Cluster Projects", icon: Layers, color: colors.projects, isDropdownItem: true },
        { href: "/dashboard/projects?tab=all", label: "All Projects", icon: Globe, color: colors.projects, isDropdownItem: true },
      ],
      "My Clubs": userClusters.map(cluster => ({
        href: `/dashboard/clusters/${cluster.id}`,
        label: cluster.name,
        icon: () => <span className="h-2 w-2 rounded-full bg-primary/60" />,
        color: "text-primary",
      })),
    };

    const adminNav = {
      "Admin Panel": [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: colors.dashboard },
        { href: "/dashboard/admin/users", label: "Student Management", icon: Users, color: colors.users },
        { href: "/dashboard/admin/staff", label: "Staff Management", icon: UserCog, color: colors.staff },
        { href: "/dashboard/admin/academic-sessions", label: "Academic Sessions", icon: CalendarCog, color: colors.settings },
        { href: "/dashboard/admin/fyp", label: "FYP Supervision", icon: GraduationCap, color: colors.fyp },
      ],
      "Content": [
        { href: "/dashboard/admin/clusters", label: "Club Management", icon: Users2, color: colors.clubs },
        { href: "/dashboard/admin/blog", label: "Blog Management", icon: BookOpen, color: colors.blog },
        { href: "/dashboard/admin/events", label: "Event Management", icon: Calendar, color: colors.events },
        { href: "/dashboard/projects", label: "Project Oversight", icon: FolderCheck, color: colors.projects },
        { href: "/dashboard/repository", label: "Repository Control", icon: GitPullRequest, color: colors.repo },
      ],
      "System": [
        { href: "/dashboard/analytics", label: "Analytics", icon: PieChart, color: colors.analytics },
        { href: "/dashboard/settings", label: "System Settings", icon: Settings, color: colors.settings },
        { href: "/dashboard/reports", label: "Reports", icon: BarChart3, color: colors.analytics },
      ],
    };

    const staffNav = {
      "Main": [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: colors.dashboard },
        { href: `/dashboard/${userRole}/profile`, label: "My Profile", icon: Users, color: colors.profile },
      ],
      "Management": [
        { href: "/dashboard/staff/users", label: "Student Management", icon: Users, color: colors.users },
        { href: "/dashboard/staff/staff", label: "Staff Directory", icon: UserCog, color: colors.staff },
        { href: "/dashboard/staff/academic-sessions", label: "Academic Sessions", icon: CalendarCog, color: colors.settings },
        { href: "/dashboard/staff/fyp", label: "FYP Supervision", icon: GraduationCap, color: colors.fyp },
      ],
      "Content": [
        { href: "/dashboard/staff/clusters", label: "Cluster Management", icon: Users2, color: colors.clubs },
        { href: "/dashboard/staff/blog", label: "Blog Moderation", icon: BookOpen, color: colors.blog },
        { href: "/dashboard/staff/events", label: "Event Management", icon: Calendar, color: colors.events },
        { href: "/dashboard/projects", label: "Project Oversight", icon: FolderCheck, color: colors.projects },
      ],
    };

    const leadNav = {
      "Main": [
        { href: "/dashboard/lead", label: "Dashboard", icon: LayoutDashboard, color: colors.dashboard },
        { href: `/dashboard/lead/profile`, label: "My Profile", icon: Users, color: colors.profile },
      ],
      "Management": [
        { href: "/dashboard/lead/clusters", label: "My Clusters", icon: Users2, color: colors.clubs },
        { href: "/dashboard/lead/blog", label: "Blog Approvals", icon: BookOpen, color: colors.blog },
      ],
      "Community": [
        { href: "/dashboard/clusters", label: "All Clubs", icon: Users2, color: colors.clubs },
        { href: "/blog", label: "Community Blog", icon: BookOpen, color: colors.blog },
        { href: "/events", label: "Browse Events", icon: Calendar, color: colors.events },
        { href: "/dashboard/student/events", label: "My Events", icon: CalendarCog, color: colors.events },
      ]
    };

    const deputyNav = {
      "Main": [
        { href: "/dashboard/deputy", label: "Dashboard", icon: LayoutDashboard, color: colors.dashboard },
        { href: `/dashboard/deputy/profile`, label: "My Profile", icon: Users, color: colors.profile },
      ],
      "Management": [
        { href: "/dashboard/deputy/clusters", label: "My Clusters", icon: Users2, color: colors.clubs },
        { href: "/dashboard/deputy/blog", label: "Blog Approvals", icon: BookOpen, color: colors.blog },
      ],
      "Community": [
        { href: "/dashboard/clusters", label: "All Clubs", icon: Users2, color: colors.clubs },
        { href: "/blog", label: "Community Blog", icon: BookOpen, color: colors.blog },
        { href: "/events", label: "Browse Events", icon: Calendar, color: colors.events },
        { href: "/dashboard/student/events", label: "My Events", icon: CalendarCog, color: colors.events },
      ]
    };

    switch (userRole.toLowerCase()) {
      case "admin": return adminNav;
      case "staff": return staffNav;
      case "lead": return leadNav;
      case "deputy": return deputyNav;
      case "student": default: return studentNav;
    }
  };

  const getDashboardTitle = () => {
    switch (userRole.toLowerCase()) {
      case "admin": return "Admin Panel";
      case "staff": return "Staff Panel";
      case "lead": return "Lead Dashboard";
      case "deputy": return "Deputy Dashboard";
      case "student": default: return "Student Dashboard";
    }
  };

  const navSections = getNavSections();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">{getDashboardTitle()}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        {Object.entries(navSections).map(([sectionTitle, items]) => {
          const isProjectsSection = sectionTitle === "Projects";

          return (
            <div key={sectionTitle}>
              {sectionTitle !== "Main" && (
                <h4 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-70">
                  {sectionTitle}
                </h4>
              )}
              
              <div className="space-y-1">
                {isProjectsSection ? (
                  // Projects Dropdown
                  <div className="space-y-1">
                    <button
                      onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/10 hover:text-foreground group",
                        isProjectsOpen ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("flex items-center justify-center w-5 h-5 rounded-md bg-blue-500/10 text-blue-500 group-hover:text-blue-600 transition-colors")}>
                          <FolderCheck className="h-4 w-4" />
                        </div>
                        <span>Projects</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200 opacity-50",
                          isProjectsOpen ? "rotate-180" : ""
                        )}
                      />
                    </button>
                    
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        isProjectsOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="pl-4 space-y-1 mt-1 border-l ml-2.5 border-border/20">
                        {Array.isArray(items) && items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors relative group",
                              "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", item.color?.replace("text-", "bg-"))} />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular Items
                  Array.isArray(items) && items.length > 0 && items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                        <div className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-md transition-colors",
                          isActive ? "bg-transparent" : "bg-transparent",
                          item.color, // Apply the specific color
                          !isActive && "opacity-70 group-hover:opacity-100"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 shrink-0 border-r border-border/[0.05] bg-background/[0.01] backdrop-blur-sm transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}