import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileText, User, Calendar, Download, UserPlus, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  getAllFYPsForAdmin,
  getUnassignedFYPs,
  getAllSupervisors,
  getSupervisorWorkload,
  getAdminDashboardStats,
  getLevel400StudentsForAssignment,
} from "@/lib/supabase/fyp-admin-actions";
import { AdminMetrics } from "@/components/fyp/admin/admin-metrics";
import { SupervisorWorkload } from "@/components/fyp/admin/supervisor-workload";
import { UnassignedProjectCard } from "@/components/fyp/admin/unassigned-project-card";
import { AssignmentView } from "@/components/fyp/admin/assignment-view";

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: any; label: string; className: string }> = {
    proposal_submitted: {
      variant: "secondary",
      label: "Proposal Submitted",
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
    proposal_approved: {
      variant: "default",
      label: "Approved",
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    in_progress: {
      variant: "outline",
      label: "In Progress",
      className: "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300",
    },
    ready_for_review: {
      variant: "secondary",
      label: "Ready for Review",
      className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
    completed: {
      variant: "default",
      label: "Completed",
      className: "bg-green-600 text-white hover:bg-green-600",
    },
    rejected: {
      variant: "destructive",
      label: "Rejected",
      className: "",
    },
  };

  const config = statusConfig[status] || { variant: "outline", label: status, className: "" };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export default async function AdminFYPPage() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const [fyps, unassignedFYPs, supervisors, workload, stats, students] = await Promise.all([
    getAllFYPsForAdmin(),
    getUnassignedFYPs(),
    getAllSupervisors(),
    getSupervisorWorkload(),
    getAdminDashboardStats(),
    getLevel400StudentsForAssignment(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">FYP Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage supervisors, projects, and approvals
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
            <Download className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <AdminMetrics stats={stats} />

      {/* Tabs for different views */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-transparent p-0 h-auto gap-2 border-b rounded-none pb-2">
          <TabsTrigger 
            value="projects" 
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2 h-auto text-xs sm:text-sm"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger 
            value="assignment"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2 h-auto text-xs sm:text-sm"
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Assignment
          </TabsTrigger>
          <TabsTrigger 
            value="workload"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 rounded-full px-4 py-2 h-auto text-xs sm:text-sm"
          >
            <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Workload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {/* Unassigned Projects */}
          {unassignedFYPs.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-900 overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base text-orange-900 dark:text-orange-300">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Unassigned Projects ({unassignedFYPs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {unassignedFYPs.map((fyp: any) => (
                    <UnassignedProjectCard key={fyp.id} fyp={fyp} supervisors={supervisors} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Projects */}
          <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">All Projects ({fyps.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {fyps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No FYP submissions yet</p>
                </div>
              ) : (
                <div className="divide-y border-t sm:border-0">
                  {fyps.map((fyp: any) => (
                    <Link
                      key={fyp.id}
                      href={`/dashboard/staff/fyp/${fyp.id}`}
                      className="block p-4 sm:rounded-lg sm:border sm:hover:bg-muted/50 transition-all hover:bg-muted/30"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 mt-0.5 shrink-0 border">
                            <AvatarImage src={fyp.student?.avatar_url || undefined} />
                            <AvatarFallback>{fyp.student?.full_name?.charAt(0) || "S"}</AvatarFallback>
                          </Avatar>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            {/* Mobile Title & Badge Row */}
                            <div className="flex items-start justify-between gap-2 sm:hidden">
                              <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{fyp.title}</h3>
                              <div className="shrink-0 scale-90 origin-top-right ml-1">{getStatusBadge(fyp.status)}</div>
                            </div>
                            
                            {/* Desktop Title */}
                            <h3 className="font-semibold text-base truncate hidden sm:block">{fyp.title}</h3>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="truncate">{fyp.student?.full_name || "Unknown Student"}</span>
                              </div>
                              <div className="hidden sm:inline text-muted-foreground/40">•</div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Calendar className="h-3 w-3 shrink-0" />
                                <span>{new Date(fyp.created_at).toLocaleDateString()}</span>
                              </div>
                              {fyp.supervisor && (
                                <>
                                  <div className="hidden sm:inline text-muted-foreground/40">•</div>
                                  <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                                    <FileText className="h-3 w-3 shrink-0" />
                                    <span className="truncate">Sup: {fyp.supervisor.full_name}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="hidden sm:block shrink-0">{getStatusBadge(fyp.status)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment">
          <AssignmentView
            students={students}
            supervisors={supervisors}
            fyps={unassignedFYPs}
          />
        </TabsContent>

        <TabsContent value="workload">
          <SupervisorWorkload workload={workload} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

