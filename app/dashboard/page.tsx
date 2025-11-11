"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUserRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      const userRole = user.user_metadata?.role || "student";

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
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}