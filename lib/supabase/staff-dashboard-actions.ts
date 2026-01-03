"use server";

import { createClient } from "@/lib/supabase/server";

export async function getComprehensiveStaffStats() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return null;

  try {
    // 1. Fetch FYP Stats (Students supervised by this staff)
    const { data: fyps } = await supabase
      .from("final_year_projects")
      .select("id, status")
      .eq("supervisor_id", user.id);

    const fypStats = {
      totalAssigned: fyps?.length || 0,
      inProgress: fyps?.filter(f => f.status === "in_progress" || f.status === "proposal_approved").length || 0,
      completed: fyps?.filter(f => f.status === "completed").length || 0,
      pendingReviews: 0
    };

    // Get pending submissions count for those FYPs
    if (fyps && fyps.length > 0) {
      const fypIds = fyps.map(f => f.id);
      const { count } = await supabase
        .from("fyp_submissions")
        .select("id", { count: "exact", head: true })
        .in("fyp_id", fypIds)
        .eq("status", "pending");
      fypStats.pendingReviews = count || 0;
    }

    // 2. Fetch Clusters managed by this staff
    const { count: clusterCount } = await supabase
      .from("clusters")
      .select("id", { count: "exact", head: true })
      .eq("staff_manager_id", user.id);

    // 3. Fetch Events organized by this staff or upcoming in their clusters
    const { count: upcomingEventsCount } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id)
      .eq("status", "published")
      .gte("start_date", new Date().toISOString());

    // 4. Fetch total student count (real information)
    // For staff, this might be students in their clusters or just system-wide if they have permission
    const { count: totalStudents } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student");

    return {
      fyp: fypStats,
      clusters: clusterCount || 0,
      events: upcomingEventsCount || 0,
      totalStudents: totalStudents || 0
    };
  } catch (error) {
    console.error("Error fetching comprehensive staff stats:", error);
    return null;
  }
}
