"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, LogIn, LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function AuthButtonClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-20 h-8 bg-gray-600 animate-pulse rounded"></div>
        <div className="w-20 h-8 bg-gray-600 animate-pulse rounded"></div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <div className="hidden md:flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-300 border-gray-600 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-4">
                <h4 className="font-semibold">Confirm Logout</h4>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to log out?
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button variant="destructive" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Show only dashboard link on mobile - logout is in the mobile menu */}
        <div className="md:hidden">
          <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
            <Link href="/dashboard" className="text-gray-300 hover:text-white">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login" className="text-gray-300 hover:text-white">
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/auth/sign-up" className="bg-indigo-600 hover:bg-indigo-700">
            <User className="w-4 h-4 mr-2" />
            Get Started
          </Link>
        </Button>
      </div>
      <div className="md:hidden flex space-x-1">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
          <Link href="/auth/login" className="text-gray-300 hover:text-white">
            <LogIn className="w-4 h-4" />
          </Link>
        </Button>
        <Button size="sm" asChild className="h-8 px-2 text-xs">
          <Link href="/auth/sign-up" className="bg-indigo-600 hover:bg-indigo-700">
            <User className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </>
  );
}