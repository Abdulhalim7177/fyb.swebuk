import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
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
    userRole = user.user_metadata?.role?.toLowerCase() || "student";
  } else {
    userRole = profileData.role?.toLowerCase() || 'student';
  }

  // Redirect if user is not admin
  if (userRole !== "admin") {
    redirect(`/dashboard/${userRole}`);
  }

  return (
    <AdminDashboard user={user} />
  );
}
