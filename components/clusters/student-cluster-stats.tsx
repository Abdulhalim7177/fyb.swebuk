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
      <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
        <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-blue-500/10 mb-2 sm:mb-3">
            <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{loading ? "—" : stats.projects}</p>
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Projects</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-all duration-300 hover:scale-[1.02] border-border/50">
        <CardContent className="p-2 sm:p-6 flex flex-col items-center text-center">
          <div className="p-1.5 sm:p-2.5 rounded-xl bg-teal-500/10 mb-2 sm:mb-3">
            <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-teal-500" />
          </div>
          <p className="text-lg sm:text-3xl font-bold text-foreground mb-0.5 sm:mb-1">{loading ? "—" : stats.events}</p>
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground truncate w-full">Events</p>
        </CardContent>
      </Card>
    </>
  );
}
