import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileDisplayWrapper from "@/components/profile-display-wrapper";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch full profile data
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return redirect("/auth/login");
  }

  // Generate URL for avatar server-side
  let avatarPublicUrl = null;
  if (profileData.avatar_url) {
    if (profileData.avatar_url.startsWith('http')) {
      avatarPublicUrl = profileData.avatar_url;
    } else {
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
  }

  // Pass avatar URL to client component
  const profileDataWithAvatarUrl = {
    ...profileData,
    avatar_url: avatarPublicUrl || profileData.avatar_url,
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden">
      <div className="relative min-h-screen w-full pt-8 pb-12">
        <ProfileDisplayWrapper
          profile={profileDataWithAvatarUrl}
          editProfileUrl={`/dashboard/${profileData.role?.toLowerCase() || "student"}/profile`}
        />
      </div>
    </div>
  );
}
