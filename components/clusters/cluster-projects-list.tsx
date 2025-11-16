"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Folder, User, GitBranch } from "lucide-react";
import { toast } from "sonner";

interface ClusterProject {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  owner_name: string;
  cluster_id: string;
  tags: string[];
  members_count: number;
}

interface ClusterProjectsListProps {
  clusterId: string;
  userRole: string;
}

export function ClusterProjectsList({ clusterId, userRole }: ClusterProjectsListProps) {
  const [projects, setProjects] = useState<ClusterProject[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Fetch projects associated with this cluster
        const { data, error } = await supabase
          .from("projects")
          .select(`
            id,
            name,
            description,
            status,
            created_at,
            updated_at,
            owner_id,
            profiles!projects_owner_id_fkey (
              full_name
            )
          `)
          .eq("cluster_id", clusterId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching cluster projects:", error);
          // If the projects table doesn't exist, use mock data
          if (error.code === '42P01' || error.message.includes('Could not find the table')) {
            // Use mock data for projects
            const mockProjects: ClusterProject[] = [
              {
                id: '1',
                name: 'Web Development Bootcamp',
                description: 'A project to build a full-stack web application using modern technologies.',
                status: 'active',
                created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                updated_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
                owner_id: 'owner1',
                owner_name: 'System Admin',
                cluster_id: clusterId,
                tags: ['React', 'Node.js', 'PostgreSQL'],
                members_count: 5
              },
              {
                id: '2',
                name: 'Mobile App Development',
                description: 'Developing a cross-platform mobile application using React Native.',
                status: 'active',
                created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                updated_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                owner_id: 'owner2',
                owner_name: 'System Admin',
                cluster_id: clusterId,
                tags: ['React Native', 'Firebase', 'UI/UX'],
                members_count: 3
              }
            ];
            setProjects(mockProjects);
          } else {
            toast.error("Failed to load cluster projects: " + error.message);
          }
          return;
        }

        if (data) {
          // For each project, also fetch the number of members
          const projectsWithMembers = await Promise.all(
            data.map(async (project: any) => {
              // Count project members
              const { count: membersCount, error: memberError } = await supabase
                .from("project_members")
                .select("*", { count: "exact", head: true })
                .eq("project_id", project.id);

              if (memberError) {
                console.error("Error counting members for project:", project.id, memberError);
              }

              return {
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                created_at: project.created_at,
                updated_at: project.updated_at,
                owner_id: project.owner_id,
                owner_name: project.profiles?.full_name || 'Unknown',
                cluster_id: project.cluster_id,
                tags: project.tags || [], // Assuming tags field exists
                members_count: membersCount || 0
              };
            })
          );

          setProjects(projectsWithMembers);
        }
      } catch (error: any) {
        console.error("Error fetching cluster projects:", error);
        console.error("Detailed error:", error.message, error.details, error.hint);
      } finally {
        setLoading(false);
      }
    };

    if (clusterId) {
      fetchProjects();
    }
  }, [clusterId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b bg-muted/30">
        <h3 className="text-lg font-semibold">Cluster Projects</h3>
        <p className="text-sm text-muted-foreground">Projects being worked on by this cluster</p>
      </div>
      <div className="divide-y">
        {projects.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No projects in this cluster yet.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Folder className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">{project.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary">{project.status}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{project.members_count} members</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GitBranch className="h-3 w-3" />
                        <span>Owner: {project.owner_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}