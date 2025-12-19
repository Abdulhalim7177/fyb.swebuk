import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadDashboard } from "@/components/dashboard/lead-dashboard";

export default async function LeadDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch profile data from profiles table instead of user metadata
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  let userRole = 'student'; // default role
  let fullName = user.user_metadata?.full_name || user.email; // Fallback to user metadata or email
  if (error || !profileData) {
    console.error('Error fetching profile or profile not found:', error);
    // Fallback to user metadata if profile is not found
    userRole = user.user_metadata?.role || "student";
  } else {
    userRole = profileData.role || 'student';
    fullName = profileData.full_name || user.user_metadata?.full_name || user.email;
  }

  // Redirect if user is not lead
  if (userRole.toLowerCase() !== "lead") {
    redirect(`/dashboard/${userRole.toLowerCase()}`);
  }

  return (
    <LeadDashboard user={user} fullName={fullName} />
  );
}
