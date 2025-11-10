import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRole = user.user_metadata?.role || "student";

  // Redirect if user is not a student
  if (userRole.toLowerCase() !== "student") {
    redirect(`/dashboard/${userRole.toLowerCase()}`);
  }

  return (
    <StudentDashboard user={user} />
  );
}
