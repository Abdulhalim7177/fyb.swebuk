"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Staff/Supervisor-specific FYP actions
 */

export async function getStaffAssignedFYPs() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return [];

  try {
    // Get FYPs where current user is the supervisor
    const { data, error } = await supabase
      .from("final_year_projects")
      .select(`
        *,
        student:profiles!student_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("supervisor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assigned FYPs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching staff FYPs:", error);
    return [];
  }
}

export async function getAllFYPsForStaff() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return [];

  // Verify user is staff or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("final_year_projects")
      .select(`
        *,
        student:profiles!student_id (
          id,
          full_name,
          avatar_url
        ),
        supervisor:profiles!supervisor_id (
          id,
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all FYPs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching FYPs:", error);
    return [];
  }
}

export async function getStaffFYPDetails(fypId: string) {
  const supabase = await createClient();

  try {
    // Get FYP details
    const { data: fyp, error: fypError } = await supabase
      .from("final_year_projects")
      .select(`
        *,
        student:profiles!student_id (
          id,
          full_name,
          avatar_url,
          academic_level
        ),
        supervisor:profiles!supervisor_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("id", fypId)
      .single();

    if (fypError || !fyp) {
      console.error("Error fetching FYP:", fypError);
      return null;
    }

    // Get submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from("fyp_submissions")
      .select("*")
      .eq("fyp_id", fypId)
      .order("submitted_at", { ascending: false });

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    return {
      ...fyp,
      submissions: submissions || [],
    };
  } catch (error) {
    console.error("Unexpected error fetching FYP details:", error);
    return null;
  }
}

export async function reviewFYPSubmission(
  submissionId: string,
  status: "approved" | "needs_revision" | "rejected",
  feedback: string
) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify user is staff or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from("fyp_submissions")
      .update({
        status,
        supervisor_feedback: feedback,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (error) throw error;

    // If it's a proposal approval, update the FYP status
    const { data: submission } = await supabase
      .from("fyp_submissions")
      .select("submission_type, fyp_id")
      .eq("id", submissionId)
      .single();

    if (submission?.submission_type === "proposal" && status === "approved") {
      await supabase
        .from("final_year_projects")
        .update({ status: "proposal_approved" })
        .eq("id", submission.fyp_id);
    }

    revalidatePath("/dashboard/student/fyp");
    revalidatePath("/dashboard/staff/fyp");
    revalidatePath("/dashboard/admin/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error reviewing submission:", error);
    return { success: false, error: error.message };
  }
}

export async function getStaffDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return null;

  try {
    // Get all FYPs assigned to this staff member
    const { data: fyps } = await supabase
      .from("final_year_projects")
      .select("id, status")
      .eq("supervisor_id", user.id);

    if (!fyps) return null;

    const totalAssigned = fyps.length;
    const inProgress = fyps.filter(f => f.status === "in_progress").length;
    const completed = fyps.filter(f => f.status === "completed").length;

    // Get pending submissions for assigned FYPs
    const fypIds = fyps.map(f => f.id);

    let pendingReviews = 0;
    if (fypIds.length > 0) {
      const { data: submissions } = await supabase
        .from("fyp_submissions")
        .select("id")
        .in("fyp_id", fypIds)
        .eq("status", "pending");

      pendingReviews = submissions?.length || 0;
    }

    return {
      totalAssigned,
      inProgress,
      completed,
      pendingReviews,
    };
  } catch (error) {
    console.error("Error fetching staff stats:", error);
    return null;
  }
}
