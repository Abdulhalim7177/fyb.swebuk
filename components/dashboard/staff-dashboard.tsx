import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Calendar, Settings, GraduationCap, ClipboardList, Award, BarChart } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface FYPStats {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  pendingReviews: number;
}

interface PendingSubmission {
  id: string;
  title: string;
  submission_type: string;
  submitted_at: string;
  fyp: {
    id: string;
    title: string;
    student: {
      full_name: string;
    };
  };
}

interface StaffDashboardProps {
  user: any;
  fullName?: string;
  fypStats: FYPStats | null;
  pendingSubmissions: PendingSubmission[];
}

export function StaffDashboard({ user, fullName, fypStats, pendingSubmissions }: StaffDashboardProps) {
  const staffMetrics = {
    supervisedStudents: fypStats?.totalAssigned || 0,
    assignedClusters: 2, // TODO: Fetch from cluster management
    pendingFyps: fypStats?.pendingReviews || 0,
    upcomingEvents: 1, // TODO: Fetch from events
  };

  const quickActions = [
    {
      title: "FYP Supervision",
      description: "Manage final year projects",
      icon: GraduationCap,
      href: "/dashboard/staff/fyp",
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

  // Format submission type for display
  const formatSubmissionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calculate priority based on submission age
  const getPriority = (submittedAt: string) => {
    const daysSinceSubmission = Math.floor(
      (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSubmission >= 5) return "High";
    if (daysSinceSubmission >= 2) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Academic Staff Portal • {user.email}</p>
          </div>
          <Button variant="outline" size="sm" className="border-2 hover:bg-muted">
            <Settings className="w-4 h-4 mr-2" />
            Staff Settings
          </Button>
        </div>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  className="w-full justify-start h-auto p-4 border-2 hover:bg-muted"
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
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>
              Recent FYP submissions awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No pending submissions to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => {
                  const priority = getPriority(submission.submitted_at);
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          priority === 'High' ? 'bg-red-500' :
                          priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{submission.title}</p>
                          <p className="text-xs text-gray-500">
                            {formatSubmissionType(submission.submission_type)} • {submission.fyp.student.full_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-gray-600 mb-1">
                          {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-2 hover:bg-muted"
                          asChild
                        >
                          <Link href={`/dashboard/staff/fyp/${submission.fyp.id}`}>
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {pendingSubmissions.length > 0 && (
              <div className="mt-4">
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/dashboard/staff/fyp">
                    View All FYP Projects →
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Academic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>FYP Progress Overview</CardTitle>
            <CardDescription>
              Track supervised student progress and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{fypStats?.inProgress || 0}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{fypStats?.completed || 0}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Supervised</span>
                  <span className="font-medium">{fypStats?.totalAssigned || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending Reviews</span>
                  <Badge variant="secondary" className="text-xs">
                    {fypStats?.pendingReviews || 0}
                  </Badge>
                </div>
                {fypStats && fypStats.totalAssigned > 0 && (
                  <>
                    <div className="flex justify-between text-sm mt-3">
                      <span>Completion Rate</span>
                      <span className="font-medium">
                        {Math.round((fypStats.completed / fypStats.totalAssigned) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(fypStats.completed / fypStats.totalAssigned) * 100}%`
                        }}
                      ></div>
                    </div>
                  </>
                )}
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
            <Button variant="outline" className="justify-start border-2 hover:bg-muted">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" className="justify-start border-2 hover:bg-muted">
              <Award className="w-4 h-4 mr-2" />
              Grading
            </Button>
            <Button variant="outline" className="justify-start border-2 hover:bg-muted">
              <Users className="w-4 h-4 mr-2" />
              Student Lists
            </Button>
            <Button variant="outline" className="justify-start border-2 hover:bg-muted">
              <BarChart className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
