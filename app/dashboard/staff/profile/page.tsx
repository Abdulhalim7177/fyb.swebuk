import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UpdateProfileForm from "@/components/update-profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function StaffProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch role from profiles table instead of user metadata
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return <div>User profile not found.</div>;
  }

  // Generate the URL for the avatar server-side (works better for local Supabase)
  let avatarPublicUrl = null;
  if (profileData.avatar_url) {
    try {
      // For local development, we might need to handle the URL differently
      // First, try to create a signed URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profileData.avatar_url, 3600); // 1 hour expiry

      if (urlError) {
        console.error("Error creating signed URL:", urlError);
        // Fallback to public URL
        const { data: publicData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(profileData.avatar_url);
        avatarPublicUrl = publicData?.publicUrl || null;
      } else {
        avatarPublicUrl = urlData?.signedUrl || null;
      }
    } catch (err) {
      console.error("Unexpected error creating signed URL:", err);
      // Fallback to public URL
      const { data: publicData } = await supabase.storage
        .from("avatars")
        .getPublicUrl(profileData.avatar_url);
      avatarPublicUrl = publicData?.publicUrl || null;
    }
  }

  // Verify user has staff role
  const userRole = profileData.role?.toLowerCase() || user.user_metadata?.role?.toLowerCase() || "student";
  
  if (userRole !== "staff") {
    // Redirect to their correct dashboard if they don't have the right role
    redirect(`/dashboard/${userRole}`);
  }

  // Pass the avatar URL to the client component
  const profileDataWithAvatarUrl = {
    ...profileData,
    avatar_url: avatarPublicUrl || profileData.avatar_url,
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-12 items-center">
      <div className="w-full max-w-4xl mx-auto">
        <div className="py-6 font-bold text-center bg-[oklch(92.2% 0 0)]/[0.7] backdrop-blur-sm border-b border-border">
          Staff Profile Settings
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8 max-w-4xl px-3 w-full">
        <main className="flex-1 flex flex-col gap-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl">Edit Profile</CardTitle>
              <CardDescription>
                Update your profile information below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpdateProfileForm user={user} profile={profileDataWithAvatarUrl} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}