"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, FileText, Calendar, Users2, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface LeadDashboardProps {
  user: any;
  fullName?: string; // Pass full name from profile
}

interface Cluster {
  id: string;
  name: string;
  members_count: number;
}

interface Request {
  id: string;
  user_id: string;
  user_name: string;
  cluster_id: string;
  cluster_name: string;
  created_at: string;
}

export function LeadDashboard({ user, fullName }: LeadDashboardProps) {
  const [leadMetrics, setLeadMetrics] = useState({
    clusterMembers: 0,
    pendingApplications: 0,
    activeProjects: 0,
    upcomingEvents: 0,
  });

  const [myClusters, setMyClusters] = useState<Cluster[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const fetchLeadData = async () => {
      if (!user?.id) return;

      // Fetch user clusters where they are lead
      const { data: userClusters, error: clustersError } = await supabase
        .from('clusters')
        .select('id, name')
        .eq('lead_id', user.id);

      if (clustersError) {
        console.error('Error fetching user clusters:', clustersError);
      } else if (userClusters) {
        // Initialize clusters with members_count as 0
        const clustersWithCounts = userClusters.map(cluster => ({
          ...cluster,
          members_count: 0
        }));
        setMyClusters(clustersWithCounts);

        // Get cluster IDs to fetch related data
        const clusterIds = userClusters.map(cluster => cluster.id);

        if (clusterIds.length > 0) {
          // Fetch member counts for each cluster
          const { count: totalMembers, error: membersError } = await supabase
            .from('cluster_members')
            .select('*', { count: 'exact', head: true })
            .in('cluster_id', clusterIds)
            .eq('status', 'approved');

          // Fetch pending requests for clusters
          const { data: requests, error: requestsError } = await supabase
            .from('cluster_members')
            .select(`
              id,
              user_id,
              profiles!cluster_members_user_id_fkey(full_name),
              cluster_id,
              clusters!cluster_members_cluster_id_fkey(name),
              created_at
            `)
            .in('cluster_id', clusterIds)
            .eq('status', 'pending');

          if (membersError) {
            console.error('Error fetching member counts:', membersError);
          } else {
            setLeadMetrics(prev => ({
              ...prev,
              clusterMembers: totalMembers || 0
            }));
          }

          if (requestsError) {
            console.error('Error fetching pending requests:', requestsError);
          } else if (requests) {
            const formattedRequests = requests.map(req => ({
              id: req.id,
              user_id: req.user_id,
              user_name: (req.profiles as any)?.full_name || 'Unknown User',
              cluster_id: req.cluster_id,
              cluster_name: (req.clusters as any)?.name || 'Unknown Cluster',
              created_at: req.created_at
            }));

            setPendingRequests(formattedRequests);
            setLeadMetrics(prev => ({
              ...prev,
              pendingApplications: formattedRequests.length
            }));
          }
        }
      }
    };

    fetchLeadData();
  }, [user?.id, supabase]);

  const stats = [
    { title: "My Clusters", value: myClusters.length, icon: Users2, iconBg: "bg-blue-100 text-blue-600" },
    { title: "Cluster Members", value: leadMetrics.clusterMembers, icon: Users, iconBg: "bg-blue-100 text-blue-600" },
    { title: "Pending Applications", value: leadMetrics.pendingApplications, icon: UserCheck, iconBg: "bg-amber-100 text-amber-600" },
    { title: "Active Projects", value: leadMetrics.activeProjects, icon: FileText, iconBg: "bg-purple-100 text-purple-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Welcome back, Lead {fullName || user.email}!</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening in your clusters today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-semibold">{stat.value}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lead-specific sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Clusters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-blue-600" />
              My Clusters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myClusters.length > 0 ? (
              <div className="space-y-3">
                {myClusters.map((cluster) => (
                  <div key={cluster.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-medium">{cluster.name}</h4>
                      <p className="text-sm text-muted-foreground">{cluster.members_count} members</p>
                    </div>
                    <Link
                      href={`/dashboard/clusters/${cluster.id}`}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">You are not assigned as a lead to any clusters yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <h4 className="font-medium">{request.user_name}</h4>
                      <p className="text-sm text-muted-foreground">Requested to join {request.cluster_name}</p>
                    </div>
                    <Link
                      href={`/dashboard/clusters/${request.cluster_id}?tab=requests`}
                      className="text-sm font-medium text-amber-600 hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No pending requests to review.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}