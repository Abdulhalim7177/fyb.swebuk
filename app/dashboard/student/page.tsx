import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { getStudentDashboardStats, getRecentProjects, getPopularClusters, getFeaturedProjects, getUserMemberProjects } from "@/lib/supabase/dashboard-actions";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch profile data from profiles table instead of user metadata
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('role, full_name, academic_level')
    .eq('id', user.id)
    .single();

  let userRole = 'student'; // default role
  let fullName = user.user_metadata?.full_name || user.email; // Fallback to user metadata or email
  let academicLevel = null;

  if (error || !profileData) {
    console.error('Error fetching profile or profile not found:', error);
    // Fallback to user metadata if profile is not found
    userRole = user.user_metadata?.role || "student";
    academicLevel = user.user_metadata?.academic_level;
  } else {
    userRole = profileData.role || 'student';
    fullName = profileData.full_name || user.user_metadata?.full_name || user.email;
    academicLevel = profileData.academic_level;
  }

  // Redirect if user is not a student
  if (userRole.toLowerCase() !== "student") {
    redirect(`/dashboard/${userRole.toLowerCase()}`);
  }

  // Fetch dashboard data
  const stats = await getStudentDashboardStats(user.id);
  const recentProjects = await getRecentProjects(user.id, 3);
  const popularClusters = await getPopularClusters(4);
  const featuredProjects = await getFeaturedProjects(6);
  const memberProjects = await getUserMemberProjects(user.id, 6);

  return (
    <StudentDashboard
      user={user}
      fullName={fullName}
      academicLevel={academicLevel}
      stats={stats}
      recentProjects={recentProjects}
      popularClusters={popularClusters}
      featuredProjects={featuredProjects}
      memberProjects={memberProjects}
    />
  );
}
