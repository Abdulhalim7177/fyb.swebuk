import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { Users, FileText, Calendar, Settings, GraduationCap, ClipboardList, Award, BarChart } from "lucide-react";
import Link from "next/link";

interface StaffDashboardProps {
  user: User;
  fullName?: string; // Pass full name from profile
}

export function StaffDashboard({ user, fullName }: StaffDashboardProps) {
  const staffMetrics = {
    supervisedStudents: 8,
    assignedClusters: 2,
    pendingFyps: 3,
    upcomingEvents: 1,
  };

  const quickActions = [
    {
      title: "FYP Supervision",
      description: "Manage final year projects",
      icon: GraduationCap,
      href: "/fyp/supervision",
      color: "bg-blue-500",
      badge: staffMetrics.pendingFyps,
    },
    {
      title: "Cluster Management",
      description: "Manage clusters and communities",
      icon: Users,
      href: "/dashboard/staff/clusters",
      color: "bg-green-500",
    },
    {
      title: "Student Management",
      description: "Manage students in your clusters",
      icon: Users,
      href: "/dashboard/staff/users",
      color: "bg-purple-500",
    },
    {
      title: "Student Assessment",
      description: "Evaluate student progress",
      icon: ClipboardList,
      href: "/assessment",
      color: "bg-purple-500",
    },
    {
      title: "Reports",
      description: "Generate academic reports",
      icon: BarChart,
      href: "/reports",
      color: "bg-orange-500",
    },
  ];

  const supervisoryTasks = [
    {
      type: "FYP Proposal",
      title: "AI-Based Learning Management System",
      student: "John Doe",
      due: "2 days",
      priority: "High",
    },
    {
      type: "Progress Review",
      title: "Mobile Health App Project",
      student: "Jane Smith",
      due: "5 days",
      priority: "Medium",
    },
    {
      type: "FYP Defense",
      title: "E-commerce Website",
      student: "Mike Johnson",
      due: "1 week",
      priority: "High",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Academic Staff Portal • {user.email}</p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Staff Settings
          </Button>
        </div>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supervised Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMetrics.supervisedStudents}</div>
            <p className="text-xs text-gray-600">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Clusters</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMetrics.assignedClusters}</div>
            <p className="text-xs text-gray-600">Clusters to oversee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending FYPs</CardTitle>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMetrics.pendingFyps}</div>
            <p className="text-xs text-gray-600">Need review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMetrics.upcomingEvents}</div>
            <p className="text-xs text-gray-600">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff Actions</CardTitle>
            <CardDescription>
              Access staff-specific tools and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  asChild
                >
                  <Link href={action.href} className="relative">
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mr-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-gray-600">{action.description}</div>
                    </div>
                    {action.badge && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {action.badge}
                      </span>
                    )}
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Supervisory Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Supervisory Tasks</CardTitle>
            <CardDescription>
              FYP supervision and assessment tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supervisoryTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'High' ? 'bg-red-500' :
                      task.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.type} • {task.student}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{task.due}</p>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Performance Overview</CardTitle>
            <CardDescription>
              Track student progress and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">7/8</div>
                  <p className="text-xs text-gray-600">On Track</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">1/8</div>
                  <p className="text-xs text-gray-600">Need Attention</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Progress</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>
              Important dates and submission deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-red-500" />
                  FYP Proposals Due
                </span>
                <span className="font-medium">Nov 15</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                  Progress Reports
                </span>
                <span className="font-medium">Nov 20</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  FYP Presentations
                </span>
                <span className="font-medium">Dec 1</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources & Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Resources & Tools</CardTitle>
          <CardDescription>
            Academic resources and administrative tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" className="justify-start">
              <Award className="w-4 h-4 mr-2" />
              Grading
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="w-4 h-4 mr-2" />
              Student Lists
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
