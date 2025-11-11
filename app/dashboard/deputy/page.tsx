import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeputyDashboard } from "@/components/dashboard/deputy-dashboard";

export default async function DeputyDashboardPage() {
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
    userRole = user.user_metadata?.role || "student";
  } else {
    userRole = profileData.role || 'student';
  }

  // Redirect if user is not deputy
  if (userRole.toLowerCase() !== "deputy") {
    redirect(`/dashboard/${userRole.toLowerCase()}`);
  }

  return (
    <DeputyDashboard user={user} />
  );
}