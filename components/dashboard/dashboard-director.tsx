"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface DashboardDirectorProps {
  fallbackPath?: string;
}

export function DashboardDirector({ fallbackPath = "/dashboard/student" }: DashboardDirectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await (supabase.auth as any).getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // If already on a role-specific dashboard, no redirection needed
      if (pathname !== "/dashboard") {
        return;
      }

      // Fetch role from profiles table instead of user metadata
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let userRole = 'student'; // default role
      if (error || !profileData) {
        console.error('Error fetching profile or profile not found:', error);
        // Fallback to user metadata if profile is not found
        userRole = user.user_metadata?.role || "student";
      } else {
        userRole = profileData.role || 'student';
      }

      // Redirect to role-specific dashboard
      switch (userRole.toLowerCase()) {
        case "admin":
          router.push("/dashboard/admin");
          break;
        case "staff":
          router.push("/dashboard/staff");
          break;
        case "lead":
          router.push("/dashboard/lead");
          break;
        case "deputy":
          router.push("/dashboard/deputy");
          break;
        case "student":
        default:
          router.push("/dashboard/student");
          break;
      }
    };

    checkUserRole();
  }, [router, pathname]);

  return null; // This component doesn't render anything, just handles redirection
}