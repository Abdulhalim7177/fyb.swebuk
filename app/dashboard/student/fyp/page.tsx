import { createClient } from "@/lib/supabase/server";
import { getStudentFYPWithSubmissions } from "@/lib/supabase/fyp-student-actions";
import { getFYPComments } from "@/lib/supabase/fyp-actions";
import { ProposalSubmission } from "@/components/fyp/proposal-submission";
import { SubmissionForm } from "@/components/fyp/student/submission-form";
import { SubmissionHistory } from "@/components/fyp/student/submission-history";
import { ProjectOverview } from "@/components/fyp/student/project-overview";
import { FYPComments } from "@/components/fyp/fyp-comments";
import { ChapterProgressTracker } from "@/components/fyp/chapter-progress-tracker";
import { Lock, MessageSquare, User, Clock, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

  // If FYP record exists, check if it's a placeholder (assigned supervisor but no title yet)
  const isPlaceholder = fypData && (fypData.status === "pending" || (!fypData.title && !fypData.description));

  // Check if student has been assigned a supervisor directly to their FYP project
  const hasSupervisor = !!fypData?.supervisor_id;

  // Case 1: No FYP record OR placeholder record (assigned supervisor but no proposal submitted)
  if (!fypData || isPlaceholder) {
    // First check if there's a rejected FYP (for resubmission)
    // Only check if it's not a newly assigned placeholder
    const { data: rejectedFyp } = (!isPlaceholder && fypData) ? await supabase
      .from("final_year_projects")
      .select("id, title, description, feedback, supervisor_id")
      .eq("student_id", user.id)
      .eq("status", "rejected")
      .single() : { data: null };

    if (rejectedFyp) {
      // Has rejected proposal - can resubmit
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Final Year Project</h1>
            <p className="text-muted-foreground">
              Your proposal was not approved. Please review the feedback and resubmit.
            </p>
          </div>
          <ProposalSubmission
            proposalStatus="rejected"
            existingTitle={rejectedFyp.title || ""}
            existingDescription={rejectedFyp.description || ""}
            existingFeedback={rejectedFyp.feedback || ""}
            supervisorName={fypData?.supervisor?.full_name}
          />
        </div>
      );
    }

    // No FYP exists or it's a placeholder - check if student has a supervisor assigned directly
    if (!hasSupervisor) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Final Year Project</h1>
            <p className="text-muted-foreground">
              Complete the Final Year Project module requirements.
            </p>
          </div>

          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <User className="h-5 w-5" />
                Awaiting Supervisor Assignment
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                You need to be assigned a supervisor before you can submit your FYP proposal.
                Your supervisor is assigned directly to you by the department administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-blue-100/50 dark:bg-blue-900/40 rounded-lg">
                  <div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Status</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">Waiting for supervisor assignment</p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-2">What happens next?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>An administrator will assign you to a supervisor directly</li>
                    <li>Once assigned, you can submit your project proposal</li>
                    <li>Your supervisor will review and approve your proposal</li>
                    <li>After approval, you can start working on your FYP chapters</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Has supervisor (fypData exists and has supervisor_id) - can submit proposal
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Final Year Project</h1>
          <p className="text-muted-foreground">
            You have been assigned a supervisor. Submit your project proposal to begin your FYP journey.
          </p>
        </div>

        <ProposalSubmission 
          proposalStatus="none" 
          supervisorName={fypData?.supervisor?.full_name} 
        />
      </div>
    );
  }

  // FYP exists - check proposal status
  const proposalStatus = fypData.status;

  // Case 2: Proposal pending or rejected - show proposal status UI ONLY
  // This explicitly hides all other "content" (history, tracker, comments) until approved
  if (proposalStatus === "pending" || proposalStatus === "proposal_submitted" || proposalStatus === "rejected") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Final Year Project</h1>
          <p className="text-muted-foreground">
            {proposalStatus === "rejected"
              ? "Your proposal was not approved. Please review the feedback and resubmit."
              : proposalStatus === "proposal_submitted"
                ? "Your proposal is under review."
                : "Submit your project proposal to begin."}
          </p>
        </div>

        <ProposalSubmission
          proposalStatus={proposalStatus === "rejected" ? "rejected" : "proposal_submitted"}
          existingTitle={fypData.title || ""}
          existingDescription={fypData.description || ""}
          existingFeedback={fypData.feedback || ""}
          supervisorName={fypData.supervisor?.full_name}
        />
      </div>
    );
  }

  // Case 3: Proposal approved/Active project - show full FYP dashboard
  const isActive = ["in_progress", "ready_for_review", "completed", "proposal_approved"].includes(proposalStatus);

  if (isActive) {
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

      // If it's the proposal and project is already active, it's approved by definition
      const isApprovedProposal = chapter.type === 'proposal' && 
        ["in_progress", "ready_for_review", "completed"].includes(proposalStatus);

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

    const approvedTypes = chapterProgress
      .filter(c => c.status === 'approved')
      .map(c => c.type);

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
            <SubmissionForm fypId={fypData.id} approvedTypes={approvedTypes} />

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

  // Fallback for any other state
  return (
    <div className="space-y-6">
      <div className="p-8 text-center border-2 border-dashed rounded-xl">
        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-bold">Project Status: {proposalStatus.replace('_', ' ')}</h2>
        <p className="text-muted-foreground">Your project is currently being processed. Check back later.</p>
      </div>
    </div>
  );
}
