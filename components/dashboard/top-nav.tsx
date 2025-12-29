"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface TopNavProps {
  user: any;
  userRole: string; // Pass role from profile instead of user metadata
  onMenuClick: () => void;
}

export function TopNav({ user, userRole, onMenuClick }: TopNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsAvatarLoading(true);
      console.log('Fetching profile for user:', user.id);
      try {
        // Fetch the user's profile to get their avatar
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        console.log('Profile data:', profileData, 'Profile error:', profileError);

        if (profileError) {
          console.error('Error fetching user profile for avatar:', profileError);
          // If there's an error fetching the profile (including timeout), we'll use the fallback avatar
          setAvatarUrl(null);
          return;
        }

        if (profileData?.avatar_url) {
          console.log('Found avatar URL in profile:', profileData.avatar_url);
          // If the profile has an avatar_url, try to get the signed URL
          try {
            const { data, error } = await supabase.storage
              .from('avatars')
              .createSignedUrl(profileData.avatar_url, 3600); // 1 hour expiry

            console.log('Signed URL data:', data, 'Error:', error);

            if (error) {
              console.error('Error creating signed URL for avatar:', error);
              // Fallback to getPublicUrl if createSignedUrl fails
              const { data: publicData } = await supabase.storage
                .from('avatars')
                .getPublicUrl(profileData.avatar_url);
              console.log('Public URL data:', publicData);
              // Normalize hostname to ensure consistency
              const normalizedPublicUrl = publicData?.publicUrl?.replace('localhost', '127.0.0.1') || null;
              setAvatarUrl(normalizedPublicUrl);
            } else {
              // Normalize hostname to ensure consistency with what works in profile page
              const normalizedSignedUrl = data?.signedUrl?.replace('localhost', '127.0.0.1') || null;
              setAvatarUrl(normalizedSignedUrl);
            }
          } catch (err: any) {
            console.error('Unexpected error getting avatar URL:', err);
            // Check if it's a timeout or network error and handle appropriately
            if (err?.message?.includes('timeout') || err?.status === 500) {
              console.warn('Storage timeout or server error - using fallback avatar');
            }
            setAvatarUrl(null);
          }
        } else {
          console.log('No avatar URL in profile');
          // No avatar in profile, use null to trigger fallback
          setAvatarUrl(null);
        }
      } catch (err: any) {
        console.error('Unexpected error in fetchUserProfile:', err);
        // Handle any other unexpected errors
        if (err?.message?.includes('timeout') || err?.status === 500) {
          console.warn('Database timeout or server error - using fallback avatar');
        }
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

  return (
    <>
      <header className="gh-card flex h-16 shrink-0 items-center justify-between border-b border-border/20 px-6 sticky top-0 z-30 bg-background/20 backdrop-blur-xl">
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
                <Link href="/dashboard/clusters" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Clubs</Link>
                <Link href="/dashboard/events" className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-foreground">Events</Link>
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
                <img
                  src={isAvatarLoading || !avatarUrl ? `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}` : avatarUrl}
                  alt="User avatar"
                  className="h-8 w-8 rounded-full"
                  onError={(e) => {
                    console.warn("Error loading avatar image:", e);
                    // If the profile image fails to load, fall back to the DiceBear avatar
                    // Also try to fix potential localhost/127.0.0.1 hostname mismatch
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('localhost') && !target.src.includes('127.0.0.1')) {
                      // If using localhost, try 127.0.0.1 as alternative
                      target.src = target.src.replace('localhost', '127.0.0.1');
                    } else if (target.src.includes('127.0.0.1') && !target.src.includes('localhost')) {
                      // If using 127.0.0.1, try localhost as alternative
                      target.src = target.src.replace('127.0.0.1', 'localhost');
                    } else {
                      // If both approaches failed, fall back to DiceBear avatar
                      target.src = `https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`;
                    }
                  }}
                />
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
                <Link href={`/dashboard/${userRole}/profile`}>
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
