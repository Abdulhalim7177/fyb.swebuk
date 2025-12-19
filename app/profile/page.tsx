import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch role from profiles table to determine where to redirect
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role, academic_level")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return redirect("/auth/login");
  }

  const userRole = profileData.role?.toLowerCase() || "student";

  // Redirect to the role-specific profile page
  redirect(`/dashboard/${userRole}/profile`);
}
