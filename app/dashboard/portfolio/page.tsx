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

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData) {
    return <div>User profile not found.</div>;
  }

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

  let allProjects: any[] = [];
  if (ownedProjects) allProjects = [...ownedProjects];
  if (memberProjects) {
    const uniqueMemberProjects = memberProjects.filter(memberProj =>
      !ownedProjects?.some(ownedProj => ownedProj.id === memberProj.id)
    );
    allProjects = [...allProjects, ...uniqueMemberProjects];
  }

  let avatarPublicUrl = null;
  if (profileData.avatar_url) {
    try {
      const { data: urlData, error: urlError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profileData.avatar_url, 3600);

      if (urlError) {
        const { data: publicData } = await supabase.storage
          .from("avatars")
          .getPublicUrl(profileData.avatar_url);
        avatarPublicUrl = publicData?.publicUrl || null;
      } else {
        avatarPublicUrl = urlData?.signedUrl || null;
      }
    } catch (err: any) {
      avatarPublicUrl = null;
    }
  }

  const profileDataWithAvatarUrl = {
    ...profileData,
    avatar_url: avatarPublicUrl || profileData.avatar_url,
    email: user.email,
  };

  return (
    <div className="w-full px-2 py-4 md:px-6 md:py-8">
      <PortfolioPageWrapper
        profile={profileDataWithAvatarUrl}
        projects={allProjects}
        editProfileUrl={`/dashboard/${profileData.role?.toLowerCase() || "student"}/profile`}
      />
    </div>
  );
}
