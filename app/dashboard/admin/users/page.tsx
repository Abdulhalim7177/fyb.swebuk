import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminUsersClientWrapper from "./admin-users-client-wrapper";
import { createAdminClient } from "@/lib/supabase/admin-actions";
import { User } from "@supabase/supabase-js";

// Define a more comprehensive user type for our page
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  academic_level: string | null;
  department: string | null;
  faculty: string | null;
  institution: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  created_at: string;
  email_confirmed_at: string | null | undefined;
  avatar_url?: string | null;
}

export default async function UsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return redirect("/");
  }

  // Use admin client to fetch all users from auth.users
  const adminSupabase = await createAdminClient();
  const { data: authUsersResponse, error: authUsersError } = await adminSupabase.auth.admin.listUsers();

  if (authUsersError) {
    console.error("Error fetching auth users:", authUsersError);
    // Handle error appropriately
    return <div>Error loading users.</div>;
  }

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*");

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return <div>Error loading profiles.</div>;
  }

  // Create a map of profiles for easy lookup
  const profilesMap = new Map(profiles.map(p => [p.id, p]));

  // Combine auth users with their profiles, filtering out staff members (handled in staff management)
  const combinedUsers: UserProfile[] = authUsersResponse.users
    .filter((authUser: User) => {
      const userProfile = profilesMap.get(authUser.id);
      // Only include non-staff users in student management
      return userProfile?.role !== "staff" && userProfile?.role !== "admin";
    })
    .map((authUser: User) => {
      const userProfile = profilesMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email || "No email",
        full_name: userProfile?.full_name || authUser.user_metadata?.full_name || "No name",
        role: userProfile?.role || "student",
        academic_level: userProfile?.academic_level || "student",
        department: userProfile?.department || "Software Engineering",
        faculty: userProfile?.faculty || "Faculty of Computing",
        institution: userProfile?.institution || "Bayero University",
        linkedin_url: userProfile?.linkedin_url || null,
        github_url: userProfile?.github_url || null,
        created_at: authUser.created_at,
        email_confirmed_at: authUser.email_confirmed_at,
        avatar_url: userProfile?.avatar_url || null,
      };
    });

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="flex-1 flex flex-col gap-6 w-full max-w-6xl px-3 py-6">
        <main>
          <AdminUsersClientWrapper
            initialProfiles={combinedUsers || []}
            currentUserRole={profile.role}
          />
        </main>
      </div>
    </div>
  );
}
