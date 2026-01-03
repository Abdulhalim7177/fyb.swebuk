"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-actions";
import { revalidatePath } from "next/cache";

export interface ProfileUpdateData {
  full_name?: string;
  role?: string;
  academic_level?: string;
  department?: string;
  faculty?: string;
  institution?: string;
  linkedin_url?: string;
  github_url?: string;
  avatar_url?: string;
  bio?: string;
  registration_number?: string;
  staff_number?: string;
  skills?: string[];
  // Student-specific
  specialization?: string;
  gpa?: number;
  academic_standing?: string;
  current_courses?: string[];
  achievements?: string[];
  portfolio_items?: any[];
  interests?: string;
  website_url?: string;
  // Staff-specific
  position?: string;
  office_location?: string;
  office_hours?: string;
  research_interests?: string[];
  department_role?: string;
  qualifications?: string;
}

export async function updateUserProfile(userId: string, data: ProfileUpdateData) {
  const supabase = await createClient();

  try {
    // Remove undefined values
    const updateObj: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateObj[key] = value;
      }
    });

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateObj)
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw new Error(`Failed to update user profile: ${profileError.message}`);
    }

    // Revalidate the user profile page and admin users list
    revalidatePath(`/dashboard/admin/users/${userId}`);
    revalidatePath(`/dashboard/admin/users`);
    revalidatePath(`/portfolio/${userId}`);

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating user:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();

  try {
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
  githubUrl?: string,
  registrationNumber?: string,
  staffNumber?: string,
  bio?: string,
  skills?: string[],
  // Student-specific
  specialization?: string,
  gpa?: number,
  academicStanding?: string,
  interests?: string,
  websiteUrl?: string,
  // Staff-specific
  position?: string,
  officeLocation?: string,
  officeHours?: string,
  departmentRole?: string,
  qualifications?: string
) {
  const supabase = await createAdminClient();

  try {
    const { data: authData, error: authError } = await (supabase.auth as any).admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (authData.user) {
      const profileObj: any = {
        id: authData.user.id,
        full_name: fullName,
        role: role,
      };

      // Add basic fields if provided
      if (academicLevel !== undefined) profileObj.academic_level = academicLevel;
      if (department !== undefined) profileObj.department = department;
      if (faculty !== undefined) profileObj.faculty = faculty;
      if (institution !== undefined) profileObj.institution = institution;
      if (linkedinUrl !== undefined) profileObj.linkedin_url = linkedinUrl;
      if (githubUrl !== undefined) profileObj.github_url = githubUrl;
      if (registrationNumber !== undefined) profileObj.registration_number = registrationNumber;
      if (staffNumber !== undefined) profileObj.staff_number = staffNumber;
      if (bio !== undefined) profileObj.bio = bio;
      if (skills !== undefined) profileObj.skills = skills;

      // Student-specific fields
      if (specialization !== undefined) profileObj.specialization = specialization;
      if (gpa !== undefined) profileObj.gpa = gpa;
      if (academicStanding !== undefined) profileObj.academic_standing = academicStanding;
      if (interests !== undefined) profileObj.interests = interests;
      if (websiteUrl !== undefined) profileObj.website_url = websiteUrl;

      // Staff-specific fields
      if (position !== undefined) profileObj.position = position;
      if (officeLocation !== undefined) profileObj.office_location = officeLocation;
      if (officeHours !== undefined) profileObj.office_hours = officeHours;
      if (departmentRole !== undefined) profileObj.department_role = departmentRole;
      if (qualifications !== undefined) profileObj.qualifications = qualifications;

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

export async function getProfile(userId: string) {
  const supabase = await createClient();

  try {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return profileData;
  } catch (error) {
    console.error("Unexpected error getting profile:", error);
    return null;
  }
}

export async function createStaffMember(
  email: string,
  password: string,
  fullName: string,
  role: string,
  position?: string,
  department?: string,
  officeLocation?: string,
  officeHours?: string,
  departmentRole?: string,
  qualifications?: string,
  linkedinUrl?: string,
  githubUrl?: string,
  bio?: string
) {
  const userClient = await createClient();

  try {
    const {
      data: { user },
    } = await (userClient.auth as any).getUser();

    if (!user) {
      throw new Error("No authenticated user found");
    }

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

    const hasPermission =
      currentUserRole === "admin" ||
      (currentUserRole === "staff" && role === "staff");

    if (!hasPermission) {
      throw new Error("You don't have permission to create users with this role");
    }

    const adminClient = await createAdminClient();

    const { data: authData, error: authError } = await (adminClient.auth as any).admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (authData.user) {
      const profileObj: any = {
        id: authData.user.id,
        full_name: fullName,
        role: role,
      };

      // Add staff-specific fields
      if (position !== undefined) profileObj.position = position;
      if (department !== undefined) profileObj.department = department;
      if (officeLocation !== undefined) profileObj.office_location = officeLocation;
      if (officeHours !== undefined) profileObj.office_hours = officeHours;
      if (departmentRole !== undefined) profileObj.department_role = departmentRole;
      if (qualifications !== undefined) profileObj.qualifications = qualifications;
      if (linkedinUrl !== undefined) profileObj.linkedin_url = linkedinUrl;
      if (githubUrl !== undefined) profileObj.github_url = githubUrl;
      if (bio !== undefined) profileObj.bio = bio;

      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert(profileObj);

      if (profileError) {
        console.error("Error creating profile:", profileError);
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
