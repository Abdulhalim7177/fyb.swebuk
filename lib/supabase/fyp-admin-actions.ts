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
    // Get staff members from profiles
    const { data: staff, error: staffError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("role", "staff");

    if (staffError || !staff) {
      console.error("Error fetching supervisors:", staffError);
      return [];
    }

    // Fetch email from auth.users for each staff member
    const supervisorsWithEmail = await Promise.all(
      staff.map(async (supervisor) => {
        try {
          const { data: authUser } = await supabase
            .auth.admin.getUserById(supervisor.id);
          return {
            ...supervisor,
            email: authUser.user?.email || "",
          };
        } catch {
          return {
            ...supervisor,
            email: "",
          };
        }
      })
    );

    return supervisorsWithEmail.sort((a, b) =>
      (a.full_name || "").localeCompare(b.full_name || "")
    );
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
      .select("id, full_name")
      .eq("role", "staff");

    if (staffError || !staff) {
      console.error("Error fetching staff:", staffError);
      return [];
    }

    // Get FYP counts and fetch emails for each supervisor
    const workload = await Promise.all(
      staff.map(async (supervisor) => {
        const { data: fyps } = await supabase
          .from("final_year_projects")
          .select("id, status")
          .eq("supervisor_id", supervisor.id);

        // Fetch email from auth.users
        let email = "";
        try {
          const { data: authUser } = await supabase
            .auth.admin.getUserById(supervisor.id);
          email = authUser.user?.email || "";
        } catch {
          // Ignore email fetch errors
        }

        const total = fyps?.length || 0;
        const active = fyps?.filter(f => f.status !== "completed" && f.status !== "rejected").length || 0;
        const completed = fyps?.filter(f => f.status === "completed").length || 0;

        return {
          supervisor: {
            ...supervisor,
            email,
          },
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
    const { data: fyps, error: fypsError } = await supabase
      .from("final_year_projects")
      .select("id, status, supervisor_id");

    if (fypsError) {
      console.error("Error fetching FYPs:", fypsError);
      // Return basic stats without FYP data
      return {
        totalProjects: 0,
        unassigned: 0,
        pendingApproval: 0,
        inProgress: 0,
        completed: 0,
        pendingSubmissions: 0,
      };
    }

    if (!fyps) {
      return {
        totalProjects: 0,
        unassigned: 0,
        pendingApproval: 0,
        inProgress: 0,
        completed: 0,
        pendingSubmissions: 0,
      };
    }

    const totalProjects = fyps.length;
    const unassigned = fyps.filter(f => !f.supervisor_id).length;
    const pendingApproval = fyps.filter(f => f.status === "proposal_submitted").length;
    const inProgress = fyps.filter(f => f.status === "in_progress" || f.status === "proposal_approved").length;
    const completed = fyps.filter(f => f.status === "completed").length;

    // Get pending submissions across all projects (handle case where table might not exist)
    let pendingSubmissions = 0;
    try {
      const { data: submissions, error: submissionsError } = await supabase
        .from("fyp_submissions")
        .select("id")
        .eq("status", "pending");

      if (!submissionsError && submissions) {
        pendingSubmissions = submissions.length;
      }
    } catch (e) {
      // Table might not exist, ignore
      console.warn("fyp_submissions table not accessible:", e);
    }

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
    return {
      totalProjects: 0,
      unassigned: 0,
      pendingApproval: 0,
      inProgress: 0,
      completed: 0,
      pendingSubmissions: 0,
    };
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

/**
 * Get all Level 400 students for FYP assignment
 */
export async function getLevel400StudentsForAssignment() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return [];

  // Verify user is admin or staff
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    return [];
  }

  try {
    // Get all Level 400 students with their FYP status
    // Note: academic_level might not exist or RLS might block filtered queries
    // Fetch all students and filter in JavaScript
    let allStudents: any[] = [];
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          academic_level,
          role
        `)
        .neq("role", "admin")
        .order("full_name", { ascending: true });

      if (!error && data) {
        allStudents = data;
      }
    } catch (queryError) {
      console.warn("Query for students failed:", queryError);
      return [];
    }

    // Filter to only Level 400 students (handle both number 400 and string "level_400")
    const students = allStudents.filter((s) =>
      s.academic_level === 400 ||
      s.academic_level === "400" ||
      s.academic_level === "level_400"
    );

    // Get FYP status and fetch email from auth.users for each student
    const studentsWithFYP = await Promise.all(
      (students || []).map(async (student) => {
        const { data: fyp } = await supabase
          .from("final_year_projects")
          .select(`
            id,
            title,
            status,
            supervisor_id,
            created_at
          `)
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Fetch email from auth.users
        let email = "";
        try {
          const { data: authUser } = await supabase
            .auth.admin.getUserById(student.id);
          email = authUser.user?.email || "";
        } catch {
          // Ignore email fetch errors
        }

        return {
          ...student,
          email,
          has_fyp: !!fyp,
          fyp: fyp || null,
        };
      })
    );

    return studentsWithFYP;
  } catch (error) {
    console.error("Unexpected error fetching Level 400 students:", error);
    return [];
  }
}

/**
 * Get students assigned to a specific supervisor
 */
export async function getStudentsBySupervisor(supervisorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return [];

  try {
    const { data: fyps, error } = await supabase
      .from("final_year_projects")
      .select(`
        id,
        title,
        status,
        created_at,
        student:profiles!student_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("supervisor_id", supervisorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching students by supervisor:", error);
      return [];
    }

    return fyps || [];
  } catch (error) {
    console.error("Unexpected error fetching students by supervisor:", error);
    return [];
  }
}

/**
 * Create FYP and assign supervisor (for admin to manually add student)
 */
export async function createFYPWithAssignment(
  studentId: string,
  supervisorId: string,
  title: string,
  description?: string
) {
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
    // Check if student already has an FYP
    const { data: existingFYP } = await supabase
      .from("final_year_projects")
      .select("id")
      .eq("student_id", studentId)
      .limit(1)
      .single();

    if (existingFYP) {
      return { success: false, error: "Student already has an FYP project" };
    }

    const { error } = await supabase
      .from("final_year_projects")
      .insert({
        student_id: studentId,
        supervisor_id: supervisorId,
        title: title || "FYP Project",
        description: description || "",
        status: "proposal_approved",
      });

    if (error) throw error;

    revalidatePath("/dashboard/admin/fyp");
    revalidatePath("/dashboard/staff/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating FYP with assignment:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reassign supervisor for a student
 */
export async function reassignSupervisor(fypId: string, newSupervisorId: string) {
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
      .update({ supervisor_id: newSupervisorId })
      .eq("id", fypId);

    if (error) throw error;

    revalidatePath("/dashboard/admin/fyp");
    revalidatePath("/dashboard/staff/fyp");
    revalidatePath("/dashboard/student/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error reassigning supervisor:", error);
    return { success: false, error: error.message };
  }
}
