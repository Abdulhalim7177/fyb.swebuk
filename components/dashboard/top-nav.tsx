"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Bell, Menu, LogOut, Settings } from "lucide-react";
import { ThemeSelector } from "@/components/theme-selector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TopNavProps {
  user: User;
  userRole: string; // Pass role from profile instead of user metadata
  onMenuClick: () => void;
}

export function TopNav({ user, userRole, onMenuClick }: TopNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-[oklch(92.2% 0 0)]/[0.7] backdrop-blur-sm px-6 sticky top-0 z-30">
        {/* Left Side: Mobile Menu Button & Desktop Nav */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {["admin", "staff", "lead", "deputy"].includes(userRole.toLowerCase()) ? (
              <>
                <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-hover">Dashboard</Link>
                {(userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "staff") && (
                  <>
                    <Link href="/dashboard/admin/users" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Users</Link>
                    <Link href="/dashboard/admin/staff" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Staff</Link>
                  </>
                )}
                {["admin", "staff", "lead", "deputy"].includes(userRole.toLowerCase()) && (
                  <>
                    <Link href="/dashboard/clusters" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Clusters</Link>
                    <Link href="/dashboard/projects" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Projects</Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-hover">Dashboard</Link>
                <Link href="/dashboard/portfolio" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Portfolio</Link>
                <Link href="/dashboard/projects" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Projects</Link>
                <Link href="#" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Clubs</Link>
                <Link href="#" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Events</Link>
              </>
            )}
          </nav>
        </div>

        {/* Right Side: Icons & User Menu */}
        <div className="flex items-center gap-4">
          <ThemeSelector />
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-6 w-6" />
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 rounded-full border-none hover:bg-transparent">
                <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} alt="User avatar" className="h-8 w-8 rounded-full" />
                <div className="hidden text-left md:block">
                  <div className="text-sm font-medium">{user.email}</div>
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{userRole}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="focus:bg-hover">
                <Link href="/profile">
                  <Settings className="w-5 h-5 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-destructive focus:text-destructive">
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuLabel>Are you sure?</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-destructive focus:text-destructive">
                      {isLoggingOut ? "Logging out..." : "Yes, logout"}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Cancel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
