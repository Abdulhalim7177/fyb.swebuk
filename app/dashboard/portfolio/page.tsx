import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PortfolioPageWrapper from "@/components/portfolio-page-wrapper";

export default async function PortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await (supabase.auth as any).getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    console.error('Error fetching profile or profile not found:', profileError);
    return <div>User profile not found.</div>;
  }

  // Fetch user projects
  const { data: ownedProjects } = await supabase
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
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  // Fetch member projects
  const { data: memberProjectIds } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("status", "approved");

  const projectIds = memberProjectIds?.map((mp: any) => mp.project_id) || [];
  let memberProjects: any[] = [];

  if (projectIds.length > 0) {
    const { data: projectsData } = await supabase
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
    memberProjects = projectsData || [];
  }

  // Combine projects
  let allProjects: any[] = [];
  if (ownedProjects) allProjects = [...ownedProjects];
  if (memberProjects) {
    const uniqueMemberProjects = memberProjects.filter(memberProj =>
      !ownedProjects?.some(ownedProj => ownedProj.id === memberProj.id)
    );
    allProjects = [...allProjects, ...uniqueMemberProjects];
  }

  // Format academic level
  const formatAcademicLevel = (level: string | undefined) => {
    if (!level) return "Professional";
    switch(level) {
      case 'level_100': return 'Level 100';
      case 'level_200': return 'Level 200';
      case 'level_300': return 'Level 300';
      case 'level_400': return 'Level 400';
      case 'alumni': return 'Alumni';
      default: return level.charAt(0).toUpperCase() + level.slice(1);
    }
  };

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

  // Pass avatar URL and email to client component
  const profileDataWithAvatarUrl = {
    ...profileData,
    avatar_url: avatarPublicUrl || profileData.avatar_url,
    email: user.email, // Add email from auth
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden">
      <div className="relative min-h-screen w-full pt-8 pb-12">
        <PortfolioPageWrapper
          profile={profileDataWithAvatarUrl}
          projects={allProjects}
          editProfileUrl={`/dashboard/${profileData.role?.toLowerCase() || "student"}/profile`}
        />
      </div>
    </div>
  );
}