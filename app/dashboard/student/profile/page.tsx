import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UpdateProfileForm from "@/components/update-profile-form";

export default async function StudentProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return <div>User profile not found.</div>;
  }

  let avatarPublicUrl = null;
  if (profileData.avatar_url) {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profileData.avatar_url, 3600);

      if (error) {
        const { data: publicData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(profileData.avatar_url);
        avatarPublicUrl = publicData?.publicUrl || null;
      } else {
        avatarPublicUrl = data?.signedUrl || null;
      }
    } catch (err: any) {
      avatarPublicUrl = null;
    }
  }

  const userRole = profileData.role?.toLowerCase() || user.user_metadata?.role?.toLowerCase() || "student";

  if (userRole !== "student") {
    redirect(`/dashboard/${userRole}`);
  }

  const profileDataWithAvatarUrl = {
    ...profileData,
    avatar_url: avatarPublicUrl || profileData.avatar_url,
  };

  return (
    <div className="w-full px-2 py-4 md:px-6 md:py-8">
      <UpdateProfileForm user={user} profile={profileDataWithAvatarUrl} />
    </div>
  );
}