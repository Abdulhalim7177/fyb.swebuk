"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Clock, Github, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { updateGithubRepo } from "@/lib/supabase/fyp-student-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ChapterStatus {
  type: string;
  label: string;
  status: 'not_started' | 'pending' | 'approved' | 'needs_revision';
  latestVersion?: number;
}

interface ChapterProgressTrackerProps {
  chapters: ChapterStatus[];
  progressPercentage: number;
  githubRepoUrl?: string | null;
  fypId: string;
  readOnly?: boolean;
}

export function ChapterProgressTracker({ chapters, progressPercentage, githubRepoUrl, fypId, readOnly = false }: ChapterProgressTrackerProps) {
  const router = useRouter();
  const [isEditingGithub, setIsEditingGithub] = useState(false);
  const [githubUrl, setGithubUrl] = useState(githubRepoUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  // Calculate progress based on approved chapters
  const approvedChapters = chapters.filter(c => c.status === 'approved').length;
  const calculatedProgress = chapters.length > 0
    ? Math.min(Math.round((approvedChapters / chapters.length) * 100), 100)
    : progressPercentage;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
      case 'needs_revision':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'needs_revision':
        return <Badge variant="destructive">Needs Revision</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const handleSaveGithubUrl = async () => {
    if (!githubUrl.trim()) {
      toast.error("Please enter a GitHub URL");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateGithubRepo(fypId, githubUrl.trim());

      if (result.success) {
        toast.success("GitHub repository updated successfully");
        setIsEditingGithub(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update GitHub repository");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chapter Progress</CardTitle>
        <CardDescription>Track your FYP completion status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold">{calculatedProgress}%</span>
          </div>
          <Progress value={calculatedProgress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {approvedChapters} of {chapters.length} components approved
          </p>
        </div>

        {/* GitHub Repository */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Github className="h-5 w-5" />
            <p className="text-sm font-medium">Project Repository</p>
          </div>

          {isEditingGithub ? (
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={isSaving}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveGithubUrl}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setGithubUrl(githubRepoUrl || "");
                    setIsEditingGithub(false);
                  }}
                  disabled={isSaving}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : githubRepoUrl ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate flex-1">{githubRepoUrl}</p>
              <div className="flex gap-1">
                {!readOnly && (
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingGithub(true)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href={githubRepoUrl} target="_blank" rel="noopener noreferrer">
                    View Repo
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            !readOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditingGithub(true)}
                className="w-full"
              >
                <Github className="h-3 w-3 mr-2" />
                Add GitHub Repository
              </Button>
            )
          )}
        </div>

        {/* Chapter List */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Submission Status</p>
          {chapters.map((chapter, index) => (
            <div
              key={chapter.type}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(chapter.status)}
                <div>
                  <p className="text-sm font-medium">{chapter.label}</p>
                  {chapter.latestVersion && (
                    <p className="text-xs text-muted-foreground">
                      Version {chapter.latestVersion}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(chapter.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
