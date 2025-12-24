import { createClient } from "@/lib/supabase/server";

export async function getStudentDashboardStats(userId: string) {
  const supabase = await createClient();

  try {
    // Get user's clusters count
    const { count: clustersCount } = await supabase
      .from("cluster_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved");

    // Get user's active projects count (owned + member of)
    const { count: ownedProjectsCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "active");

    const { count: memberProjectsCount } = await supabase
      .from("project_members")
      .select("project:projects!inner(*)", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved")
      .eq("project.status", "active");

    const activeProjects = (ownedProjectsCount || 0) + (memberProjectsCount || 0);

    // Get upcoming events (placeholder for now - will be implemented in event system)
    const upcomingEvents = 0;

    // Get total project contributions (total projects user is part of)
    const { count: totalContributions } = await supabase
      .from("project_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved");

    return {
      myClubs: clustersCount || 0,
      activeProjects,
      upcomingEvents,
      contributions: totalContributions || 0,
    };
  } catch (error) {
    console.error("Error fetching student dashboard stats:", error);
    return {
      myClubs: 0,
      activeProjects: 0,
      upcomingEvents: 0,
      contributions: 0,
    };
  }
}

export async function getRecentProjects(userId: string, limit: number = 3) {
  const supabase = await createClient();

  try {
    // Get projects user owns or is a member of
    const { data: ownedProjects, error: ownedError } = await supabase
      .from("detailed_projects")
      .select("*")
      .eq("owner_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (ownedError) throw ownedError;

    // If we need more projects, get ones they're members of
    const remainingLimit = limit - (ownedProjects?.length || 0);
    let memberProjects: any[] = [];

    if (remainingLimit > 0) {
      const { data: memberData, error: memberError } = await supabase
        .from("project_members")
        .select("project:projects!inner(*)")
        .eq("user_id", userId)
        .eq("status", "approved")
        .eq("project.status", "active")
        .order("joined_at", { ascending: false })
        .limit(remainingLimit * 2); // Get more to account for potential duplicates

      if (!memberError && memberData) {
        memberProjects = memberData.map((item: any) => item.project);
      }
    }

    // Combine and remove duplicates based on project ID
    const ownedProjectIds = new Set((ownedProjects || []).map(p => p.id));
    const uniqueMemberProjects = memberProjects.filter(p => !ownedProjectIds.has(p.id));

    const allProjects = [...(ownedProjects || []), ...uniqueMemberProjects].slice(0, limit);

    return allProjects.map((project) => ({
      id: project.id,
      title: project.name,
      description: project.description,
      tags: project.tags?.slice(0, 3) || [],
      type: project.type,
      cluster_name: project.cluster_name,
    }));
  } catch (error) {
    console.error("Error fetching recent projects:", error);
    return [];
  }
}

export async function getPopularClusters(limit: number = 4) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("detailed_clusters")
      .select("*")
      .eq("status", "active")
      .order("members_count", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching popular clusters:", error);
    return [];
  }
}

export async function getFeaturedProjects(limit: number = 6) {
  const supabase = await createClient();

  try {
    // Get public projects with most members, excluding private ones
    const { data, error } = await supabase
      .from("detailed_projects")
      .select("*")
      .eq("visibility", "public")
      .eq("status", "active")
      .order("members_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    return [];
  }
}

export async function getUserMemberProjects(userId: string, limit: number = 6) {
  const supabase = await createClient();

  try {
    // First get the project IDs where user is a member using service role to avoid RLS recursion
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (!user) return [];

    // Query project_members first (this should work with RLS)
    const { data: memberData, error: memberError } = await supabase
      .rpc('get_user_member_project_ids', { user_id_param: userId });

    if (memberError) {
      // Fallback: try querying detailed_projects directly
      console.log('RPC not available, using fallback method');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("detailed_projects")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit * 3);

      if (fallbackError) throw fallbackError;

      // Filter manually for projects where user is involved
      return (fallbackData || []).slice(0, limit);
    }

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const projectIds = memberData.map((m: any) => m.project_id);

    // Now get project details for these IDs
    const { data, error } = await supabase
      .from("detailed_projects")
      .select("*")
      .in("id", projectIds)
      .neq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching user member projects:", error);
    return [];
  }
}

/**
 * Get all projects accessible to a user based on:
 * - Projects they own
 * - Projects they are members of
 * - Cluster projects (if they are a member of the cluster)
 * - Public projects
 * - Staff/Admin can see all projects
 */
export async function getAccessibleProjects(userId: string, options: {
  limit?: number;
  offset?: number;
  filterType?: string;
  filterStatus?: string;
  filterClusterId?: string;
  filterVisibility?: string;
  searchTerm?: string;
} = {}) {
  const supabase = await createClient();

  try {
    const {
      limit = 100,
      offset = 0,
      filterType,
      filterStatus,
      filterClusterId,
      filterVisibility,
      searchTerm
    } = options;

    const { data, error } = await supabase
      .rpc('get_accessible_projects', {
        user_id_param: userId,
        filter_type: filterType !== 'all' && filterType ? filterType : null,
        filter_status: filterStatus !== 'all' && filterStatus ? filterStatus : null,
        filter_cluster_id: filterClusterId !== 'all' && filterClusterId ? filterClusterId : null,
        filter_visibility: filterVisibility !== 'all' && filterVisibility ? filterVisibility : null,
        search_term: searchTerm || null,
        limit_count: limit,
        offset_count: offset
      });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching accessible projects:", error);
    return [];
  }
}

/**
 * Get cluster projects accessible to a user based on cluster membership
 */
export async function getClusterProjectsForUser(userId: string, limit: number = 10) {
  const supabase = await createClient();

  try {
    // Use the new RPC to get cluster projects where user is a cluster member
    const { data, error } = await supabase
      .rpc('get_accessible_projects', {
        user_id_param: userId,
        filter_type: 'cluster',
        limit_count: limit
      });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching cluster projects for user:", error);
    return [];
  }
}

/**
 * Check if a user can access a specific project
 * Returns true if user is owner, member, or cluster member (for cluster projects)
 */
export async function canUserAccessProject(userId: string, projectId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Check if user is owner
    const { data: project } = await supabase
      .from("projects")
      .select("owner_id, type, visibility, cluster_id")
      .eq("id", projectId)
      .single();

    if (!project) return false;

    // Owner can always access
    if (project.owner_id === userId) return true;

    // Public projects can be accessed by anyone
    if (project.visibility === "public") return true;

    // Check if user is a project member
    const { data: memberData } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("status", "approved")
      .single();

    if (memberData) return true;

    // Check if user is a cluster member (for cluster projects)
    if (project.type === "cluster" && project.cluster_id) {
      const { data: clusterMemberData } = await supabase
        .from("cluster_members")
        .select("id")
        .eq("cluster_id", project.cluster_id)
        .eq("user_id", userId)
        .eq("status", "approved")
        .single();

      if (clusterMemberData) return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking project access:", error);
    return false;
  }
}
