"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, UserX, Clock, TrendingUp, CheckCircle, FileText } from "lucide-react";

interface AdminMetricsProps {
  stats: {
    totalProjects: number;
    unassigned: number;
    pendingApproval: number;
    inProgress: number;
    completed: number;
    pendingSubmissions: number;
  } | null;
}

export function AdminMetrics({ stats }: AdminMetricsProps) {
  if (!stats) {
    return null;
  }

  const metrics = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Pending Approval",
      value: stats.pendingApproval,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "Unassigned Projects",
      value: stats.unassigned,
      icon: UserX,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Pending Submissions",
      value: stats.pendingSubmissions,
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground line-clamp-1">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
              <div className="flex items-center justify-between">
                <div className="text-xl sm:text-2xl font-extrabold sm:font-bold">{metric.value}</div>
                <div className={`p-2 rounded-lg ${metric.bgColor} hidden sm:block`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
