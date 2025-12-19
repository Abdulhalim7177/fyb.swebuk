import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StaffClientWrapper from "./staff-client-wrapper";
import { createAdminClient } from "@/lib/supabase/admin-actions";

// Define a more comprehensive user type for our page
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  email_confirmed_at: string | null | undefined;
  avatar_url?: string | null;
  academic_level?: string | null;
  department?: string | null;
  faculty?: string | null;
  institution?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
}

export default async function StaffManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    // Only admins can manage staff
    return redirect("/");
  }

  // Use admin client to fetch all users from auth.users
  const adminSupabase = await createAdminClient();
  const { data: authUsersResponse, error: authUsersError } = await (adminSupabase.auth as any).admin.listUsers();

  if (authUsersError) {
    console.error("Error fetching auth users:", authUsersError);
    // Handle error appropriately
    return <div>Error loading users.</div>;
  }

  // Fetch all profiles for staff members only
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "staff");

  if (profilesError) {
    console.error("Error fetching staff profiles:", profilesError);
    return <div>Error loading staff profiles.</div>;
  }

  // Create a map of profiles for easy lookup
  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  // Combine auth users with their profiles (only for staff members)
  const staffUsers: UserProfile[] = authUsersResponse.users
    .filter(authUser => profilesMap.has(authUser.id))  // Only staff members
    .map((authUser: any) => {
      const userProfile = profilesMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email || "No email",
        full_name: userProfile?.full_name || authUser.user_metadata?.full_name || "No name",
        role: userProfile?.role || "staff",
        created_at: authUser.created_at,
        email_confirmed_at: authUser.email_confirmed_at || null,
        avatar_url: userProfile?.avatar_url || null,
        academic_level: userProfile?.academic_level || null,
        department: userProfile?.department || null,
        faculty: userProfile?.faculty || null,
        institution: userProfile?.institution || null,
        linkedin_url: userProfile?.linkedin_url || null,
        github_url: userProfile?.github_url || null,
      };
    });

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="flex-1 flex flex-col gap-6 w-full max-w-6xl px-3 py-6">
        <main>
          <StaffClientWrapper
            initialProfiles={staffUsers || []}
            currentUserRole={profile.role}
          />
        </main>
      </div>
    </div>
  );
}
