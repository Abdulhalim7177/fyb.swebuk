import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";
import { getStaffDashboardStats } from "@/lib/supabase/fyp-staff-actions";

export default async function StaffDashboardPage() {
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

  // Redirect if user is not staff or admin
  if (userRole.toLowerCase() !== "staff" && userRole.toLowerCase() !== "admin") {
    redirect(`/dashboard/${userRole.toLowerCase()}`);
  }

  // Fetch FYP stats and pending submissions
  const fypStats = await getStaffDashboardStats();

  // Determine which FYPs to fetch submissions for
  let fypIds: string[] = [];

  // Check if user is admin - they can see all pending submissions
  if (userRole.toLowerCase() === 'admin') {
    // Admin can see all FYPs
    const { data: allFYPs } = await supabase
      .from('final_year_projects')
      .select('id');
    fypIds = allFYPs?.map(f => f.id) || [];
    console.log('Admin user - viewing all FYPs:', fypIds.length);
  } else {
    // Staff can only see their supervised FYPs
    const { data: supervisedFYPs, error: supervisedError } = await supabase
      .from('final_year_projects')
      .select('id')
      .eq('supervisor_id', user.id);

    if (supervisedError) {
      console.error('Error fetching supervised FYPs:', supervisedError);
    }

    fypIds = supervisedFYPs?.map(f => f.id) || [];
    console.log('Staff user - supervised FYP IDs:', fypIds);
  }

  // Then fetch recent pending submissions for those FYPs
  let pendingSubmissions: any[] = [];
  if (fypIds.length > 0) {
    const { data, error: submissionsError } = await supabase
      .from('fyp_submissions')
      .select(`
        id,
        title,
        submission_type,
        submitted_at,
        fyp_id,
        fyp:final_year_projects!inner (
          id,
          title,
          student:profiles!student_id (
            full_name
          )
        )
      `)
      .eq('status', 'pending')
      .in('fyp_id', fypIds)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (submissionsError) {
      console.error('Error fetching pending submissions:', submissionsError);
    }

    console.log('Pending submissions found:', data?.length || 0);
    pendingSubmissions = data || [];
  } else {
    console.log('No FYPs found for this user');
  }

  return (
    <StaffDashboard
      user={user}
      fullName={fullName}
      fypStats={fypStats}
      pendingSubmissions={pendingSubmissions || []}
    />
  );
}
