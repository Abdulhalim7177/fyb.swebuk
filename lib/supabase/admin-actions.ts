"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Create a separate client for admin operations using the service role key
export async function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

export async function getDetailedClusters() {
  const supabase = await createAdminClient();
  try {
    const { data, error } = await supabase
      .from("detailed_clusters")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching detailed clusters:", error);
      throw new Error(`Failed to fetch detailed clusters: ${error.message}`);
    }
    return { success: true, clusters: data };
  } catch (error) {
    console.error("Unexpected error fetching detailed clusters:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateUserProfile(
  userId: string,
  fullName: string,
  role: string,
  academicLevel?: string,
  department?: string,
  faculty?: string,
  institution?: string,
  linkedinUrl?: string,
  githubUrl?: string
) {
  const supabase = await createAdminClient();

  try {
    // Update the auth user's metadata
    const { data: authUser, error: authError } = await (supabase.auth as any).admin.updateUserById(
      userId,
      {
        user_metadata: { role: role, full_name: fullName },
      }
    );

    if (authError) {
      console.error("Error updating auth user:", authError);
      throw new Error(`Failed to update auth user: ${authError.message}`);
    }

    // Prepare update object with only provided values
    const updateObj: any = {
      full_name: fullName,
      role: role,
    };

    // Add academic fields if they are provided
    if (academicLevel !== undefined) updateObj.academic_level = academicLevel;
    if (department !== undefined) updateObj.department = department;
    if (faculty !== undefined) updateObj.faculty = faculty;
    if (institution !== undefined) updateObj.institution = institution;
    if (linkedinUrl !== undefined) updateObj.linkedin_url = linkedinUrl;
    if (githubUrl !== undefined) updateObj.github_url = githubUrl;

    // Update the public profile table
    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateObj)
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Even if profile update fails, auth was updated, so this is a partial success.
      // Depending on requirements, you might want to handle this differently.
      throw new Error(`Failed to update user profile: ${profileError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function viewUser(userId: string) {
  const supabase = await createAdminClient();

  try {
    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Error fetching user profile:", profileError);
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }

    // Get auth user data (using the auth admin API)
    let authUser = null;
    try {
      const { data: authData, error: authError } = await (supabase.auth as any).admin.getUserById(userId);
      if (!authError && authData) {
        authUser = authData.user;
      }
    } catch (error) {
      console.warn("Could not fetch auth user data:", error);
    }

    return { 
      success: true, 
      user: {
        profile: profile,
        auth: authUser
      }
    };
  } catch (error) {
    console.error("Unexpected error viewing user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteUser(userId: string) {
  const supabase = await createAdminClient();

  try {
    // First delete the profile record to avoid foreign key constraint issues
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      // Continue with auth deletion even if profile deletion failed
      console.warn("Profile deletion failed, but continuing with auth deletion:", profileError);
    }

    // Then delete the auth user using the admin client
    const { error: authError } = await (supabase.auth as any).admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getAdminDashboardMetrics() {
  const supabase = await createAdminClient();

  const { count: totalStudents, error: studentsError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "student");

  const { count: totalStaff, error: staffError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .in("role", ["staff", "admin"]); // Assuming admin is also considered staff for this metric

  const { count: totalClusters, error: clustersError } = await supabase
    .from("clusters")
    .select("*", { count: "exact", head: true });

  if (studentsError) {
    console.error("Error fetching total students:", studentsError);
  }

  if (staffError) {
    console.error("Error fetching total staff:", staffError);
  }

  if (clustersError) {
    console.error("Error fetching total clusters:", clustersError);
  }

  return {
    totalStudents: totalStudents ?? 0,
    totalStaff: totalStaff ?? 0,
    totalClusters: totalClusters ?? 0,
  };
}

export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: string,
  academicLevel?: string,
  department?: string,
  faculty?: string,
  institution?: string,
  linkedinUrl?: string,
  githubUrl?: string
) {
  const supabase = await createAdminClient();

  try {
    // Create user in auth using admin client
    const { data: authData, error: authError } = await (supabase.auth as any).admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Automatically confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (authData.user) {
      // Prepare profile object with all fields
      const profileObj: any = {
        id: authData.user.id,
        full_name: fullName,
        role: role,
      };

      // Add academic fields if they are provided
      if (academicLevel !== undefined) profileObj.academic_level = academicLevel;
      if (department !== undefined) profileObj.department = department;
      if (faculty !== undefined) profileObj.faculty = faculty;
      if (institution !== undefined) profileObj.institution = institution;
      if (linkedinUrl !== undefined) profileObj.linkedin_url = linkedinUrl;
      if (githubUrl !== undefined) profileObj.github_url = githubUrl;

      // Use upsert to insert or update the profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileObj);

      if (profileError) {
        console.error("Error creating/updating profile:", profileError);
        throw new Error(`Failed to create/update user profile: ${profileError.message}`);
      }

      return { success: true, userId: authData.user.id };
    } else {
      throw new Error("No user data returned from auth creation");
    }
  } catch (error) {
    console.error("Unexpected error creating user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}