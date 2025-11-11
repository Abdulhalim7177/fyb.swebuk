import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = user.user_metadata?.role?.toLowerCase() || "student";

  // Redirect if user is not admin
  if (userRole !== "admin") {
    redirect(`/dashboard/${userRole}`);
  }

  return (
    <AdminDashboard user={user} />
  );
}
