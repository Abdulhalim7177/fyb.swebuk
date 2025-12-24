"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar } from "lucide-react";

interface StudentClusterStatsProps {
  clusterId: string;
}

export function StudentClusterStats({ clusterId }: StudentClusterStatsProps) {
  const [stats, setStats] = useState<{ projects: number; events: number }>({
    projects: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // Get project count - count from detailed_projects view filtered by cluster_id
        const { count: projectCount } = await supabase
          .from("detailed_projects")
          .select("*", { count: "exact", head: true })
          .eq("cluster_id", clusterId);

        // Get upcoming events count
        const { count: eventsCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("cluster_id", clusterId)
          .gte("start_date", new Date().toISOString());

        setStats({
          projects: projectCount || 0,
          events: eventsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching cluster stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clusterId]);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projects</CardTitle>
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "—" : stats.projects}</div>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Events</CardTitle>
          <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "—" : stats.events}</div>
        </CardContent>
      </Card>
    </>
  );
}
