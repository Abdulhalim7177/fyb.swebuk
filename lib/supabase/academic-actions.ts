"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateAcademicProfile(userId: string, academicLevel: string, department: string, faculty: string, institution: string, linkedinUrl?: string, githubUrl?: string) {
  const supabase = await createClient();

  try {
    // Update the profile table with academic information
    const { error } = await supabase
      .from("profiles")
      .update({
        academic_level: academicLevel,
        department: department,
        faculty: faculty,
        institution: institution,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating academic profile:", error);
      throw new Error(`Failed to update academic profile: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating academic profile:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getAcademicSessions() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("academic_sessions")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching academic sessions:", error);
      throw new Error(`Failed to fetch academic sessions: ${error.message}`);
    }

    return { success: true, sessions: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching academic sessions:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createAcademicSession(
  sessionName: string,
  startDate: string,
  endDate: string,
  semester: string = "Semester I",
  isActive: boolean = false
) {
  const supabase = await createClient();

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await (supabase.auth as any).getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Could not verify user permissions");
    }

    if (profileData.role !== "admin" && profileData.role !== "staff") {
      throw new Error("Only admins and staff can create academic sessions");
    }

    // Create the academic session
    const { data, error } = await supabase
      .from("academic_sessions")
      .insert([
        {
          session_name: sessionName,
          start_date: startDate,
          end_date: endDate,
          semester: semester,
          is_active: isActive,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating academic session:", error);
      throw new Error(`Failed to create academic session: ${error.message}`);
    }

    return { success: true, session: data };
  } catch (error) {
    console.error("Unexpected error creating academic session:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateAcademicSession(
  sessionId: string,
  sessionName?: string,
  startDate?: string,
  endDate?: string,
  semester?: string,
  isActive?: boolean
) {
  const supabase = await createClient();

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await (supabase.auth as any).getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Could not verify user permissions");
    }

    if (profileData.role !== "admin" && profileData.role !== "staff") {
      throw new Error("Only admins and staff can update academic sessions");
    }

    // Prepare update object with only provided values
    const updateObj: any = {};
    if (sessionName !== undefined) updateObj.session_name = sessionName;
    if (startDate !== undefined) updateObj.start_date = startDate;
    if (endDate !== undefined) updateObj.end_date = endDate;
    if (semester !== undefined) updateObj.semester = semester;
    if (isActive !== undefined) updateObj.is_active = isActive;

    const { data, error } = await supabase
      .from("academic_sessions")
      .update(updateObj)
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating academic session:", error);
      throw new Error(`Failed to update academic session: ${error.message}`);
    }

    return { success: true, session: data };
  } catch (error) {
    console.error("Unexpected error updating academic session:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteAcademicSession(sessionId: string) {
  const supabase = await createClient();

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await (supabase.auth as any).getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Could not verify user permissions");
    }

    if (profileData.role !== "admin" && profileData.role !== "staff") {
      throw new Error("Only admins and staff can delete academic sessions");
    }

    const { error } = await supabase
      .from("academic_sessions")
      .delete()
      .eq("id", sessionId);

    if (error) {
      console.error("Error deleting academic session:", error);
      throw new Error(`Failed to delete academic session: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting academic session:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Function to promote all students from one level to the next at the end of a session
export async function promoteStudentsToNextLevel(sessionId: string) {
  const supabase = await createClient();

  try {
    // Check if user is admin
    const {
      data: { user },
    } = await (supabase.auth as any).getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Could not verify user permissions");
    }

    if (profileData.role !== "admin" && profileData.role !== "staff") {
      throw new Error("Only admins and staff can promote students");
    }

    // Update all students to the next academic level
    // Map current level to next level
    const levelMap: Record<string, string> = {
      'student': 'level_100',      // New students start as 'student' and get promoted to level_100
      'level_100': 'level_200',
      'level_200': 'level_300',
      'level_300': 'level_400',
      'level_400': 'alumni'        // Level 400 students become alumni
    };

    // First, get all current students
    const { data: students, error: fetchError } = await supabase
      .from("profiles")
      .select("id, academic_level")
      .not("academic_level", "in", "(\"alumni\")"); // Don't update alumni

    if (fetchError) {
      console.error("Error fetching students:", fetchError);
      throw new Error(`Failed to fetch students: ${fetchError.message}`);
    }

    // Update each student's academic level based on the mapping
    const updates = students.map(student => ({
      id: student.id,
      academic_level: levelMap[student.academic_level] || student.academic_level
    }));

    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert(updates, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (updateError) {
        console.error("Error updating student levels:", updateError);
        throw new Error(`Failed to update student levels: ${updateError.message}`);
      }
    }

    return { success: true, count: updates.length };
  } catch (error) {
    console.error("Unexpected error promoting students:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}