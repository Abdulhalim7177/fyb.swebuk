"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProjectOverviewProps {
  fyp: {
    id: string;
    title: string;
    description: string;
    status: string;
    created_at: string;
    supervisor?: {
      full_name: string;
      avatar_url: string | null;
      email: string;
    } | null;
    feedback?: string | null;
  };
  submissions: any[];
}

function getStatusInfo(status: string) {
  switch (status) {
    case "proposal_submitted":
      return {
        label: "Proposal Submitted",
        icon: Clock,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        progress: 10,
      };
    case "proposal_approved":
      return {
        label: "Proposal Approved",
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        progress: 25,
      };
    case "in_progress":
      return {
        label: "In Progress",
        icon: Clock,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        progress: 50,
      };
    case "ready_for_review":
      return {
        label: "Ready for Review",
        icon: AlertCircle,
        color: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        progress: 80,
      };
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        progress: 100,
      };
    case "rejected":
      return {
        label: "Rejected",
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        progress: 0,
      };
    default:
      return {
        label: status,
        icon: Clock,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        progress: 0,
      };
  }
}

export function ProjectOverview({ fyp, submissions }: ProjectOverviewProps) {
  const statusInfo = getStatusInfo(fyp.status);
  const StatusIcon = statusInfo.icon;

  const approvedSubmissions = submissions.filter((s) => s.status === "approved").length;
  const pendingSubmissions = submissions.filter((s) => s.status === "pending").length;

  // Calculate progress based on approved submissions
  // Total components: proposal + 5 chapters + final thesis = 7
  const totalComponents = 7;
  const progressPercentage = Math.min(Math.round((approvedSubmissions / totalComponents) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={statusInfo.bgColor}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Project Status</p>
                <p className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <p className={`text-2xl font-bold ${statusInfo.color}`}>{progressPercentage}%</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {approvedSubmissions} of {totalComponents} components approved
          </p>
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Title</p>
            <p className={cn(
              "font-semibold text-lg",
              !fyp.title && "text-muted-foreground italic font-normal"
            )}>
              {fyp.title || "Proposal not yet approved"}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
            <p className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap",
              !fyp.description && "text-muted-foreground italic"
            )}>
              {fyp.description || "Project details will appear here once your proposal is approved by your supervisor."}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Calendar className="h-4 w-4" />
            <span>Started on {format(new Date(fyp.created_at), "MMMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Supervisor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Project Supervisor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fyp.supervisor ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={fyp.supervisor.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {fyp.supervisor.full_name?.charAt(0) || "S"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{fyp.supervisor.full_name}</p>
                <p className="text-sm text-muted-foreground">{fyp.supervisor.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <User className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">No supervisor assigned yet</p>
              <p className="text-xs mt-1">A supervisor will be assigned soon</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Submission Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{submissions.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{approvedSubmissions}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <div>
              <Clock className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">{pendingSubmissions}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Feedback */}
      {fyp.feedback && (
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-yellow-600" />
              Latest Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{fyp.feedback}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
