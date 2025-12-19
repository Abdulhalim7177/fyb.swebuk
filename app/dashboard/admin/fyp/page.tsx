import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileText, User, Calendar, Download, UserPlus } from "lucide-react";
import Link from "next/link";
import {
  getAllFYPsForAdmin,
  getUnassignedFYPs,
  getAllSupervisors,
  getSupervisorWorkload,
  getAdminDashboardStats,
} from "@/lib/supabase/fyp-admin-actions";
import { AdminMetrics } from "@/components/fyp/admin/admin-metrics";
import { SupervisorWorkload } from "@/components/fyp/admin/supervisor-workload";
import { UnassignedProjectCard } from "@/components/fyp/admin/unassigned-project-card";

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

  const [fyps, unassignedFYPs, supervisors, workload, stats] = await Promise.all([
    getAllFYPsForAdmin(),
    getUnassignedFYPs(),
    getAllSupervisors(),
    getSupervisorWorkload(),
    getAdminDashboardStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FYP Management (Admin)</h1>
          <p className="text-muted-foreground">
            Manage supervisors, approve proposals, and oversee all Level 400 projects
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <AdminMetrics stats={stats} />

      {/* Supervisor Workload */}
      <SupervisorWorkload workload={workload} />

      {/* Unassigned Projects */}
      {unassignedFYPs.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-300">
              <UserPlus className="h-5 w-5" />
              Unassigned Projects ({unassignedFYPs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unassignedFYPs.map((fyp: any) => (
                <UnassignedProjectCard key={fyp.id} fyp={fyp} supervisors={supervisors} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Projects */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects ({fyps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fyps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No FYP submissions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fyps.map((fyp: any) => (
                <Link
                  key={fyp.id}
                  href={`/dashboard/staff/fyp/${fyp.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={fyp.student?.avatar_url || undefined} />
                        <AvatarFallback>{fyp.student?.full_name?.charAt(0) || "S"}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{fyp.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{fyp.student?.full_name || "Unknown Student"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(fyp.created_at).toLocaleDateString()}</span>
                          </div>
                          {fyp.supervisor && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>Supervisor: {fyp.supervisor.full_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>{getStatusBadge(fyp.status)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

