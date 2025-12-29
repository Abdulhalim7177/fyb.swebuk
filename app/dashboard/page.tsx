"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

async function getUserRole() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await (supabase.auth as any).getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // Fetch role from profiles table instead of user metadata
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    // Fallback to user metadata if profile is not found
    return user.user_metadata?.role || "student";
  }

  return profileData.role || 'student';
}

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userRole = await getUserRole();
        
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
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/auth/login");
      }
    };

    checkUserRole();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}