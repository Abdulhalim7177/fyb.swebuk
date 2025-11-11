import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";

export default async function StaffDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = user.user_metadata?.role || "student";

  // Redirect if user is not staff
  if (userRole.toLowerCase() !== "staff") {
    redirect(`/dashboard/${userRole.toLowerCase()}`);
  }

  return (
    <StaffDashboard user={user} />
  );
}
