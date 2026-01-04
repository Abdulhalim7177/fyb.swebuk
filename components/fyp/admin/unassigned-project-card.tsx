"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { SupervisorAssignment } from "./supervisor-assignment";

interface UnassignedProjectCardProps {
  fyp: {
    id: string;
    title: string;
    student: {
      full_name: string;
      avatar_url: string | null;
    } | null;
    created_at: string;
  };
  supervisors: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
}

export function UnassignedProjectCard({ fyp, supervisors }: UnassignedProjectCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  return (
    <>
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 border rounded-lg hover:shadow-sm transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 border">
              <AvatarImage src={fyp.student?.avatar_url || undefined} />
              <AvatarFallback>{fyp.student?.full_name?.charAt(0) || "S"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="font-semibold text-sm sm:text-base truncate leading-tight">{fyp.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {fyp.student?.full_name} • <span className="text-muted-foreground/70">{new Date(fyp.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setIsAssigning(true)} className="w-full sm:w-auto shrink-0 bg-orange-600 hover:bg-orange-700 text-white border-none shadow-sm">
            <UserPlus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Assign Supervisor
          </Button>
        </div>
      </div>

      <SupervisorAssignment
        fypId={fyp.id}
        studentName={fyp.student?.full_name || "Student"}
        projectTitle={fyp.title}
        supervisors={supervisors}
        open={isAssigning}
        onOpenChange={setIsAssigning}
      />
    </>
  );
}
