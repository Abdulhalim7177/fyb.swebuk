import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, GraduationCap, User, Calendar } from "lucide-react";
import Link from "next/link";
import { getAllFYPsForStaff, getStaffDashboardStats } from "@/lib/supabase/fyp-staff-actions";
import { ProjectMetrics } from "@/components/fyp/staff/project-metrics";

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: any; label: string; color: string }> = {
    proposal_submitted: { variant: "secondary", label: "Proposal Submitted", color: "bg-yellow-100 text-yellow-800" },
    proposal_approved: { variant: "default", label: "Approved", color: "bg-green-100 text-green-800" },
    in_progress: { variant: "outline", label: "In Progress", color: "border-blue-200 text-blue-700 bg-blue-50" },
    ready_for_review: { variant: "secondary", label: "Ready for Review", color: "bg-purple-100 text-purple-800" },
    completed: { variant: "default", label: "Completed", color: "bg-green-600 text-white" },
    rejected: { variant: "destructive", label: "Rejected", color: "" },
  };

  const config = statusConfig[status] || { variant: "outline", label: status, color: "" };

  return (
    <Badge variant={config.variant} className={config.color}>
      {config.label}
    </Badge>
  );
}

export default async function StaffFYPPage() {
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

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const fyps = await getAllFYPsForStaff();
  const stats = await getStaffDashboardStats();

  // Group FYPs by status for better organization
  const fypsByStatus = {
    pending: fyps.filter(f => f.status === "proposal_submitted"),
    approved: fyps.filter(f => f.status === "proposal_approved"),
    in_progress: fyps.filter(f => f.status === "in_progress"),
    review: fyps.filter(f => f.status === "ready_for_review"),
    completed: fyps.filter(f => f.status === "completed"),
    rejected: fyps.filter(f => f.status === "rejected"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Final Year Projects</h1>
        <p className="text-muted-foreground">
          Manage and supervise student final year projects
        </p>
      </div>

      {/* Summary Cards */}
      <ProjectMetrics stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 hidden">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fypsByStatus.pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {fypsByStatus.approved.length + fypsByStatus.in_progress.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready for Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fypsByStatus.review.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting final review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fypsByStatus.completed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* FYP List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            Click on any project to view details and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fyps.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">No FYP submissions yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Level 400 students will submit their projects here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fyps.map((fyp: any) => (
                <Link
                  key={fyp.id}
                  href={`/dashboard/staff/fyp/${fyp.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={fyp.student?.avatar_url || undefined} />
                        <AvatarFallback>
                          {fyp.student?.full_name?.charAt(0) || "S"}
                        </AvatarFallback>
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
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {fyp.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(fyp.status)}
                      {fyp.grade && (
                        <Badge variant="outline" className="font-mono">
                          Grade: {fyp.grade}
                        </Badge>
                      )}
                    </div>
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
