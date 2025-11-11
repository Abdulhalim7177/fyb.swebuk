import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import { Users, UserCheck, FileText, Calendar } from "lucide-react";

interface LeadDashboardProps {
  user: User;
  fullName?: string; // Pass full name from profile
}

export function LeadDashboard({ user, fullName }: LeadDashboardProps) {
  const leadMetrics = {
    clusterMembers: 15,
    pendingApplications: 3,
    activeProjects: 4,
    upcomingEvents: 2,
  };

  const stats = [
    { title: "Cluster Members", value: leadMetrics.clusterMembers, icon: Users, iconBg: "bg-blue-100 text-blue-600" },
    { title: "Pending Applications", value: leadMetrics.pendingApplications, icon: UserCheck, iconBg: "bg-green-100 text-green-600" },
    { title: "Active Projects", value: leadMetrics.activeProjects, icon: FileText, iconBg: "bg-purple-100 text-purple-600" },
    { title: "Upcoming Events", value: leadMetrics.upcomingEvents, icon: Calendar, iconBg: "bg-orange-100 text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Welcome back, Lead {fullName || user.email}!</h1>
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