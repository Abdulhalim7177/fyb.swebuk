"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateFYPStatus, assignSupervisor, updateFYPGrade } from "@/lib/supabase/fyp-actions";
import { toast } from "sonner";
import { CheckCircle, XCircle, User, Award, FileCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface StaffFYPActionsProps {
  fyp: any;
  currentUserId: string;
}

export function StaffFYPActions({ fyp, currentUserId }: StaffFYPActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(fyp.status);
  const [feedback, setFeedback] = useState(fyp.feedback || "");
  const [grade, setGrade] = useState(fyp.grade || "");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoadingStaff(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("role", ["staff", "admin"])
        .order("full_name");

      if (!error && data) {
        setStaffMembers(data);
      }
      setLoadingStaff(false);
    };

    if (isAssignDialogOpen && !fyp.supervisor_id) {
      fetchStaff();
    }
  }, [isAssignDialogOpen, fyp.supervisor_id]);

  const handleStatusUpdate = async (newStatus: string, feedbackText?: string) => {
    setIsUpdating(true);
    try {
      const result = await updateFYPStatus(fyp.id, newStatus, feedbackText);
      if (result.success) {
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignSelf = async () => {
    setIsUpdating(true);
    try {
      const result = await assignSupervisor(fyp.id, currentUserId);
      if (result.success) {
        toast.success("You have been assigned as supervisor");
        setIsAssignDialogOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to assign supervisor");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignSupervisor = async () => {
    if (!selectedSupervisorId) {
      toast.error("Please select a supervisor");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await assignSupervisor(fyp.id, selectedSupervisorId);
      if (result.success) {
        toast.success("Supervisor assigned successfully");
        setIsAssignDialogOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to assign supervisor");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!grade.trim()) {
      toast.error("Please enter a grade");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateFYPGrade(fyp.id, grade, feedback);
      if (result.success) {
        toast.success("Grade submitted successfully");
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to submit grade");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Assign Supervisor */}
        {!fyp.supervisor_id && (
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                <User className="w-4 h-4 mr-2" />
                Assign Supervisor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Supervisor</DialogTitle>
                <DialogDescription>
                  Select a staff member to supervise this final year project.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Quick Assign Self */}
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Quick Action</p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={handleAssignSelf}
                    disabled={isUpdating}
                    size="sm"
                  >
                    Assign Myself
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or select staff</span>
                  </div>
                </div>

                {/* Staff Selection */}
                {loadingStaff ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Loading staff members...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    <Label className="text-sm font-medium">Select Supervisor</Label>
                    {staffMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No staff members found</p>
                    ) : (
                      <div className="space-y-2">
                        {staffMembers.map((staff) => (
                          <button
                            key={staff.id}
                            onClick={() => setSelectedSupervisorId(staff.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                              selectedSupervisorId === staff.id
                                ? "border-primary bg-primary/10"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={staff.avatar_url || undefined} />
                              <AvatarFallback>{staff.full_name?.charAt(0) || "S"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{staff.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                            </div>
                            {selectedSupervisorId === staff.id && (
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAssignDialogOpen(false);
                    setSelectedSupervisorId("");
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignSupervisor}
                  disabled={isUpdating || !selectedSupervisorId}
                >
                  {isUpdating ? "Assigning..." : "Assign Supervisor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Approve Proposal */}
        {fyp.status === "proposal_submitted" && (
          <>
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
              onClick={() => handleStatusUpdate("proposal_approved")}
              disabled={isUpdating}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Proposal
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full" size="sm">
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Proposal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Proposal</DialogTitle>
                  <DialogDescription>
                    Please provide feedback explaining why this proposal is being rejected.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Enter feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate("rejected", feedback)}
                    disabled={isUpdating || !feedback.trim()}
                  >
                    {isUpdating ? "Rejecting..." : "Reject Proposal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Mark as In Progress */}
        {fyp.status === "proposal_approved" && (
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={() => handleStatusUpdate("in_progress")}
            disabled={isUpdating}
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Mark as In Progress
          </Button>
        )}

        {/* Mark as Ready for Review */}
        {fyp.status === "in_progress" && (
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={() => handleStatusUpdate("ready_for_review")}
            disabled={isUpdating}
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Mark Ready for Review
          </Button>
        )}

        {/* Grade and Complete */}
        {(fyp.status === "ready_for_review" || fyp.status === "in_progress") && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" className="w-full" size="sm">
                <Award className="w-4 h-4 mr-2" />
                Submit Grade & Complete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Final Grade</DialogTitle>
                <DialogDescription>
                  Enter the final grade for this project and any final feedback.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    placeholder="e.g., A, B+, 85, etc."
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="final-feedback">Final Feedback (Optional)</Label>
                  <Textarea
                    id="final-feedback"
                    placeholder="Enter final comments and feedback..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleGradeSubmit}
                  disabled={isUpdating || !grade.trim()}
                >
                  {isUpdating ? "Submitting..." : "Submit Grade"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Status Update */}
        <div className="pt-3 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">Change Status</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proposal_submitted">Proposal Submitted</SelectItem>
              <SelectItem value="proposal_approved">Proposal Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="ready_for_review">Ready for Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {selectedStatus !== fyp.status && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-2"
              onClick={() => handleStatusUpdate(selectedStatus)}
              disabled={isUpdating}
            >
              Update Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
