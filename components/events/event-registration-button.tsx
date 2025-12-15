"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, X, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  registerForEvent,
  cancelRegistration,
  checkRegistrationStatus,
} from "@/lib/supabase/event-student-actions";
import type { DetailedEvent, RegistrationStatus } from "@/lib/constants/events";
import { isRegistrationOpen } from "@/lib/constants/events";

interface EventRegistrationButtonProps {
  event: DetailedEvent;
  className?: string;
}

export function EventRegistrationButton({
  event,
  className,
}: EventRegistrationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      setCheckingStatus(true);
      const result = await checkRegistrationStatus(event.id);
      setIsRegistered(result.isRegistered);
      setRegistrationStatus(result.status);
      setCheckingStatus(false);
    };

    checkStatus();
  }, [event.id]);

  const handleRegister = async () => {
    setLoading(true);
    const result = await registerForEvent(event.id);

    if (result.success) {
      toast.success(result.message);
      setIsRegistered(true);
      setRegistrationStatus(result.status as RegistrationStatus);
    } else {
      toast.error(result.error || "Failed to register");
    }
    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelRegistration(event.id);

    if (result.success) {
      toast.success(result.message);
      setIsRegistered(false);
      setRegistrationStatus(null);
    } else {
      toast.error(result.error || "Failed to cancel registration");
    }
    setLoading(false);
  };

  // Check if registration is open
  const registrationOpen = isRegistrationOpen(event);
  const eventEnded = new Date(event.end_date) < new Date();

  if (checkingStatus) {
    return (
      <Button disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  // Event has ended
  if (eventEnded) {
    return (
      <Button disabled variant="secondary" className={className}>
        Event Ended
      </Button>
    );
  }

  // Already registered
  if (isRegistered) {
    if (registrationStatus === "attended") {
      return (
        <Button disabled variant="secondary" className={className}>
          <Check className="h-4 w-4 mr-2" />
          Attended
        </Button>
      );
    }

    if (registrationStatus === "waitlisted") {
      return (
        <div className="space-y-2">
          <Button disabled variant="secondary" className={className}>
            <Clock className="h-4 w-4 mr-2" />
            On Waitlist
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                Cancel Waitlist
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Waitlist?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove yourself from the waitlist for
                  this event?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Position</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Cancel Waitlist
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Button variant="secondary" className={className} disabled>
          <Check className="h-4 w-4 mr-2" />
          Registered
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <X className="h-4 w-4 mr-2" />
              Cancel Registration
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your registration for &quot;
                {event.title}&quot;? You may lose your spot if the event fills
                up.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Registration</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Cancel Registration
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Registration closed
  if (!registrationOpen) {
    return (
      <Button disabled variant="secondary" className={className}>
        <AlertCircle className="h-4 w-4 mr-2" />
        Registration Closed
      </Button>
    );
  }

  // Event is full
  if (event.is_full) {
    return (
      <Button
        onClick={handleRegister}
        disabled={loading}
        variant="secondary"
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Clock className="h-4 w-4 mr-2" />
        )}
        Join Waitlist
      </Button>
    );
  }

  // Can register
  return (
    <Button onClick={handleRegister} disabled={loading} className={className}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : null}
      Register Now
      {event.available_spots !== null && event.available_spots <= 10 && (
        <span className="ml-2 text-xs opacity-75">
          ({event.available_spots} spots left)
        </span>
      )}
    </Button>
  );
}
