"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GitBranch,
  ExternalLink,
  Eye,
  Lock,
  FolderGit2,
  Calendar
} from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  status: string;
  owner_name: string;
  owner_email: string;
  owner_avatar: string;
  cluster_name: string | null;
  members_count: number;
  tags: string[] | null;
  repository_url: string | null;
  demo_url: string | null;
  created_at: string;
}

interface Member {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface ProjectGridProps {
  searchTerm?: string;
  filterType?: string;
  filterStatus?: string;
  filterCluster?: string;
  filterVisibility?: string;
  clusterId?: string;
  userId?: string;
  showMyProjects?: boolean;
}

export function ProjectGrid({
  searchTerm = "",
  filterType = "all",
  filterStatus = "all",
  filterCluster = "all",
  filterVisibility = "all",
  clusterId,
  userId,
  showMyProjects = false,
}: ProjectGridProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMembers, setProjectMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [searchTerm, filterType, filterStatus, filterCluster, filterVisibility, clusterId, userId, showMyProjects]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("detailed_projects")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by cluster
      if (clusterId) {
        query = query.eq("cluster_id", clusterId);
      }

      // Filter by user's projects (owner OR member)
      if (showMyProjects && userId) {
        // Get projects where user is owner
        const { data: ownedProjects } = await supabase
          .from("detailed_projects")
          .select("id")
          .eq("owner_id", userId);

        // Get projects where user is a member
        const { data: memberProjects } = await supabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", userId)
          .eq("status", "approved");

        const projectIds = [
          ...(ownedProjects?.map(p => p.id) || []),
          ...(memberProjects?.map(p => p.project_id) || [])
        ];

        if (projectIds.length === 0) {
          // User has no projects, return empty
          setProjects([]);
          setLoading(false);
          return;
        }

        query = query.in("id", projectIds);
      }

      // Filter by type
      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }

      // Filter by status
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      // Filter by cluster
      if (filterCluster !== "all") {
        query = query.eq("cluster_id", filterCluster);
      }

      // Filter by visibility
      if (filterVisibility !== "all") {
        query = query.eq("visibility", filterVisibility);
      } else if (!showMyProjects) {
        // In "All Projects" view, only show public projects unless user is admin
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        const userRole = profileData?.role;
        if (userRole !== 'admin') {
          query = query.eq("visibility", "public");
        }
      }

      // Enhanced Search - includes name, description, owner name, owner email, and academic level
      if (searchTerm) {
        // Search across multiple fields including academic level
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,owner_name.ilike.%${searchTerm}%,owner_email.ilike.%${searchTerm}%,owner_academic_level.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects(data || []);

      // Fetch members for each project
      if (data && data.length > 0) {
        const membersMap: Record<string, Member[]> = {};

        for (const project of data) {
          const { data: members } = await supabase
            .from("detailed_project_members")
            .select("user_id, full_name, avatar_url")
            .eq("project_id", project.id)
            .eq("status", "approved")
            .limit(5);

          membersMap[project.id] = members || [];
        }

        setProjectMembers(membersMap);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
      const errorMessage = error?.message || error?.toString() || "An unknown error occurred";
      console.error("Detailed error:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl bg-card border border-border p-6 animate-pulse">
            <div className="h-6 w-3/4 bg-muted rounded mb-4" />
            <div className="h-4 w-full bg-muted rounded mb-2" />
            <div className="h-20 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 rounded-2xl bg-card border border-border">
        <FolderGit2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold text-foreground">No projects found</h3>
        <p className="text-muted-foreground mt-2">
          {searchTerm
            ? "Try adjusting your search or filters"
            : "No projects have been created yet"}
        </p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    return type === "cluster"
      ? "bg-gradient-to-br from-blue-500 to-blue-600"
      : "bg-gradient-to-br from-purple-500 to-purple-600";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "on_hold":
        return "bg-amber-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const MemberAvatars = ({ projectId }: { projectId: string }) => {
    const members = projectMembers[projectId] || [];
    const displayMembers = members.slice(0, 4);
    const remainingCount = members.length - 4;

    if (members.length === 0) return null;

    return (
      <div className="flex items-center -space-x-2">
        {displayMembers.map((member, index) => (
          <Avatar
            key={member.user_id}
            className="h-8 w-8 border-2 border-background hover:z-10 transition-transform hover:scale-110"
            style={{ zIndex: displayMembers.length - index }}
          >
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              {member.full_name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        ))}
        {remainingCount > 0 && (
          <div className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div key={project.id} className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:shadow-md hover:border-primary/50 transition-all duration-300 hover:scale-105 flex flex-col">
          <div className={`absolute top-0 left-0 right-0 h-1 ${project.type === "cluster" ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-violet-500 to-purple-500"}`} />

          <div className="p-6 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(project.status)}`} />
                  <h3 className="text-lg font-bold text-foreground truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-200">{project.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5 border border-border">
                    <AvatarImage src={project.owner_avatar} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                      {project.owner_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">{project.owner_name}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {project.visibility === "private" ? (
                  <Lock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                ) : (
                  <Eye className="h-4 w-4 text-green-500 dark:text-green-400" />
                )}
              </div>
            </div>
          </div>

          <div className="px-6 flex-1">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {project.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${project.type === "cluster" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30" : "bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/30"}`}>
                {project.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                project.status === "active" ? "bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30" :
                project.status === "completed" ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30" :
                project.status === "on_hold" ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30" :
                "bg-gray-500/20 text-gray-600 dark:text-gray-300 border border-gray-500/30"
              }`}>
                {project.status.replace("_", " ")}
              </span>
              {project.cluster_name && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                  {project.cluster_name}
                </span>
              )}
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-300"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{project.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Meta info with Member Avatars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                  <span>{project.members_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <MemberAvatars projectId={project.id} />
            </div>
          </div>

          <div className="flex gap-2 p-6 pt-4 border-t border-border">
            <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
              <button className="w-full px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-medium transition-all duration-200 hover:scale-105 text-sm">
                View Details
              </button>
            </Link>
            {project.repository_url && (
              <a
                href={project.repository_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-300 transition-all duration-200 hover:scale-105"
              >
                <GitBranch className="h-4 w-4" />
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300 transition-all duration-200 hover:scale-105"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
