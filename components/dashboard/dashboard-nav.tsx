"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface DashboardNavProps {
  userId: string; // Pass userId instead of full user object
  userProfileRole: string; // Pass role from profile
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export function DashboardNav({ userId, userProfileRole, isSidebarOpen, setIsSidebarOpen }: DashboardNavProps) {
  const pathname = usePathname();
  const userRole = userProfileRole || "student";

  const getNavSections = () => {
    const studentNav = {
      "Main": [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: `/dashboard/${userRole}/profile`, label: "My Profile", icon: Users },
        { href: "/dashboard/portfolio", label: "Portfolio", icon: FileText },
      ],
      "Community": [
        { href: "/dashboard/clusters", label: "All Clubs", icon: Users2 },
        { href: "/dashboard/events", label: "Events", icon: Calendar },
        { href: "/dashboard/projects", label: "Projects", icon: FolderCheck },
      ],
      "My Clubs": [
        { href: "/dashboard/clusters/frontend", label: "Frontend Club", icon: () => <span className="h-2 w-2 rounded-full bg-blue-500" /> },
        { href: "/dashboard/clusters/ai-ml", label: "AI/ML Club", icon: () => <span className="h-2 w-2 rounded-full bg-green-500" /> },
      ],
    };

    const adminNav = {
      "Admin Panel": [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/admin/users", label: "User Management", icon: Users },
        { href: "/dashboard/admin/staff", label: "Staff Management", icon: UserCog },
      ],
      "Content": [
        { href: "/dashboard/clusters", label: "Club Management", icon: Users2 },
        { href: "/dashboard/events", label: "Event Management", icon: CalendarCog },
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
        // Assuming staff has a similar but perhaps reduced set of admin-like privileges
        return { "Content": adminNav.Content, "System": adminNav.System };
      case "lead":
        // Lead-specific navigation can be added here
        return { 
          "Content": adminNav.Content,
          "My Teams": [
            { href: "/dashboard/leads/teams", label: "My Teams", icon: Users2 },
            { href: "/dashboard/leads/projects", label: "My Projects", icon: FolderCheck },
          ]
        };
      case "deputy":
        // Deputy-specific navigation can be added here
        return { 
          "Content": adminNav.Content,
          "My Responsibilities": [
            { href: "/dashboard/deputies/tasks", label: "My Tasks", icon: FolderCheck },
            { href: "/dashboard/deputies/teams", label: "My Teams", icon: Users2 },
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
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-foreground">{getDashboardTitle()}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex-1 space-y-6 p-2">
        {Object.entries(navSections).map(([sectionTitle, items]) => (
          <div key={sectionTitle} className="space-y-1">
            <h3 className="px-4 text-xs font-semibold uppercase text-muted-foreground">{sectionTitle}</h3>
            {Array.isArray(items) && items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5 font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-hover hover:text-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[oklch(92.2% 0 0)]/[0.6] backdrop-blur-sm md:hidden",
          isSidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-[oklch(92.2% 0 0)]/[0.8] backdrop-blur-sm transition-transform md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}