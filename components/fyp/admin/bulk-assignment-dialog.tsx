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
import { Checkbox } from "@/components/ui/checkbox";
import { bulkAssignSupervisor, assignSupervisorToFYP } from "@/lib/supabase/fyp-admin-actions";
import { Loader2, Users, Check } from "lucide-react";
import { toast } from "sonner";

interface BulkAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fyps: Array<{
    id: string;
    title: string;
    student: {
      full_name: string;
      avatar_url: string | null;
    } | null;
    created_at: string;
  }>;
  supervisors: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
  onSuccess: () => void;
}

export function BulkAssignmentDialog({
  open,
  onOpenChange,
  fyps,
  supervisors,
  onSuccess,
}: BulkAssignmentDialogProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [selectedFYPs, setSelectedFYPs] = useState<Set<string>>(new Set());

  const toggleFYP = (fypId: string) => {
    const newSelected = new Set(selectedFYPs);
    if (newSelected.has(fypId)) {
      newSelected.delete(fypId);
    } else {
      newSelected.add(fypId);
    }
    setSelectedFYPs(newSelected);
  };

  const selectAll = () => {
    setSelectedFYPs(new Set(fyps.map((f) => f.id)));
  };

  const deselectAll = () => {
    setSelectedFYPs(new Set());
  };

  async function handleBulkAssign() {
    if (!selectedSupervisor) {
      toast.error("Please select a supervisor");
      return;
    }

    if (selectedFYPs.size === 0) {
      toast.error("Please select at least one project");
      return;
    }

    setIsAssigning(true);
    try {
      const result = await bulkAssignSupervisor(
        Array.from(selectedFYPs),
        selectedSupervisor
      );

      if (result.success) {
        toast.success(`Successfully assigned ${result.count || selectedFYPs.size} projects to supervisor`);
        onOpenChange(false);
        setSelectedFYPs(new Set());
        setSelectedSupervisor("");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to assign supervisors");
      }
    } catch (error) {
      console.error("Error in bulk assignment:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Supervisor Assignment
          </DialogTitle>
          <DialogDescription>
            Assign multiple unassigned projects to a single supervisor at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Supervisor Selection */}
          <div className="space-y-2">
            <Label htmlFor="supervisor">Select Supervisor *</Label>
            <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
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

          {/* Project Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Projects ({selectedFYPs.size} selected)</Label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto space-y-2 p-3">
              {fyps.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No unassigned projects available
                </p>
              ) : (
                fyps.map((fyp) => (
                  <div
                    key={fyp.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedFYPs.has(fyp.id)
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleFYP(fyp.id)}
                  >
                    <Checkbox
                      checked={selectedFYPs.has(fyp.id)}
                      onCheckedChange={() => toggleFYP(fyp.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{fyp.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {fyp.student?.full_name || "Unknown Student"}
                      </p>
                    </div>
                    {selectedFYPs.has(fyp.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedFYPs(new Set());
              setSelectedSupervisor("");
            }}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleBulkAssign}
            disabled={isAssigning || !selectedSupervisor || selectedFYPs.size === 0}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Assign {selectedFYPs.size} Project{selectedFYPs.size !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
