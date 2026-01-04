import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Settings, Shield, Database, BarChart, AlertTriangle, TrendingUp, Globe, FileText, Award } from "lucide-react";
import Link from "next/link";

interface AdminDashboardProps {
  user: any;
  fullName?: string; // Pass full name from profile
  metrics: {
    totalStudents: number;
    totalStaff: number;
    totalClusters: number;
  };
}

export function AdminDashboard({ user, fullName, metrics }: AdminDashboardProps) {
  const systemMetrics = {
    totalStudents: metrics.totalStudents,
    totalStaff: metrics.totalStaff,
    totalClusters: metrics.totalClusters,
    activeProjects: 23,
    pendingApprovals: 5,
    systemHealth: 98,
  };

  const adminActions = [
    {
      title: "User Management",
      description: "Manage user accounts and roles",
      icon: Users,
      href: "/dashboard/admin/users",
      color: "bg-blue-500",
    },
    {
      title: "Staff Management",
      description: "Manage staff accounts and permissions",
      icon: UserCheck,
      href: "/dashboard/admin/staff",
      color: "bg-green-500",
    },
    {
      title: "Cluster Management",
      description: "Manage clusters and communities",
      icon: Globe,
      href: "/dashboard/admin/clusters",
      color: "bg-purple-500",
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings",
      icon: Settings,
      href: "/dashboard/admin/settings",
      color: "bg-orange-500",
    },
  ];

  const systemAlerts = [
    {
      type: "warning",
      message: "High server load detected",
      time: "10 minutes ago",
    },
    {
      type: "info",
      message: "New feature deployment completed",
      time: "2 hours ago",
    },
    {
      type: "error",
      message: "Failed backup attempt",
      time: "4 hours ago",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white rounded-xl shadow-lg p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Shield className="w-32 h-32" />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Administrator Dashboard</h1>
            <p className="text-purple-100 flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              System Administration Panel • {user.email}
            </p>
          </div>
          <div className="flex w-full sm:w-auto">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur-sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin Settings
            </Button>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Total Students</CardTitle>
            <div className="p-1 sm:p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg hidden xs:block">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{systemMetrics.totalStudents}</div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">Registered</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Total Staff</CardTitle>
            <div className="p-1 sm:p-2 bg-green-50 dark:bg-green-950/30 rounded-lg hidden xs:block">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{systemMetrics.totalStaff}</div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">Staff</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Clusters</CardTitle>
            <div className="p-1 sm:p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg hidden xs:block">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{systemMetrics.totalClusters}</div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">Active</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Projects</CardTitle>
            <div className="p-1 sm:p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg hidden xs:block">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{systemMetrics.activeProjects}</div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">Active</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Pending</CardTitle>
            <div className="p-1 sm:p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg hidden xs:block">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{systemMetrics.pendingApprovals}</div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">Pending</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 sm:pb-2">
            <CardTitle className="text-[10px] sm:text-sm font-semibold line-clamp-1">Health</CardTitle>
            <div className="p-1 sm:p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg hidden xs:block">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight">{systemMetrics.systemHealth}%</div>
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">System</p>
          </CardContent>
        </Card>
      </div>

      {/* Administrative Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-xl">Administrative Actions</CardTitle>
            <CardDescription>
              System administration and management tools
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-auto">
            {adminActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-muted/50 transition-colors group relative overflow-hidden"
                  asChild
                >
                  <Link href={action.href}>
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mr-3 shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors">{action.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{action.description}</div>
                    </div>
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">System Alerts</CardTitle>
            <CardDescription>
              Recent system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    alert.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                    alert.type === 'warning' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none mb-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 text-xs">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">User Activity</CardTitle>
            <CardDescription>
              Recent user registrations and activity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                <span className="text-sm">New registrations this week</span>
                <span className="font-bold text-green-600 dark:text-green-500">+12</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                <span className="text-sm">Daily active users</span>
                <span className="font-bold">89</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                <span className="text-sm">User retention rate</span>
                <span className="font-bold">87%</span>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full shadow-sm">
                  <BarChart className="w-4 h-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Administrative Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Admin Actions</CardTitle>
            <CardDescription>
              Latest administrative activities and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: UserCheck, color: "text-blue-500", text: "Promoted John Doe to Lead Student", time: "2h ago" },
                { icon: Settings, color: "text-green-500", text: "Updated system permissions", time: "4h ago" },
                { icon: Award, color: "text-purple-500", text: "Created new AI/ML Cluster", time: "6h ago" },
                { icon: Database, color: "text-orange-500", text: "Performed database backup", time: "1d ago" }
              ].map((action, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0`}>
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                  </div>
                  <span className="flex-1 truncate">{action.text}</span>
                  <span className="text-xs text-muted-foreground font-mono">{action.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Maintenance */}
      <Card className="border-t-4 border-t-orange-500/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-500" />
            System Maintenance
          </CardTitle>
          <CardDescription>
            Core maintenance tasks and scheduled operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Database, label: "Backup Database" },
              { icon: Users, label: "User Cleanup" },
              { icon: FileText, label: "Log Analysis" },
              { icon: BarChart, label: "Performance Report" }
            ].map((btn, i) => (
              <Button key={i} variant="outline" className="justify-start h-12 hover:border-primary/50 transition-colors">
                <btn.icon className="w-4 h-4 mr-2 text-primary" />
                {btn.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
