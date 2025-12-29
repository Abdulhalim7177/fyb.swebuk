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
  ChevronRight,
  BookOpen,
  PenSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getUserClusters } from "@/lib/supabase/user-actions";

interface DashboardNavProps {
  userId: string; // Pass userId instead of full user object
  userProfileRole: string; // Pass role from profile
  userAcademicLevel?: string; // Pass academic level for FYP access
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export function DashboardNav({ userId, userProfileRole, userAcademicLevel, isSidebarOpen, setIsSidebarOpen }: DashboardNavProps) {
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

    // Add FYP link only for Level 400 students
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
        icon: () => <span className="h-2 w-2 rounded-full bg-blue-500" />,
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
      case "admin":
        return adminNav;
      case "staff":
        // Staff should have specific navigation, not the same as admin
        return {
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
      case "lead":
        // Lead-specific navigation
        return {
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
      case "deputy":
        // Deputy-specific navigation
        return {
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
      case "student":
      default:
        return studentNav;
    }
  };

  const getDashboardTitle = () => {
    switch (userRole.toLowerCase()) {
      case "admin":
        return "Admin Panel";
      case "staff":
        return "Staff Panel";
      case "lead":
        return "Lead Dashboard";
      case "deputy":
        return "Deputy Dashboard";
      case "student":
      default:
        return "Student Dashboard";
    }
  };

  const navSections = getNavSections();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">{getDashboardTitle()}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-2 p-2">
        {Object.entries(navSections).map(([sectionTitle, items], sectionIndex) => {
          // Check if this is the Projects section
          const isProjectsSection = sectionTitle === "Projects";

          return (
            <div key={sectionTitle}>
              {sectionIndex > 0 && (
                <div className="border-t border-white/10 my-3" />
              )}
              <div className="space-y-1">
              {isProjectsSection ? (
                // Projects dropdown
                <div className="space-y-1">
                  <button
                    onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-4 py-2.5 font-medium transition-all duration-300 group",
                      "text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <FolderCheck className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                      <span>Projects</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-300 ease-out",
                        isProjectsOpen ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "ml-4 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                      isProjectsOpen
                        ? "max-h-[500px] opacity-100"
                        : "max-h-0 opacity-0"
                    )}
                  >
                    {Array.isArray(items) && items.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsProjectsOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300",
                            "transform hover:translate-x-1",
                            "text-slate-400 hover:bg-white/10 hover:text-white"
                          )}
                          style={{
                            transitionDelay: isProjectsOpen ? `${index * 30}ms` : '0ms'
                          }}
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 transition-all duration-200" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // Regular section - hide section title for cleaner look
                <div className="space-y-1">
                  {Array.isArray(items) && items.length > 0 && items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-all duration-300 group",
                          isActive
                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-white border-l-4 border-emerald-500 shadow-lg shadow-emerald-500/20"
                            : "text-slate-400 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 transition-transform duration-200",
                          !isActive && "group-hover:scale-110"
                        )} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
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
      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-black/95 backdrop-blur-xl transition-transform md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}