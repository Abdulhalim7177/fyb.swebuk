"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Student-specific FYP actions
 */

export async function getStudentFYPWithSubmissions() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return null;

  try {
    // Get FYP project
    const { data: fyp, error: fypError } = await supabase
      .from("final_year_projects")
      .select(`
        *,
        github_repo_url,
        progress_percentage,
        supervisor:profiles!supervisor_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("student_id", user.id)
      .single();

    if (fypError && fypError.code !== "PGRST116") {
      console.error("Error fetching FYP:", fypError);
      return null;
    }

    if (!fyp) return null;

    // Get all submissions with version data
    const { data: submissions, error: submissionsError } = await supabase
      .from("fyp_submissions")
      .select(`
        *,
        version_number,
        is_latest_version,
        previous_version_id
      `)
      .eq("fyp_id", fyp.id)
      .order("submitted_at", { ascending: false });

    if (submissionsError) {
      console.error("Error fetching submissions:", submissionsError);
    }

    return {
      ...fyp,
      submissions: submissions || [],
    };
  } catch (error) {
    console.error("Unexpected error fetching student FYP:", error);
    return null;
  }
}

export async function submitFYPDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const fypId = formData.get("fypId") as string;
    const submissionType = formData.get("submissionType") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File;

    if (!fypId || !submissionType || !title) {
      return { success: false, error: "Missing required fields" };
    }

    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    // Upload file if provided
    if (file && file.size > 0) {
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${fypId}/${submissionType}_${timestamp}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("fyp-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("fyp-documents")
        .getPublicUrl(filePath);

      fileUrl = publicUrl;
      fileName = file.name;
      fileSize = file.size;
    }

    // Create submission record
    const { error: insertError } = await supabase.from("fyp_submissions").insert({
      fyp_id: fypId,
      submission_type: submissionType,
      title,
      description: description || null,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      status: "pending",
    });

    if (insertError) throw insertError;

    revalidatePath("/dashboard/student/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error submitting document:", error);
    return { success: false, error: error.message };
  }
}

export async function updateStudentSubmission(
  submissionId: string,
  title: string,
  description: string
) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const { error } = await supabase
      .from("fyp_submissions")
      .update({
        title,
        description,
      })
      .eq("id", submissionId)
      .eq("status", "pending"); // Only allow updating pending submissions

    if (error) throw error;

    revalidatePath("/dashboard/student/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating submission:", error);
    return { success: false, error: error.message };
  }
}

export async function updateGithubRepo(fypId: string, githubRepoUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  try {
    // Verify ownership
    const { data: fyp } = await supabase
      .from("final_year_projects")
      .select("student_id")
      .eq("id", fypId)
      .single();

    if (fyp?.student_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update GitHub URL
    const { error } = await supabase
      .from("final_year_projects")
      .update({ github_repo_url: githubRepoUrl })
      .eq("id", fypId);

    if (error) throw error;

    revalidatePath("/dashboard/student/fyp");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating GitHub repo:", error);
    return { success: false, error: error.message };
  }
}
