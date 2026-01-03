import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  GraduationCap, 
  ClipboardList, 
  Award, 
  BarChart, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ComprehensiveStaffStats {
  fyp: {
    totalAssigned: number;
    inProgress: number;
    completed: number;
    pendingReviews: number;
  };
  clusters: number;
  events: number;
  totalStudents: number;
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
  stats: ComprehensiveStaffStats | null;
  pendingSubmissions: PendingSubmission[];
}

export function StaffDashboard({ user, fullName, stats, pendingSubmissions }: StaffDashboardProps) {
  // Common colors for consistency
  const colors = {
    fyp: "text-emerald-500 bg-emerald-500/10",
    clusters: "text-amber-500 bg-amber-500/10",
    students: "text-indigo-500 bg-indigo-500/10",
    events: "text-rose-500 bg-rose-500/10",
  };

  const staffMetrics = {
    supervisedStudents: stats?.fyp?.totalAssigned || 0,
    assignedClusters: stats?.clusters || 0,
    pendingFyps: stats?.fyp?.pendingReviews || 0,
    upcomingEvents: stats?.events || 0,
  };

  const quickActions = [
    {
      title: "FYP Supervision",
      description: "Approve proposals and review chapters",
      icon: GraduationCap,
      href: "/dashboard/staff/fyp",
      color: colors.fyp,
      badge: stats?.fyp?.pendingReviews,
    },
    {
      title: "Student Directory",
      description: "View and manage student profiles",
      icon: Users,
      href: "/dashboard/staff/users",
      color: colors.students,
    },
    {
      title: "Cluster Oversight",
      description: "Manage your assigned clubs",
      icon: ClipboardList,
      href: "/dashboard/staff/clusters",
      color: colors.clusters,
    },
    {
      title: "Official Blogs",
      description: "Publish news and announcements",
      icon: FileText,
      href: "/dashboard/staff/blog",
      color: "text-orange-500 bg-orange-500/10",
    },
  ];

  const formatSubmissionType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPriorityColor = (submittedAt: string) => {
    const daysSinceSubmission = Math.floor(
      (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSubmission >= 5) return "text-red-500 bg-red-500/10";
    if (daysSinceSubmission >= 2) return "text-amber-500 bg-amber-500/10";
    return "text-emerald-500 bg-emerald-500/10";
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Staff Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, <span className="text-foreground font-medium">{fullName?.split(' ')[0]}</span> • Academic Portal
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-card/50 backdrop-blur-sm border-border/40" asChild>
            <Link href="/dashboard/staff/profile">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary FYP Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned students</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fyp?.totalAssigned || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Supervising</p>
          </CardContent>
        </Card>

        <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fyp?.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active projects</p>
          </CardContent>
        </Card>

        <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <div className={cn(
              "h-2 w-2 rounded-full",
              (stats?.fyp?.pendingReviews || 0) > 0 ? "bg-red-500 animate-pulse" : "bg-muted"
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fyp?.pendingReviews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Submissions</p>
          </CardContent>
        </Card>

        <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fyp?.completed || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total success</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column - Actions & Deadlines */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <section>
            <h3 className="text-lg font-semibold mb-4 px-1">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href} className="group">
                    <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none hover:border-primary/50 transition-all duration-300">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", action.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center justify-between">
                            {action.title}
                            {action.badge ? (
                              <Badge className="bg-red-500 text-white border-none">{action.badge}</Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{action.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* FYP Progress Overview */}
          <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart className="w-5 h-5 text-primary" />
                FYP Performance
              </CardTitle>
              <CardDescription>Overall completion rate of your supervised projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stats?.fyp && stats.fyp.totalAssigned > 0 ? (
                <>
                  <div className="flex items-end justify-between mb-2">
                    <div className="space-y-1">
                      <p className="text-4xl font-bold tracking-tighter">
                        {Math.round((stats.fyp.completed / stats.fyp.totalAssigned) * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Target Completion</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {stats.fyp.completed} of {stats.fyp.totalAssigned} finished
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(stats.fyp.completed / stats.fyp.totalAssigned) * 100}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/20">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Current Workload</p>
                      <p className="text-lg font-semibold">{stats.fyp.totalAssigned - stats.fyp.completed} Active</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Approval Pipeline</p>
                      <p className="text-lg font-semibold text-amber-500">{stats.fyp.pendingReviews} Awaiting</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No students assigned for supervision yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column - Submissions & Activity */}
        <div className="space-y-8">
          {/* Pending Submissions */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-lg font-semibold">Pending Reviews</h3>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-auto p-0" asChild>
                <Link href="/dashboard/staff/fyp">All Projects <ArrowUpRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
            
            <div className="space-y-3">
              {pendingSubmissions.length === 0 ? (
                <Card className="border-dashed bg-transparent shadow-none border-border/40">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Great job! All caught up.</p>
                  </CardContent>
                </Card>
              ) : (
                pendingSubmissions.map((submission) => (
                  <Link key={submission.id} href={`/dashboard/staff/fyp/${submission.fyp.id}`} className="block group">
                    <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none hover:bg-muted/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg mt-0.5", getPriorityColor(submission.submitted_at))}>
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {submission.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {submission.fyp.student.full_name} • {formatSubmissionType(submission.submission_type)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-[10px] text-muted-foreground font-medium uppercase">
                                {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Upcoming Deadlines (Simplified) */}
          <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md border-border/40 bg-transparent shadow-none overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/20">
                {[
                  { label: "FYP Proposals", date: "Nov 15", color: "bg-red-500" },
                  { label: "Progress Reports", date: "Nov 20", color: "bg-amber-500" },
                  { label: "Presentations", date: "Dec 01", color: "bg-blue-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 px-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full", item.color)} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{item.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}