import { createClient } from "@/lib/supabase/server";
import { getStudentFYPWithSubmissions } from "@/lib/supabase/fyp-student-actions";
import { getFYPComments } from "@/lib/supabase/fyp-actions";
import { SubmitProposalForm } from "@/components/fyp/submit-proposal-form";
import { SubmissionForm } from "@/components/fyp/student/submission-form";
import { SubmissionHistory } from "@/components/fyp/student/submission-history";
import { ProjectOverview } from "@/components/fyp/student/project-overview";
import { FYPComments } from "@/components/fyp/fyp-comments";
import { ChapterProgressTracker } from "@/components/fyp/chapter-progress-tracker";
import { Lock, MessageSquare } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function StudentFYPPage() {
  const supabase = await createClient();
  const { data: { user } } = await (supabase.auth as any).getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check user academic level
  const { data: profile } = await supabase
    .from("profiles")
    .select("academic_level, full_name")
    .eq("id", user.id)
    .single();

  const level = profile?.academic_level;
  const isEligible = level === "level_400" || level === "400";

  if (!isEligible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="p-4 rounded-full bg-muted">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md">
          The Final Year Project module is only available to Level 400 students.
          You are currently recorded as: <span className="font-medium text-foreground">{level || "Student"}</span>.
        </p>
      </div>
    );
  }

  const fypData = await getStudentFYPWithSubmissions();

  if (!fypData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Final Year Project</h1>
          <p className="text-muted-foreground">
            Submit your project proposal for approval to begin your final year project.
          </p>
        </div>
        <SubmitProposalForm />
      </div>
    );
  }

  // Fetch comments
  const comments = await getFYPComments(fypData.id);

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
      s => s.submission_type === chapter.type && s.is_latest_version
    );
    const latest = submissions[0];

    return {
      type: chapter.type,
      label: chapter.label,
      status: (!latest
        ? 'not_started'
        : latest.status === 'approved'
          ? 'approved'
          : latest.status === 'pending'
            ? 'pending'
            : 'needs_revision') as "approved" | "pending" | "needs_revision" | "not_started",
      latestVersion: latest?.version_number,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">FYP Management (Level 400)</h1>
          <p className="text-muted-foreground">
            Project: {fypData.title}
            {fypData.supervisor && ` | Supervisor: ${fypData.supervisor.full_name}`}
          </p>
        </div>
        {fypData.supervisor && (
          <Button variant="default">
            <MessageSquare className="mr-2 h-4 w-4" />
            Project Chatroom
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Form */}
          <SubmissionForm fypId={fypData.id} />

          {/* Submission History */}
          <SubmissionHistory submissions={fypData.submissions || []} />

          {/* Comments Section */}
          <FYPComments fypId={fypData.id} initialComments={comments} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <ChapterProgressTracker
            chapters={chapterProgress}
            progressPercentage={fypData.progress_percentage || 0}
            githubRepoUrl={fypData.github_repo_url}
            fypId={fypData.id}
          />
          <ProjectOverview fyp={fypData} submissions={fypData.submissions || []} />
        </div>
      </div>
    </div>
  );
}
