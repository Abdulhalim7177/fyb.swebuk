"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Admin-specific FYP actions
 */

export async function getAllFYPsForAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return [];

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
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

export async function getUnassignedFYPs() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return [];

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
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
        )
      `)
      .is("supervisor_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching unassigned FYPs:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching unassigned FYPs:", error);
    return [];
  }
}

export async function getAllSupervisors() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "staff")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching supervisors:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching supervisors:", error);
    return [];
  }
}

export async function assignSupervisorToFYP(fypId: string, supervisorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from("final_year_projects")
      .update({ supervisor_id: supervisorId })
      .eq("id", fypId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/fyp");
    revalidatePath("/dashboard/staff/fyp");
    revalidatePath("/dashboard/student/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error assigning supervisor:", error);
    return { success: false, error: error.message };
  }
}

export async function bulkAssignSupervisor(fypIds: string[], supervisorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from("final_year_projects")
      .update({ supervisor_id: supervisorId })
      .in("id", fypIds);

    if (error) throw error;

    revalidatePath("/dashboard/admin/fyp");
    revalidatePath("/dashboard/staff/fyp");
    return { success: true, count: fypIds.length };
  } catch (error: any) {
    console.error("Error bulk assigning supervisor:", error);
    return { success: false, error: error.message };
  }
}

export async function getSupervisorWorkload() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return [];

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return [];
  }

  try {
    // Get all staff members
    const { data: staff, error: staffError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "staff");

    if (staffError || !staff) {
      console.error("Error fetching staff:", staffError);
      return [];
    }

    // Get FYP counts for each supervisor
    const workload = await Promise.all(
      staff.map(async (supervisor) => {
        const { data: fyps } = await supabase
          .from("final_year_projects")
          .select("id, status")
          .eq("supervisor_id", supervisor.id);

        const total = fyps?.length || 0;
        const active = fyps?.filter(f => f.status !== "completed" && f.status !== "rejected").length || 0;
        const completed = fyps?.filter(f => f.status === "completed").length || 0;

        return {
          supervisor,
          total,
          active,
          completed,
        };
      })
    );

    return workload;
  } catch (error) {
    console.error("Error fetching supervisor workload:", error);
    return [];
  }
}

export async function getAdminDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return null;

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return null;
  }

  try {
    // Get all FYPs
    const { data: fyps } = await supabase
      .from("final_year_projects")
      .select("id, status, supervisor_id");

    if (!fyps) return null;

    const totalProjects = fyps.length;
    const unassigned = fyps.filter(f => !f.supervisor_id).length;
    const pendingApproval = fyps.filter(f => f.status === "proposal_submitted").length;
    const inProgress = fyps.filter(f => f.status === "in_progress" || f.status === "proposal_approved").length;
    const completed = fyps.filter(f => f.status === "completed").length;

    // Get pending submissions across all projects
    const { data: submissions } = await supabase
      .from("fyp_submissions")
      .select("id")
      .eq("status", "pending");

    const pendingSubmissions = submissions?.length || 0;

    return {
      totalProjects,
      unassigned,
      pendingApproval,
      inProgress,
      completed,
      pendingSubmissions,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return null;
  }
}

export async function approveFYPProposal(fypId: string) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from("final_year_projects")
      .update({ status: "proposal_approved" })
      .eq("id", fypId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/fyp");
    revalidatePath("/dashboard/student/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error approving proposal:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectFYPProposal(fypId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const { error } = await supabase
      .from("final_year_projects")
      .update({
        status: "rejected",
        feedback: reason,
      })
      .eq("id", fypId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/fyp");
    revalidatePath("/dashboard/student/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting proposal:", error);
    return { success: false, error: error.message };
  }
}
