"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateUserProfile(userId: string, fullName: string, role: string) {
  // Using createClient from server which should have proper permissions for admin operations
  const supabase = await createClient();

  try {
    // Update the profile table with new information
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role: role,
        updated_at: new Date().toISOString(),
      })
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
  // Using createClient from server which should have proper permissions for admin operations
  const supabase = await createClient();

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
      // Create profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: role,
          updated_at: new Date().toISOString(),
        });

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