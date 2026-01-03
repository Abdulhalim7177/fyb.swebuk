import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FYPComments } from "@/components/fyp/fyp-comments";
import { StaffFYPActions } from "@/components/fyp/staff-fyp-actions";
import { SubmissionList } from "@/components/fyp/staff/submission-list";
import { ChapterProgressTracker } from "@/components/fyp/chapter-progress-tracker";
import { ProjectOverview } from "@/components/fyp/student/project-overview";
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

  // Build chapter progress data
  const chapterTypes = [
    { type: 'proposal', label: 'Project Proposal' },
    { type: 'chapter_1', label: 'Chapter 1' },
    { type: 'chapter_2', label: 'Chapter 2' },
    { type: 'chapter_3', label: 'Chapter 3' },
    { type: 'chapter_4', label: 'Chapter 4' },
    { type: 'chapter_5', label: 'Chapter 5' },
    { type: 'final_thesis', label: 'Final Thesis' },
  ];

  const chapterProgress = chapterTypes.map(chapter => {
    const submissions = (fypData.submissions || []).filter(
      (s: any) => s.submission_type === chapter.type && (s.is_latest_version ?? true)
    );
    const latest = submissions[0];

    // If it's the proposal and project is already active, it's approved by definition
    const isApprovedProposal = chapter.type === 'proposal' && 
      ["in_progress", "ready_for_review", "completed", "proposal_approved"].includes(fypData.status);

    return {
      type: chapter.type,
      label: chapter.label,
      status: (isApprovedProposal || latest?.status === 'approved'
        ? 'approved'
        : !latest
          ? 'not_started'
          : latest.status === 'pending'
            ? 'pending'
            : 'needs_revision') as "approved" | "pending" | "needs_revision" | "not_started",
      latestVersion: latest?.version_number,
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-black tracking-tight">{fypData.title || "Untitled Project"}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Started {new Date(fypData.created_at).toLocaleDateString()}</span>
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
          <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {fypData.description || "No project description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Submissions */}
          <SubmissionList submissions={fypData.submissions || []} />

          {/* Comments */}
          <FYPComments fypId={fypData.id} initialComments={comments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Tracker */}
          <ChapterProgressTracker
            chapters={chapterProgress}
            progressPercentage={fypData.progress_percentage || 0}
            githubRepoUrl={fypData.github_repo_url}
            fypId={fypData.id}
            readOnly={true}
          />

          {/* Project Overview Stats */}
          <ProjectOverview fyp={fypData} submissions={fypData.submissions || []} />

          {/* Actions */}
          <StaffFYPActions fyp={fypData} currentUserId={user.id} />

          {/* Student Info */}
          <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md">
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
                  <p className="text-xs text-muted-foreground">Level {fypData.student?.academic_level || "400"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supervisor Info (if not current user) */}
          {fypData.supervisor && fypData.supervisor_id !== user.id && (
            <Card className="md:border md:border-border/40 md:bg-card/50 md:backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Co-Supervisor / Admin View
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
