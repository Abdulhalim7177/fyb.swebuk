import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UpdateProfileForm from "@/components/update-profile-form";
import { Briefcase } from "lucide-react";

export default async function StaffProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch role from profiles table
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return <div>User profile not found.</div>;
  }

  // Generate URL for avatar server-side
  let avatarPublicUrl = null;
  if (profileData.avatar_url) {
    try {
      const { data: urlData, error: urlError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profileData.avatar_url, 3600);

      if (urlError) {
        console.error("Error creating signed URL:", urlError);
        const { data: publicData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(profileData.avatar_url);
        avatarPublicUrl = publicData?.publicUrl || null;
      } else {
        avatarPublicUrl = urlData?.signedUrl || null;
      }
    } catch (err: any) {
      console.error("Unexpected error creating signed URL:", err);
      try {
        const { data: publicData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(profileData.avatar_url);
        avatarPublicUrl = publicData?.publicUrl || null;
      } catch (publicUrlError: any) {
        console.error("Error getting public URL:", publicUrlError);
        avatarPublicUrl = null;
      }
    }
  }

  // Verify user has staff role
  const userRole = profileData.role?.toLowerCase() || user.user_metadata?.role?.toLowerCase() || "student";

  if (userRole !== "staff") {
    redirect(`/dashboard/${userRole}`);
  }

  // Pass avatar URL to client component
  const profileDataWithAvatarUrl = {
    ...profileData,
    avatar_url: avatarPublicUrl || profileData.avatar_url,
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center min-h-screen bg-gradient-to-br from-background via-blue-50/20 to-background dark:via-blue-950/20">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Staff Profile</h1>
              <p className="text-white/80 text-sm mt-1">
                Manage your professional information and expertise
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <UpdateProfileForm user={user} profile={profileDataWithAvatarUrl} />
      </div>
    </div>
  );
}
