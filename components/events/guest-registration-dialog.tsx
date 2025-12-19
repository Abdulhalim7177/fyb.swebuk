"use client";

import { useState } from "react";
import { Loader2, Mail, User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegistrationConfirmationModal } from "./registration-confirmation-modal";

interface GuestRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  onSuccess?: () => void;
}

export function GuestRegistrationDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  eventDate,
  onSuccess,
}: GuestRegistrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<
    "success" | "error" | "waitlisted" | "existing"
  >("success");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [hasAccount, setHasAccount] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      setConfirmationStatus("error");
      setConfirmationMessage("Please fill in all fields");
      setShowConfirmation(true);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setConfirmationStatus("error");
      setConfirmationMessage("Please enter a valid email address");
      setShowConfirmation(true);
      return;
    }

    setLoading(true);

    try {
      // Call API to register as guest
      const response = await fetch("/api/events/guest-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("already registered")) {
          setConfirmationStatus("existing");
        } else {
          setConfirmationStatus("error");
        }
        setConfirmationMessage(data.error || "Failed to register");
        setShowConfirmation(true);
        return;
      }

      // Success or waitlisted
      if (data.status === "waitlisted") {
        setConfirmationStatus("waitlisted");
      } else {
        setConfirmationStatus("success");
      }
      setConfirmationMessage(data.message || "Registration successful!");
      setHasAccount(data.hasAccount || false);

      // Close the form dialog first
      setFullName("");
      setEmail("");
      onOpenChange(false);

      // Then show confirmation (stays open until user closes)
      setShowConfirmation(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to register for event";
      setConfirmationStatus("error");
      setConfirmationMessage(message);
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register for Event</DialogTitle>
          <DialogDescription>
            Register for &quot;{eventTitle}&quot; by providing your details below.
            If you have an account with this email, we&apos;ll link it automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We&apos;ll send confirmation details to this email.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Now"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <RegistrationConfirmationModal
      open={showConfirmation}
      onOpenChange={setShowConfirmation}
      status={confirmationStatus}
      message={confirmationMessage}
      eventTitle={eventTitle}
      hasAccount={hasAccount}
      additionalInfo={{
        eventDate: eventDate,
      }}
    />
    </>
  );
}
