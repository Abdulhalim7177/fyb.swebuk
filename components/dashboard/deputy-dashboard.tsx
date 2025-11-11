import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { Users, UserPlus, BookOpen, FileText } from "lucide-react";

interface DeputyDashboardProps {
  user: User;
  fullName?: string; // Pass full name from profile
}

export function DeputyDashboard({ user, fullName }: DeputyDashboardProps) {
  const deputyMetrics = {
    clusterMembers: 15,
    pendingApplications: 3,
    blogToReview: 2,
    assistedProjects: 4,
  };

  const stats = [
    { title: "Cluster Members", value: deputyMetrics.clusterMembers, icon: Users, iconBg: "bg-blue-100 text-blue-600" },
    { title: "Pending Applications", value: deputyMetrics.pendingApplications, icon: UserPlus, iconBg: "bg-green-100 text-green-600" },
    { title: "Blog Reviews", value: deputyMetrics.blogToReview, icon: BookOpen, iconBg: "bg-purple-100 text-purple-600" },
    { title: "Assisted Projects", value: deputyMetrics.assistedProjects, icon: FileText, iconBg: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Welcome back, Deputy {fullName || user.email}!</h1>
        <p className="mt-1 text-muted-foreground">Here's what's happening in your cluster today.</p>
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
    </div>
  );
}