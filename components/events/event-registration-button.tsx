"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, Clock, AlertCircle, Calendar } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  registerForEvent,
  checkRegistrationStatus,
} from "@/lib/supabase/event-student-actions";
import { GuestRegistrationDialog } from "./guest-registration-dialog";
import { RegistrationConfirmationModal } from "./registration-confirmation-modal";
import type { DetailedEvent, RegistrationStatus } from "@/lib/constants/events";
import { isRegistrationOpen } from "@/lib/constants/events";
import { createClient } from "@/lib/supabase/client";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successStatus, setSuccessStatus] = useState<
    "success" | "error" | "waitlisted" | "existing"
  >("success");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      setCheckingStatus(true);

      // Check authentication
      const supabase = createClient();
      const {
        data: { session },
      } = await (supabase.auth as any).getSession();
      const isAuth = !!session;
      setIsAuthenticated(isAuth);

      // Only check registration status if authenticated
      if (isAuth) {
        const result = await checkRegistrationStatus(event.id);
        setIsRegistered(result.isRegistered);
        setRegistrationStatus(result.status);
      }

      setCheckingStatus(false);
    };

    checkAuthAndStatus();
  }, [event.id]);

  const handleRegisterClick = () => {
    // If not authenticated, show guest dialog
    if (!isAuthenticated) {
      setShowGuestDialog(true);
      return;
    }

    // Show confirmation dialog before registering
    setShowRegisterConfirm(true);
  };

  const handleConfirmRegister = async () => {
    setShowRegisterConfirm(false);
    setLoading(true);

    try {
      const result = await registerForEvent(event.id);

      if (result.success) {
        setIsRegistered(true);
        setRegistrationStatus(result.status as RegistrationStatus);

        // Show success modal
        if (result.status === "waitlisted") {
          setSuccessStatus("waitlisted");
          setSuccessMessage(result.message || "You've been added to the waitlist!");
        } else {
          setSuccessStatus("success");
          setSuccessMessage(result.message || "Registration successful!");
        }

        // Show success modal with slight delay
        setTimeout(() => {
          setShowSuccessModal(true);
          toast.success(result.message || "Successfully registered for the event!");
        }, 100);
      } else {
        // Show error
        setSuccessStatus("error");
        setSuccessMessage(result.error || "Failed to register");
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 100);
        toast.error(result.error || "Failed to register for the event");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setSuccessStatus("error");
      setSuccessMessage("An unexpected error occurred");
      toast.error("An unexpected error occurred");
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestRegistrationSuccess = () => {
    // Show success notification for guest registration
    toast.success("Registration successful! Check your email for confirmation.");
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
        <Button disabled variant="secondary" className={className}>
          <Clock className="h-4 w-4 mr-2" />
          On Waitlist
        </Button>
      );
    }

    return (
      <Button variant="secondary" className={className} disabled>
        <Check className="h-4 w-4 mr-2" />
        Registered
      </Button>
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
        onClick={handleRegisterClick}
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
    <>
      <Button onClick={handleRegisterClick} disabled={loading} className={className}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Calendar className="h-4 w-4 mr-2" />
        )}
        Register Now
        {event.available_spots !== null && event.available_spots <= 10 && (
          <span className="ml-2 text-xs opacity-75">
            ({event.available_spots} spots left)
          </span>
        )}
      </Button>

      {/* Guest Registration Dialog */}
      <GuestRegistrationDialog
        open={showGuestDialog}
        onOpenChange={setShowGuestDialog}
        eventId={event.id}
        eventTitle={event.title}
        eventDate={new Date(event.start_date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
        onSuccess={handleGuestRegistrationSuccess}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showRegisterConfirm} onOpenChange={setShowRegisterConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register for &quot;{event.title}&quot;?
              <div className="mt-4 p-3 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {new Date(event.start_date).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRegister} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Modal */}
      <RegistrationConfirmationModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        status={successStatus}
        message={successMessage}
        eventTitle={event.title}
        hasAccount={isAuthenticated}
        additionalInfo={{
          eventDate: new Date(event.start_date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        }}
      />
    </>
  );
}
