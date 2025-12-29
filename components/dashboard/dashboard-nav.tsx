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
    const mainNavItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: `/dashboard/student/profile`, label: "My Profile", icon: Users },
      { href: "/dashboard/portfolio", label: "Portfolio", icon: FileText },
    ];

    if (isLevel400) {
      mainNavItems.push({
        href: "/dashboard/student/fyp",
        label: "Final Year Project",
        icon: FileText,
      });
    }

    const studentNav = {
      "Main": mainNavItems,
      "Community": [
        { href: "/dashboard/clusters", label: "All Clubs", icon: Users2 },
        { href: "/blog", label: "Community Blog", icon: BookOpen },
        { href: "/events", label: "Browse Events", icon: Calendar },
      ],
      "My Content": [
        { href: "/dashboard/blog", label: "My Blog Posts", icon: PenSquare },
        { href: "/dashboard/student/events", label: "My Events", icon: CalendarCog },
      ],
      "Projects": [
        { href: "/dashboard/projects?tab=personal", label: "My Personal Projects", icon: FolderCheck, isDropdownItem: true },
        { href: "/dashboard/projects?tab=cluster", label: "My Cluster Projects", icon: FolderCheck, isDropdownItem: true },
        { href: "/dashboard/projects?tab=all", label: "All Projects", icon: FolderCheck, isDropdownItem: true },
      ],
      "My Clubs": userClusters.map(cluster => ({
        href: `/dashboard/clusters/${cluster.id}`,
        label: cluster.name,
        icon: () => <span className="h-2 w-2 rounded-full bg-primary/60" />,
      })),
    };

    const adminNav = {
      "Admin Panel": [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/admin/users", label: "Student Management", icon: Users },
        { href: "/dashboard/admin/staff", label: "Staff Management", icon: UserCog },
        { href: "/dashboard/admin/academic-sessions", label: "Academic Sessions", icon: CalendarCog },
        { href: "/dashboard/admin/fyp", label: "FYP Supervision", icon: FileText },
      ],
      "Content": [
        { href: "/dashboard/admin/clusters", label: "Club Management", icon: Users2 },
        { href: "/dashboard/admin/blog", label: "Blog Management", icon: BookOpen },
        { href: "/dashboard/admin/events", label: "Event Management", icon: Calendar },
        { href: "/dashboard/projects", label: "Project Oversight", icon: FolderCheck },
        { href: "/dashboard/repository", label: "Repository Control", icon: GitPullRequest },
      ],
      "System": [
        { href: "/dashboard/analytics", label: "Analytics", icon: PieChart },
        { href: "/dashboard/settings", label: "System Settings", icon: Settings },
        { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
      ],
    };

    switch (userRole.toLowerCase()) {
      case "admin": return adminNav;
      case "staff": return {
          "Main": [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: `/dashboard/${userRole}/profile`, label: "My Profile", icon: Users },
          ],
          "Management": [
            { href: "/dashboard/staff/users", label: "Student Management", icon: Users },
            { href: "/dashboard/staff/staff", label: "Staff Management", icon: UserCog },
            { href: "/dashboard/staff/academic-sessions", label: "Academic Sessions", icon: CalendarCog },
            { href: "/dashboard/staff/fyp", label: "FYP Supervision", icon: FileText },
          ],
          "Content": [
            { href: "/dashboard/staff/clusters", label: "Cluster Management", icon: Users2 },
            { href: "/dashboard/staff/blog", label: "Blog Moderation", icon: BookOpen },
            { href: "/dashboard/staff/events", label: "Event Management", icon: Calendar },
            { href: "/dashboard/projects", label: "Project Oversight", icon: FolderCheck },
          ],
        };
      case "lead": return {
          "Main": [
            { href: "/dashboard/lead", label: "Dashboard", icon: LayoutDashboard },
            { href: `/dashboard/lead/profile`, label: "My Profile", icon: Users },
          ],
          "Management": [
            { href: "/dashboard/lead/clusters", label: "My Clusters", icon: Users2 },
            { href: "/dashboard/lead/blog", label: "Blog Approvals", icon: BookOpen },
          ],
          "Community": [
            { href: "/dashboard/clusters", label: "All Clubs", icon: Users2 },
            { href: "/blog", label: "Community Blog", icon: BookOpen },
            { href: "/events", label: "Browse Events", icon: Calendar },
            { href: "/dashboard/student/events", label: "My Events", icon: CalendarCog },
          ]
        };
      case "deputy": return {
          "Main": [
            { href: "/dashboard/deputy", label: "Dashboard", icon: LayoutDashboard },
            { href: `/dashboard/deputy/profile`, label: "My Profile", icon: Users },
          ],
          "Management": [
            { href: "/dashboard/deputy/clusters", label: "My Clusters", icon: Users2 },
            { href: "/dashboard/deputy/blog", label: "Blog Approvals", icon: BookOpen },
          ],
          "Community": [
            { href: "/dashboard/clusters", label: "All Clubs", icon: Users2 },
            { href: "/blog", label: "Community Blog", icon: BookOpen },
            { href: "/events", label: "Browse Events", icon: Calendar },
            { href: "/dashboard/student/events", label: "My Events", icon: CalendarCog },
          ]
        };
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
      <div className="h-16 flex items-center px-6 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
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
                <h4 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 hover:text-foreground",
                        isProjectsOpen ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <FolderCheck className="h-4 w-4" />
                        <span>Projects</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
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
                      <div className="pl-4 space-y-1 mt-1 border-l ml-4 border-border/40">
                        {Array.isArray(items) && items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                              "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
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
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
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
          "fixed top-0 left-0 z-50 h-full w-64 shrink-0 border-r border-border/10 bg-background/30 backdrop-blur-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
