import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FYPComments } from "@/components/fyp/fyp-comments";
import { StaffFYPActions } from "@/components/fyp/staff-fyp-actions";
import { SubmissionList } from "@/components/fyp/staff/submission-list";
import { Calendar, User, FileText, Clock } from "lucide-react";
import { getStaffFYPDetails } from "@/lib/supabase/fyp-staff-actions";
import { getFYPComments } from "@/lib/supabase/fyp-actions";

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { variant: any; label: string; className: string }> = {
    proposal_submitted: {
      variant: "secondary",
      label: "Proposal Submitted",
      className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    },
    proposal_approved: {
      variant: "default",
      label: "Approved",
      className: "bg-green-100 text-green-800 hover:bg-green-100"
    },
    in_progress: {
      variant: "outline",
      label: "In Progress",
      className: "border-blue-200 text-blue-700 bg-blue-50"
    },
    ready_for_review: {
      variant: "secondary",
      label: "Ready for Review",
      className: "bg-purple-100 text-purple-800 hover:bg-purple-100"
    },
    completed: {
      variant: "default",
      label: "Completed",
      className: "bg-green-600 text-white hover:bg-green-600"
    },
    rejected: {
      variant: "destructive",
      label: "Rejected",
      className: ""
    },
  };

  const config = statusConfig[status] || { variant: "outline", label: status, className: "" };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export default async function StaffFYPDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Await params in Next.js 16+
  const { id } = await params;

  const fypData = await getStaffFYPDetails(id);

  if (!fypData) {
    notFound();
  }

  const comments = await getFYPComments(id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{fypData.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Submitted {new Date(fypData.created_at).toLocaleDateString()}</span>
            </div>
            {fypData.completed_at && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Completed {new Date(fypData.completed_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        {getStatusBadge(fypData.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {fypData.description}
              </p>
            </CardContent>
          </Card>

          {/* Submissions */}
          <SubmissionList submissions={fypData.submissions || []} />

          {/* Feedback */}
          {fypData.feedback && (
            <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  Supervisor Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{fypData.feedback}</p>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <FYPComments fypId={fypData.id} initialComments={comments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Student</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={fypData.student?.avatar_url || undefined} />
                  <AvatarFallback>{fypData.student?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{fypData.student?.full_name}</p>
                  <Badge variant="outline" className="mt-1">
                    Level {fypData.student?.academic_level || "400"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supervisor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Supervisor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fypData.supervisor ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={fypData.supervisor.avatar_url || undefined} />
                    <AvatarFallback>{fypData.supervisor.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{fypData.supervisor.full_name}</p>
                    <p className="text-xs text-muted-foreground">{fypData.supervisor.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
                  <User className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">No supervisor assigned yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grade */}
          {fypData.grade && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Grade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">{fypData.grade}</div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <StaffFYPActions fyp={fypData} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
