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
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
        <div className="p-3 rounded-xl bg-blue-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
          <FileText className="h-6 w-6 text-blue-500" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">{loading ? "—" : stats.projects}</p>
        <p className="text-sm font-medium text-slate-400">Active Projects</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center text-center group hover:border-white/20 transition-all duration-300 hover:scale-105">
        <div className="p-3 rounded-xl bg-emerald-500/10 mb-3 group-hover:scale-110 transition-transform duration-300">
          <Calendar className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">{loading ? "—" : stats.events}</p>
        <p className="text-sm font-medium text-slate-400">Upcoming Events</p>
      </div>
    </>
  );
}
