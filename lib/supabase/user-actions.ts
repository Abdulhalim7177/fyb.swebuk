"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-actions";

export async function updateUserProfile(userId: string, fullName: string, role: string, academicLevel?: string, department?: string, faculty?: string, institution?: string, linkedinUrl?: string, githubUrl?: string) {
  // Using createClient from server which should have proper permissions for admin operations
  const supabase = await createClient();

  try {
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

    // Update the profile table with new information
    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateObj)
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw new Error(`Failed to update user profile: ${profileError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteUser(userId: string) {
  // Using createClient from server which should have proper permissions for admin operations
  const supabase = await createClient();

  try {
    // Then delete the auth user using the admin client first to avoid referential integrity issues
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
  // Use the admin client with service role key for admin operations
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

      // Create or update profile record using upsert
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileObj);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
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

export async function getUserRole(userId: string) {
  const supabase = await createClient();

  try {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }

    return profileData?.role || "student";
  } catch (error) {
    console.error("Unexpected error getting user role:", error);
    return null;
  }
}

export async function getUserClusters(userId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("cluster_members")
      .select("clusters(*)")
      .eq("user_id", userId)
      .eq("status", "approved");

    if (error) {
      console.error("Error fetching user clusters:", error);
      return [];
    }

    return data.map((item: any) => item.clusters).filter(Boolean);
  } catch (error) {
    console.error("Unexpected error getting user clusters:", error);
    return [];
  }
}

export async function createStaffMember(email: string, password: string, fullName: string, role: string) {
  // Check permissions using a user client first
  const userClient = await createClient();

  try {
    // Check if the current user has permission to create staff members
    const {
      data: { user },
    } = await (userClient.auth as any).getUser();

    if (!user) {
      throw new Error("No authenticated user found");
    }

    // Verify the current user's role
    const { data: profileData, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching current user role:", profileError);
      throw new Error("Could not verify your permissions");
    }

    const currentUserRole = profileData.role;

    // Determine if user has permission based on their role
    // Admins can create any staff role, staff can create other staff
    const hasPermission =
      currentUserRole === "admin" ||
      (currentUserRole === "staff" && role === "staff");

    if (!hasPermission) {
      throw new Error("You don't have permission to create users with this role");
    }

    // Use the admin client for actual creation (with service role key)
    const adminClient = await createAdminClient();

    // Create user in auth using admin client
    const { data: authData, error: authError } = await (adminClient.auth as any).admin.createUser({
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
      // Create or update profile record using upsert
      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({
          id: authData.user.id,
          full_name: fullName,
          role: role,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Clean up by deleting the auth user if profile creation fails
        await (adminClient.auth as any).admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      return { success: true, userId: authData.user.id };
    } else {
      throw new Error("No user data returned from auth creation");
    }
  } catch (error) {
    console.error("Unexpected error creating staff member:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}