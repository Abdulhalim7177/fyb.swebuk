import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PublicPortfolioView from "@/components/public-portfolio-view";

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const supabase = await createClient();
  const { userId } = await params;

  // Get current logged-in user (if any)
  const {
    data: { user: currentUser },
  } = await (supabase.auth as any).getUser();

  // Fetch the profile of the user whose portfolio we're viewing
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profileData) {
    console.error("Error fetching profile or profile not found:", profileError);
    return notFound();
  }

  // Fetch user projects (only public projects or if user is viewing their own profile)
  const isOwnProfile = currentUser?.id === userId;

  let projectsQuery = supabase
    .from("projects")
    .select(`
      id,
      name,
      description,
      type,
      visibility,
      status,
      created_at,
      updated_at,
      owner_id,
      cluster_id,
      repository_url,
      demo_url,
      project_tags (tag)
    `)
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  // If not viewing own profile, only show public projects
  if (!isOwnProfile) {
    projectsQuery = projectsQuery.eq("visibility", "public");
  }

  const { data: ownedProjects } = await projectsQuery;

  // Fetch member projects
  const { data: memberProjectIds } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId)
    .eq("status", "approved");

  const projectIds = memberProjectIds?.map((mp: any) => mp.project_id) || [];
  let memberProjects: any[] = [];

  if (projectIds.length > 0) {
    let memberProjectsQuery = supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        type,
        visibility,
        status,
        created_at,
        updated_at,
        owner_id,
        cluster_id,
        repository_url,
        demo_url,
        project_tags (tag)
      `)
      .in("id", projectIds)
      .order("updated_at", { ascending: false });

    // If not viewing own profile, only show public projects
    if (!isOwnProfile) {
      memberProjectsQuery = memberProjectsQuery.eq("visibility", "public");
    }

    const { data: projectsData } = await memberProjectsQuery;
    memberProjects = projectsData || [];
  }

  // Combine projects
  let allProjects: any[] = [];
  if (ownedProjects) allProjects = [...ownedProjects];
  if (memberProjects) {
    const uniqueMemberProjects = memberProjects.filter(
      (memberProj) =>
        !ownedProjects?.some((ownedProj) => ownedProj.id === memberProj.id)
    );
    allProjects = [...allProjects, ...uniqueMemberProjects];
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

  // Fetch email from auth.users table
  const { data: authUser } = await (supabase.auth as any).admin.getUserById(userId);

  // Pass avatar URL and email to client component
  const profileDataWithAvatarUrl = {
    ...profileData,
    avatar_url: avatarPublicUrl || profileData.avatar_url,
    email: authUser?.user?.email || profileData.email, // Add email from auth
  };

  return (
    <PublicPortfolioView
      profile={profileDataWithAvatarUrl}
      projects={allProjects}
      isOwnProfile={isOwnProfile}
      currentUserId={currentUser?.id}
    />
  );
}
