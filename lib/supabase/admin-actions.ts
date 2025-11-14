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

export async function updateUserProfile(userId: string, fullName: string, role: string) {
  const supabase = await createAdminClient();

  try {
    // Update the auth user's metadata
    const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: { role: role, full_name: fullName },
      }
    );

    if (authError) {
      console.error("Error updating auth user:", authError);
      throw new Error(`Failed to update auth user: ${authError.message}`);
    }

    // Update the public profile table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role: role,
      })
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
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
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
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

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

export async function createUser(email: string, password: string, fullName: string, role: string) {
  const supabase = await createAdminClient();

  try {
    // Create user in auth using admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      emailConfirm: true, // Automatically confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (authData.user) {
      // Use upsert to insert or update the profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          full_name: fullName,
          role: role,
        });

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