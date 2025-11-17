import { createClient } from "./client";

// Type definitions for our schema
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  academic_level: string | null;
  department: string | null;
  faculty: string | null;
  institution: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

// Updated table types to include new fields
export interface Tables {
  profiles: Profile;
  cluster_members: {
    id: string;
    cluster_id: string;
    user_id: string;
    role: string;
    status: string;
    joined_at: string;
    approved_at: string | null;
  };
  clusters: {
    id: string;
    name: string;
    description: string;
    lead_id: string | null;
    deputy_id: string | null;
    staff_manager_id: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
  };
  academic_sessions: {
    id: string;
    session_name: string;
    start_date: string;
    end_date: string;
    semester: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Utility function to get a properly formatted storage URL for an avatar
 * that works both in local development and production
 */
export async function getStorageUrl(
  bucketName: string,
  filePath: string,
  isSigned: boolean = true,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url: string | null; error: any }> {
  try {
    const supabase = createClient();

    if (isSigned) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return { url: null, error };
      }

      return { url: data?.signedUrl || null, error: null };
    } else {
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return { url: data?.publicUrl || null, error: null };
    }
  } catch (err) {
    console.error('Unexpected error getting storage URL:', err);
    return { url: null, error: err };
  }
}