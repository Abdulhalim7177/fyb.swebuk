"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { checkInAttendee, undoCheckIn } from "@/lib/supabase/event-staff-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CheckInButtonProps {
  eventId: string;
  userId: string;
  isCheckedIn: boolean;
  status: string;
}

export function CheckInButton({
  eventId,
  userId,
  isCheckedIn,
  status,
}: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const result = await checkInAttendee(eventId, userId, "manual");
      if (result.success) {
        toast.success("Attendee checked in successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to check in attendee");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUndoCheckIn = async () => {
    setLoading(true);
    try {
      const result = await undoCheckIn(eventId, userId);
      if (result.success) {
        toast.success("Check-in undone successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to undo check-in");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "cancelled" || status === "no_show") {
    return null;
  }

  if (isCheckedIn) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUndoCheckIn}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <XCircle className="h-4 w-4 mr-2" />
            Undo
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleCheckIn}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <CheckCircle className="h-4 w-4 mr-2" />
          Check In
        </>
      )}
    </Button>
  );
}
