import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeputyDashboard } from "@/components/dashboard/deputy-dashboard";

export default async function DeputyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = user.user_metadata?.role || "student";

  // Redirect if user is not deputy
  if (userRole.toLowerCase() !== "deputy") {
    redirect(`/dashboard/${userRole.toLowerCase()}`);
  }

  return (
    <DeputyDashboard user={user} />
  );
}