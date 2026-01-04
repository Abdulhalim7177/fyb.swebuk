"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitFYPProposal, resubmitFYPProposal } from "@/lib/supabase/fyp-actions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Send,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  BookOpen
} from "lucide-react";

interface ProposalSubmissionProps {
  proposalStatus?: "none" | "pending" | "approved" | "rejected" | "proposal_submitted";
  existingTitle?: string;
  existingDescription?: string;
  existingFeedback?: string;
  supervisorName?: string;
}

export function ProposalSubmission({
  proposalStatus = "none",
  existingTitle = "",
  existingDescription = "",
  existingFeedback = "",
  supervisorName,
}: ProposalSubmissionProps) {
  const router = useRouter();
  const [title, setTitle] = useState(existingTitle);
  const [description, setDescription] = useState(existingDescription);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Reset form when proposal status changes
  useEffect(() => {
    if (proposalStatus === "none" || proposalStatus === "rejected") {
      if (proposalStatus === "none") {
        setTitle("");
        setDescription("");
      } else {
        // For resubmission, pre-fill with previous values
        setTitle(existingTitle);
        setDescription(existingDescription);
      }
      setSelectedFile(null);
    }
  }, [proposalStatus, existingTitle, existingDescription]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      let result;
      if (proposalStatus === "rejected") {
        // Resubmit rejected proposal
        result = await resubmitFYPProposal(formData);
      } else {
        // Initial submission
        result = await submitFYPProposal(formData);
      }

      if (result.success) {
        toast.success(
          proposalStatus === "rejected"
            ? "Proposal resubmitted successfully!"
            : "FYP Proposal submitted successfully!"
        );
        setShowForm(false);
        // Refresh the page to show updated status
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit proposal.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error("Error submitting proposal:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // State 1: No proposal submitted yet
  if (proposalStatus === "none" && !showForm) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit Final Year Project Proposal
          </CardTitle>
          <CardDescription>
            Start your FYP journey by submitting a project proposal for review.
            Your supervisor will review and approve it before you can begin work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <h4 className="font-medium">What to include in your proposal:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>A clear and concise project title</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Detailed description of the problem you're solving</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Proposed solution and methodology</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Key technologies or approaches you will use</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Expected outcomes and deliverables</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setShowForm(true)} className="w-full">
            <BookOpen className="w-4 h-4 mr-2" />
            Start Proposal Submission
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // State 2: Show form for new submission or resubmission
  if ((proposalStatus === "none" || proposalStatus === "rejected") && showForm) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {proposalStatus === "rejected" ? (
              <>
                <RefreshCw className="h-5 w-5 text-amber-500" />
                Resubmit Your Proposal
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Submit Final Year Project Proposal
              </>
            )}
          </CardTitle>
          <CardDescription>
            {proposalStatus === "rejected"
              ? "Please address the feedback below and resubmit your proposal."
              : "Please provide a clear title and description for your proposed project."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Feedback from rejection */}
            {proposalStatus === "rejected" && existingFeedback && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">Feedback from Supervisor</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{existingFeedback}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., AI-Powered Traffic Management System"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder={`Describe the following:\n\n1. Problem Statement - What problem are you solving?\n2. Proposed Solution - How will you solve it?\n3. Methodology - What approaches will you use?\n4. Expected Outcomes - What will you deliver?\n5. Timeline - How will you manage your time?`}
                className="min-h-[200px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Supporting Document (Optional)</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-muted/50 transition-colors cursor-pointer group relative">
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="bg-primary/10 rounded-full p-3 mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  {selectedFile ? (
                    <>
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF or DOCX (Max 25MB)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                if (proposalStatus === "rejected") {
                  setTitle(existingTitle);
                  setDescription(existingDescription);
                }
              }}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {proposalStatus === "rejected" ? "Resubmit Proposal" : "Submit Proposal"}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // State 3: Proposal pending review
  if (proposalStatus === "pending" || proposalStatus === "proposal_submitted") {
    return (
      <Card className="w-full max-w-2xl mx-auto border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Clock className="h-5 w-5" />
            Proposal Under Review
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Your proposal has been submitted and is currently being reviewed by your supervisor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingTitle && (
            <div className="bg-blue-100/50 dark:bg-blue-900/40 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Project Title</p>
              <p className="font-semibold text-lg">{existingTitle}</p>
            </div>
          )}
          {supervisorName && (
            <div className="flex items-center gap-3 p-4 bg-blue-100/50 dark:bg-blue-900/40 rounded-lg">
              <div className="bg-blue-200 dark:bg-blue-800 p-2 rounded-full">
                <FileText className="h-5 w-5 text-blue-700 dark:text-blue-300" />
              </div>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Supervisor</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">{supervisorName}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
            <Clock className="h-4 w-4" />
            <span>Submitted for review - You will be notified once it&apos;s approved</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full">
            <Progress value={25} className="h-2 mb-2" />
            <p className="text-xs text-center text-muted-foreground">
              Step 1 of 4: Awaiting Supervisor Review
            </p>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // State 4: Proposal approved
  if (proposalStatus === "approved") {
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="h-5 w-5" />
            Proposal Approved
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            Congratulations! Your FYP proposal has been approved. You can now proceed to work on your project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingTitle && (
            <div className="bg-green-100/50 dark:bg-green-900/40 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Project Title</p>
              <p className="font-semibold text-lg">{existingTitle}</p>
            </div>
          )}
          {supervisorName && (
            <div className="flex items-center gap-3 p-4 bg-green-100/50 dark:bg-green-900/40 rounded-lg">
              <div className="bg-green-200 dark:bg-green-800 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Supervisor</p>
                <p className="text-sm text-green-700 dark:text-green-400">{supervisorName}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>You can now submit your chapters and track your progress</span>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full">
            <Progress value={100} className="h-2 mb-2" />
            <p className="text-xs text-center text-muted-foreground">
              Step 1 Complete: Ready to begin work on your FYP
            </p>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return null;
}
