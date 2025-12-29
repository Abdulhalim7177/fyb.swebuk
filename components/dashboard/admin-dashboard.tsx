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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Administrator Dashboard</h1>
            <p className="text-purple-100">System Administration Panel • {user.email}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin Settings
            </Button>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalStudents}</div>
            <p className="text-xs text-gray-600">Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalStaff}</div>
            <p className="text-xs text-gray-600">Registered staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clusters</CardTitle>
            <Globe className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalClusters}</div>
            <p className="text-xs text-gray-600">Active clusters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.activeProjects}</div>
            <p className="text-xs text-gray-600">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.pendingApprovals}</div>
            <p className="text-xs text-gray-600">Need approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.systemHealth}%</div>
            <p className="text-xs text-gray-600">Operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Administrative Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Administrative Actions</CardTitle>
            <CardDescription>
              System administration and management tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  asChild
                >
                  <Link href={action.href}>
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mr-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
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
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>
              Recent system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Activity & Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>
              Recent user registrations and activity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">New registrations this week</span>
                <span className="font-medium text-green-600">+12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily active users</span>
                <span className="font-medium">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User retention rate</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
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
            <CardTitle>Recent Admin Actions</CardTitle>
            <CardDescription>
              Latest administrative activities and changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>Promoted John Doe to Lead Student</span>
                <span className="text-gray-500 ml-auto">2h ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Settings className="w-4 h-4 text-green-500" />
                <span>Updated system permissions</span>
                <span className="text-gray-500 ml-auto">4h ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Award className="w-4 h-4 text-purple-500" />
                <span>Created new AI/ML Cluster</span>
                <span className="text-gray-500 ml-auto">6h ago</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Database className="w-4 h-4 text-orange-500" />
                <span>Performed database backup</span>
                <span className="text-gray-500 ml-auto">1d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
          <CardDescription>
            System maintenance tasks and scheduled operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start">
              <Database className="w-4 h-4 mr-2" />
              Backup Database
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="w-4 h-4 mr-2" />
              User Cleanup
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Log Analysis
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart className="w-4 h-4 mr-2" />
              Performance Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
