"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  createFYPWithAssignment,
  assignSupervisorToFYP,
} from "@/lib/supabase/fyp-admin-actions";
import { Loader2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

interface StudentAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Array<{
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    academic_level: number;
    has_fyp: boolean;
    fyp: {
      id: string;
      title: string;
      status: string;
      supervisor_id: string | null;
    } | null;
  }>;
  supervisors: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  onSuccess: () => void;
}

export function StudentAssignmentDialog({
  open,
  onOpenChange,
  students,
  supervisors,
  onSuccess,
}: StudentAssignmentDialogProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectDescription, setProjectDescription] = useState<string>("");

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  function resetForm() {
    setSelectedStudentId("");
    setSelectedSupervisorId("");
    setProjectTitle("");
    setProjectDescription("");
  }

  async function handleAssign() {
    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    if (!selectedSupervisorId) {
      toast.error("Please select a supervisor");
      return;
    }

    setIsAssigning(true);
    try {
      if (selectedStudent?.has_fyp && selectedStudent.fyp) {
        // Student already has FYP, just reassign supervisor
        const result = await assignSupervisorToFYP(selectedStudent.fyp.id, selectedSupervisorId);
        if (result.success) {
          toast.success("Supervisor reassigned successfully");
          onOpenChange(false);
          resetForm();
          onSuccess();
        } else {
          toast.error(result.error || "Failed to reassign supervisor");
        }
      } else {
        // Create new FYP with assignment
        const result = await createFYPWithAssignment(
          selectedStudentId,
          selectedSupervisorId,
          projectTitle || "FYP Project",
          projectDescription
        );
        if (result.success) {
          toast.success("FYP created and supervisor assigned successfully");
          onOpenChange(false);
          resetForm();
          onSuccess();
        } else {
          toast.error(result.error || "Failed to create FYP");
        }
      }
    } catch (error) {
      console.error("Error assigning student:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Student to Staff
          </DialogTitle>
          <DialogDescription>
            Assign a Level 400 student to a supervisor for their Final Year Project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">Select Student *</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={student.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {student.full_name?.charAt(0) || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{student.full_name}</span>
                      {student.has_fyp && (
                        <span className="text-xs text-amber-600">
                          (Has FYP)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudent && (
              <p className="text-sm text-muted-foreground">
                {selectedStudent.email}
                {selectedStudent.has_fyp && (
                  <span className="text-amber-600 ml-2">
                    - Current FYP: {selectedStudent.fyp?.title}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Supervisor Selection */}
          <div className="space-y-2">
            <Label htmlFor="supervisor">Select Supervisor *</Label>
            <Select value={selectedSupervisorId} onValueChange={setSelectedSupervisorId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a supervisor" />
              </SelectTrigger>
              <SelectContent>
                {supervisors.map((supervisor) => (
                  <SelectItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.full_name} - {supervisor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Details (only for new FYPs) */}
          {!selectedStudent?.has_fyp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="Enter project title"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter project description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={isAssigning || !selectedStudentId || !selectedSupervisorId}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                {selectedStudent?.has_fyp ? "Reassign Supervisor" : "Create FYP & Assign"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
