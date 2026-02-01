"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bell, Menu, LogOut, Settings, User, LayoutDashboard, Users, UserCog, Users2, FolderCheck, FileText, Calendar, Briefcase } from "lucide-react";
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
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TopNavProps {
  user: any;
  userRole: string;
  onMenuClick: () => void;
}

export function TopNav({ user, userRole, onMenuClick }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsAvatarLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setAvatarUrl(null);
          return;
        }

        if (profileData?.avatar_url) {
          // If it's an external URL (e.g. Google auth or placeholder), use it directly
          if (profileData.avatar_url.startsWith('http')) {
            setAvatarUrl(profileData.avatar_url);
          } else {
            try {
              const { data, error } = await supabase.storage
                .from('avatars')
                .createSignedUrl(profileData.avatar_url, 3600);

              if (error) {
                const { data: publicData } = await supabase.storage
                  .from('avatars')
                  .getPublicUrl(profileData.avatar_url);
                setAvatarUrl(publicData?.publicUrl || null);
              } else {
                setAvatarUrl(data?.signedUrl || null);
              }
            } catch (err) {
              setAvatarUrl(null);
            }
          }
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        setAvatarUrl(null);
      } finally {
        setIsAvatarLoading(false);
      }
    };

    fetchUserProfile();
  }, [user.id, supabase]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await (supabase.auth as any).signOut();
    router.push("/");
  };

  const navLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "staff", "lead", "deputy", "student"],
    },
    {
      href: "/dashboard/admin/users",
      label: "Users",
      icon: Users,
      roles: ["admin", "staff"],
    },
    {
      href: "/dashboard/admin/staff",
      label: "Staff",
      icon: UserCog,
      roles: ["admin", "staff"],
    },
    {
      href: "/dashboard/clusters",
      label: "Clusters",
      icon: Users2,
      roles: ["admin", "staff", "lead", "deputy"],
    },
    {
      href: "/dashboard/projects",
      label: "Projects",
      icon: FolderCheck,
      roles: ["admin", "staff", "lead", "deputy", "student"],
    },
    {
      href: "/dashboard/portfolio",
      label: "Portfolio",
      icon: Briefcase,
      roles: ["student"],
    },
    {
      href: "/dashboard/clusters",
      label: "Clubs",
      icon: Users2,
      roles: ["student"],
    },
    {
      href: "/dashboard/events",
      label: "Events",
      icon: Calendar,
      roles: ["student"],
    },
  ];

  const filteredLinks = navLinks.filter((link) =>
    link.roles.includes(userRole.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/[0.05] bg-background/[0.01] backdrop-blur-sm">
      <div className="flex h-16 items-center px-6 justify-between">
        {/* Left Side: Mobile Menu & Breadcrumbs/Nav */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2 text-muted-foreground hover:text-foreground"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Desktop Nav - Clean & Minimal */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {filteredLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-70")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4">
          <ThemeSelector />
          
          <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-600 border-2 border-background" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-8 w-8 rounded-full ml-2 ring-2 ring-transparent hover:ring-border transition-all"
              >
                <Avatar className="h-8 w-8 border border-border/10">
                  <AvatarImage 
                    src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} 
                    alt={user.email} 
                    className="object-cover"
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background/60 backdrop-blur-xl border-border/20" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">{user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {userRole}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/${userRole === 'admin' ? 'admin' : 'student'}/profile`} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      disabled={isLoggingOut}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
                    >
                      {isLoggingOut ? "Logging out..." : "Confirm Logout"}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
